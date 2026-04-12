

export interface OllamaLeadContext {
  businessName: string;
  category: string | null;
  city: string | null;
  description: string | null;
  websiteText: string;
  rating: number | null;
  reviewCount: number | null;
  phone: string | null;
  email: string | null;
}

export interface OllamaEnrichmentResult {
  aiSummary: string;
  fitScore: number;
  urgencyScore: number;
  webGapScore: number;
  seoGapScore: number;
  contentMaturityScore: number;
  digitalAiMaturityScore: number;
  contactabilityScore: number;
  reputationSignalScore: number;
  personalizationConfidenceScore: number;
  suggestedAngle: string;
  suggestedOffer: string;
  draftEmail: string;
  complianceFlags: string[];
  requiresHumanReview: boolean;
}

const SYSTEM_PROMPT = `Tu es un Agent IA de prospection B2B locale pour le marché québécois.
Ta mission : Analyser les prospects B2B, évaluer leur maturité digitale et générer un email de cold outreach crédible, bilingue si nécessaire (français par défaut, anglais si dominant).

Règles strictes :
1. N'invente AUCUNE information. Base-toi uniquement sur les signaux web partagés.
2. Évite les compliments génériques. 
3. Génère des scores (de 0 à 100) basés sur des heuristiques réelles de carences (ex: site daté = forte urgence).
4. Le 'draftEmail' doit être court (80-160 mots), professionnel, aller droit au but, mentionner un problème détecté, et suggérer une piste d'amélioration.

TU DOIS RÉPONDRE UNIQUEMENT ET STRICTEMENT AVEC DU JSON VALIDE CORRESPONDANT AU SCHÉMA SUIVANT, SANS AUCUN TEXTE AUTOUR, PAS DE MARKDOWN:
{
  "aiSummary": "Résumé de ce que fait l'entreprise",
  "fitScore": 0-100,
  "urgencyScore": 0-100,
  "webGapScore": 0-100,
  "seoGapScore": 0-100,
  "contentMaturityScore": 0-100,
  "digitalAiMaturityScore": 0-100,
  "contactabilityScore": 0-100,
  "reputationSignalScore": 0-100,
  "personalizationConfidenceScore": 0-100,
  "suggestedAngle": "ex: Manque de SEO local ou refonte de site mobile",
  "suggestedOffer": "Audits SEO gratuits, Refonte, Automatisation",
  "draftEmail": "Sujet: ...\\n\\nBonjour...",
  "complianceFlags": ["LOW_CONFIDENCE_CONTACT", "LANGUAGE_AMBIGUITY"], // ou tableau vide []
  "requiresHumanReview": true/false
}`;

export async function enrichLeadWithOllama(lead: OllamaLeadContext): Promise<OllamaEnrichmentResult> {
  const userMessage = `
Entreprise: ${lead.businessName}
Catégorie: ${lead.category || "Non spécifiée"}
Ville: ${lead.city || "Non spécifiée"}
Téléphone: ${lead.phone || "Non spécifié"}
Email: ${lead.email || "Non spécifié"}
Note clients Google: ${lead.rating ? `${lead.rating}/5 (${lead.reviewCount ?? 0} avis)` : "Non disponible"}

Description Scrapée:
${lead.description || "Aucune"}

Contenu Web Principal extrait:
${lead.websiteText ? lead.websiteText.substring(0, 4000) : "Site web inaccessible ou vide."}
  `;

  // DEFAULT OLLAMA URL: http://127.0.0.1:11434/api/generate
  const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/generate";
  const MODEL = process.env.OLLAMA_MODEL || "llama3"; 

  const response = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      system: SYSTEM_PROMPT,
      prompt: userMessage,
      stream: false,
      format: "json", // Forcer Ollama à retourner du JSON (fonctionnalité native des modèles récents)
    }),
  });

  if (!response.ok) {
    throw new Error(\`[OLLAMA] Erreur API \${response.status}: \${response.statusText}\`);
  }

  const data = await response.json();
  const content = data.response;

  let parsed: OllamaEnrichmentResult;
  try {
    const raw = content.replace(/^\\s*\`\`\`(?:json)?\\n?/i, "").replace(/\\n?\`\`\`\\s*$/i, "").trim();
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(\`[OLLAMA] JSON parse failed. Raw: \${content}\`);
  }

  // Fallback compliance checking
  if (parsed.personalizationConfidenceScore < 50) {
    if (!parsed.complianceFlags.includes("LOW_PERSONALIZATION_CONFIDENCE")) {
      parsed.complianceFlags.push("LOW_PERSONALIZATION_CONFIDENCE");
    }
    parsed.requiresHumanReview = true;
  }

  return parsed;
}
