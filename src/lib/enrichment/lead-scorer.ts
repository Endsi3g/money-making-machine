interface LeadScoreInput {
  email: string | null;
  emailExtracted: string | null;
  website: string | null;
  phone: string | null;
  aiSummary: string | null;
  rating: number | null;
}

// Rule-based 0-100 score based on data completeness:
// +10  email found (scraped or extracted)
// +15  website present
// +20  phone present
// +25  AI enrichment completed (aiSummary populated)
// +30  high rating (≥ 4.5)
export function scoreLead(lead: LeadScoreInput): number {
  let score = 0;

  if (lead.email || lead.emailExtracted) score += 10;
  if (lead.website) score += 15;
  if (lead.phone) score += 20;
  if (lead.aiSummary) score += 25;
  if (lead.rating !== null && lead.rating >= 4.5) score += 30;

  return Math.min(score, 100);
}
