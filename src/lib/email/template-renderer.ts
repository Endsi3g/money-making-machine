import Handlebars from "handlebars";
import { injectTrackingPixel, rewriteLinks } from "./tracking";

export interface TemplateVariables {
  businessName: string;
  firstName: string;       // first word of businessName
  city: string;
  category: string;
  email: string;
  phone: string;
  rating: string;
  aiPersonalization: string;
}

export function buildVariables(lead: {
  businessName: string;
  city: string | null;
  category: string | null;
  email: string | null;
  emailExtracted: string | null;
  phone: string | null;
  rating: number | null;
  aiPersonalization: string | null;
}): TemplateVariables {
  return {
    businessName: lead.businessName,
    firstName: lead.businessName.split(/[\s,]+/)[0],
    city: lead.city ?? "",
    category: lead.category ?? "",
    email: lead.email ?? lead.emailExtracted ?? "",
    phone: lead.phone ?? "",
    rating: lead.rating?.toString() ?? "",
    aiPersonalization: lead.aiPersonalization ?? "",
  };
}

export function renderTemplate(template: string, variables: TemplateVariables): string {
  const compiled = Handlebars.compile(template);
  return compiled(variables);
}

export function prepareEmail(
  subjectTemplate: string,
  bodyHtmlTemplate: string,
  variables: TemplateVariables,
  trackingId: string,
  baseUrl: string
): { subject: string; html: string } {
  const subject = renderTemplate(subjectTemplate, variables);
  let html = renderTemplate(bodyHtmlTemplate, variables);
  html = rewriteLinks(html, trackingId, baseUrl);
  html = injectTrackingPixel(html, trackingId, baseUrl);
  return { subject, html };
}
