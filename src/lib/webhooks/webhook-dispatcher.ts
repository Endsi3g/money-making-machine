import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export type WebhookEvent = 
  | "LEAD_CREATED" 
  | "LEAD_UPDATED" 
  | "LEAD_ENRICHED" 
  | "CAMPAIGN_SENT" 
  | "EMAIL_OPENED" 
  | "EMAIL_CLICKED";

/**
 * Dispatcher pour envoyer des notifications webhooks sortantes vers Zapier/Make/etc.
 */
export async function dispatchWebhook(
  event: WebhookEvent,
  payload: any,
  workspaceId: string
) {
  try {
    // 1. Récupérer les webhooks actifs pour ce workspace et cet événement
    const webhooks = await prisma.webhook.findMany({
      where: {
        workspaceId,
        active: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) return;

    for (const webhook of webhooks) {
      // 2. Préparer le payload avec métadonnées
      const body = JSON.stringify({
        id: crypto.randomUUID(),
        event,
        timestamp: new Date().toISOString(),
        workspaceId,
        data: payload,
      });

      // 3. Calculer la signature HMAC-SHA256 (Sécurité)
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");

      // 4. Envoyer la requête POST
      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-MMM-Signature": signature,
            "X-MMM-Event": event,
            "User-Agent": "MoneyMakingMachine-Webhook/1.0",
          },
          body,
        });

        // 5. Mettre à jour le statut du webhook
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            lastStatus: response.status,
          },
        });
      } catch (err) {
        console.error(`[Webhook] Failed to send to ${webhook.url}:`, err);
        await prisma.webhook.update({
          where: { id: webhook.id },
          data: {
            lastTriggeredAt: new Date(),
            lastStatus: 500,
          },
        });
      }
    }
  } catch (error) {
    console.error("[Webhook Dispatcher] Error:", error);
  }
}
