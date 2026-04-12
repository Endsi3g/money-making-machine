import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export interface LeadContext {
  businessName: string;
  category: string | null;
  city: string | null;
  description: string | null;
  websiteText: string;
  rating: number | null;
  reviewCount: number | null;
}

export interface EnrichmentResult {
  aiSummary: string;         // 2-3 sentence business summary in French
  aiPersonalization: string; // 1-2 sentence outreach hook in French
}

const SYSTEM_PROMPT = `Tu es un expert en analyse d'entreprises québécoises pour une agence de marketing numérique.
Analyse les informations fournies sur une entreprise et génère:
1. Un résumé concis de l'entreprise (2-3 phrases en français)
2. Une accroche personnalisée pour une approche par email (1-2 phrases en français qui montrent que tu connais leur business)

Réponds UNIQUEMENT avec un JSON valide dans ce format exact, sans texte avant ou après:
{"aiSummary": "...", "aiPersonalization": "..."}`;

export async function enrichLead(lead: LeadContext): Promise<EnrichmentResult> {
  const userMessage = `Entreprise: ${lead.businessName}
Catégorie: ${lead.category || "Non spécifiée"}
Ville: ${lead.city || "Non spécifiée"}
Description: ${lead.description || "Non disponible"}
Contenu du site web: ${lead.websiteText || "Site web non disponible"}
Note clients: ${lead.rating ? `${lead.rating}/5 (${lead.reviewCount ?? 0} avis)` : "Non disponible"}`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("[ENRICHMENT] Unexpected non-text response from Claude");
  }

  let parsed: EnrichmentResult;
  try {
    // Strip any markdown code fences Claude might add despite instructions
    const raw = content.text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[ENRICHMENT] Failed to parse Claude response: ${content.text}`);
  }

  if (!parsed.aiSummary || !parsed.aiPersonalization) {
    throw new Error(`[ENRICHMENT] Missing fields in Claude response: ${content.text}`);
  }

  return parsed;
}
