import { Lead, LeadStatus, LeadSource } from "@prisma/client";

export type { Lead, LeadStatus, LeadSource };

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  city?: string;
  category?: string;
  cursor?: string;
  take?: number;
}

export interface LeadCreateInput {
  businessName: string;
  category?: string;
  description?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
  twitter?: string;
  tags?: string[];
  notes?: string;
}

export interface LeadWithStats extends Lead {
  campaignCount?: number;
  lastContactedAt?: Date;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  NOUVEAU: "Nouveau",
  ENRICHI: "Enrichi",
  CONTACTE: "Contacté",
  REPONDU: "Répondu",
  CONVERTI: "Converti",
  ARCHIVE: "Archivé",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  PAGES_JAUNES: "Pages Jaunes",
  YELP: "Yelp",
  GOOGLE_MAPS: "Google Maps",
  MANUEL: "Manuel",
  IMPORT: "Importé",
};

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NOUVEAU: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  ENRICHI: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  CONTACTE: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  REPONDU: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  CONVERTI: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  ARCHIVE: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};
