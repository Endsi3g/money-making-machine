import { Campaign, CampaignStatus, EmailStatus } from "@prisma/client";

export type { Campaign, CampaignStatus, EmailStatus };

export interface CampaignCreateInput {
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  fromName?: string;
  fromEmail?: string;
  replyTo?: string;
  emailsPerHour?: number;
  recipientLeadIds: string[];
}

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  BROUILLON: "Brouillon",
  PLANIFIE: "Planifié",
  EN_COURS: "En cours",
  TERMINE: "Terminé",
  PAUSE: "En pause",
};

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  EN_ATTENTE: "En attente",
  ENVOYE: "Envoyé",
  DELIVRE: "Délivré",
  OUVERT: "Ouvert",
  CLIQUE: "Cliqué",
  REBONDI: "Rebondi",
  DESINSCRIT: "Désinscrit",
  ECHOUE: "Échoué",
};
