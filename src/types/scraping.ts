import { ScrapingJob, ScrapingSource, JobStatus } from "@prisma/client";

export type { ScrapingJob, ScrapingSource, JobStatus };

export interface ScrapingJobCreateInput {
  source: ScrapingSource;
  keywords: string;
  location: string;
  maxResults?: number;
}

export interface ScrapingProgressEvent {
  jobId: string;
  scraped: number;
  total: number;
  dupes: number;
  lastLead?: {
    businessName: string;
    city: string;
    source: string;
  };
  status: JobStatus;
  error?: string;
}

export const SCRAPING_SOURCE_LABELS: Record<ScrapingSource, string> = {
  PAGES_JAUNES: "Pages Jaunes",
  YELP: "Yelp",
  GOOGLE_MAPS: "Google Maps",
};

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  ECHOUE: "Échoué",
  ANNULE: "Annulé",
};

export const QUEBEC_CITIES = [
  "Montréal",
  "Québec",
  "Laval",
  "Gatineau",
  "Longueuil",
  "Sherbrooke",
  "Lévis",
  "Saguenay",
  "Trois-Rivières",
  "Terrebonne",
  "Saint-Jean-sur-Richelieu",
  "Repentigny",
  "Brossard",
  "Dollard-des-Ormeaux",
  "Drummondville",
  "Saint-Jérôme",
  "Granby",
  "Blainville",
  "Mirabel",
  "Shawinigan",
];
