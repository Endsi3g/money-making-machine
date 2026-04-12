import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { analyzeWebsite } from "@/lib/enrichment/website-analyzer";
import { enrichLeadWithOllama } from "@/lib/enrichment/ollama-client";
import type { EnrichmentJobData } from "@/lib/queues/enrichment-queue";

export async function processEnrichmentJob(job: Job<EnrichmentJobData>): Promise<void> {
  const { leadId, workspaceId } = job.data;

  console.log(`[ENRICHMENT] Processing lead ${leadId}`);

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, workspaceId },
  });

  if (!lead) {
    throw new Error(`[ENRICHMENT] Lead ${leadId} not found in workspace ${workspaceId}`);
  }

  // Analyze website if available
  let websiteText = "";
  let emailExtracted: string | null = null;

  if (lead.website) {
    console.log(`[ENRICHMENT] Fetching website: ${lead.website}`);
    const analysis = await analyzeWebsite(lead.website);
    if (analysis) {
      websiteText = analysis.text;
      emailExtracted = analysis.emails[0] ?? null;
    }
  }

  // AI enrichment via local Ollama
  const enrichmentResult = await enrichLeadWithOllama({
    businessName: lead.businessName,
    category: lead.category,
    city: lead.city,
    description: lead.description,
    websiteText,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
    phone: lead.phone,
    email: lead.email || emailExtracted,
  });

  // Calculate generic score dynamically based on Ollama sub-scores (0-100 scale)
  const aggregatedScore = Math.round(
    (enrichmentResult.fitScore +
      enrichmentResult.urgencyScore +
      enrichmentResult.contactabilityScore) / 3
  );

  // Persist results
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      aiSummary: enrichmentResult.aiSummary,
      aiPersonalization: "Ollama ne génère pas la string old format", // legacy field fallback
      emailExtracted,
      enrichedAt: new Date(),
      score: aggregatedScore,
      status: "ENRICHI",
      
      // New Ollama metrics
      fitScore: enrichmentResult.fitScore,
      urgencyScore: enrichmentResult.urgencyScore,
      webGapScore: enrichmentResult.webGapScore,
      seoGapScore: enrichmentResult.seoGapScore,
      contentMaturityScore: enrichmentResult.contentMaturityScore,
      digitalAiMaturityScore: enrichmentResult.digitalAiMaturityScore,
      contactabilityScore: enrichmentResult.contactabilityScore,
      reputationSignalScore: enrichmentResult.reputationSignalScore,
      personalizationConfidenceScore: enrichmentResult.personalizationConfidenceScore,
      
      // Outputs & flags
      suggestedAngle: enrichmentResult.suggestedAngle,
      suggestedOffer: enrichmentResult.suggestedOffer,
      draftEmail: enrichmentResult.draftEmail,
      complianceFlags: enrichmentResult.complianceFlags,
      requiresHumanReview: enrichmentResult.requiresHumanReview,
    },
  });

  console.log(`[ENRICHMENT] Lead ${leadId} enriched — score: ${aggregatedScore}, email: ${emailExtracted ?? "none"}`);
}
