import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { analyzeWebsite } from "@/lib/enrichment/website-analyzer";
import { enrichLead } from "@/lib/enrichment/claude-client";
import { scoreLead } from "@/lib/enrichment/lead-scorer";
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

  // AI enrichment via Claude
  const enrichmentResult = await enrichLead({
    businessName: lead.businessName,
    category: lead.category,
    city: lead.city,
    description: lead.description,
    websiteText,
    rating: lead.rating,
    reviewCount: lead.reviewCount,
  });

  // Compute deterministic score
  const score = scoreLead({
    email: lead.email,
    emailExtracted,
    website: lead.website,
    phone: lead.phone,
    aiSummary: enrichmentResult.aiSummary,
    rating: lead.rating,
  });

  // Persist results
  await prisma.lead.update({
    where: { id: leadId },
    data: {
      aiSummary: enrichmentResult.aiSummary,
      aiPersonalization: enrichmentResult.aiPersonalization,
      emailExtracted,
      enrichedAt: new Date(),
      score,
      status: "ENRICHI",
    },
  });

  console.log(`[ENRICHMENT] Lead ${leadId} enriched — score: ${score}, email: ${emailExtracted ?? "none"}`);
}
