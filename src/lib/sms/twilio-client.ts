import twilio from "twilio";
import { prisma } from "@/lib/prisma";

/**
 * Client Twilio optionnel.
 * Vérifie la configuration du workspace avant d'envoyer.
 */
export async function sendSms(
  workspaceId: string,
  to: string,
  message: string,
  leadId?: string
) {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        twilioAccountSid: true,
        twilioAuthToken: true,
        twilioFromNumber: true,
      },
    });

    if (!workspace?.twilioAccountSid || !workspace?.twilioAuthToken || !workspace?.twilioFromNumber) {
      throw new Error("Configuration Twilio manquante pour ce workspace");
    }

    const client = twilio(workspace.twilioAccountSid, workspace.twilioAuthToken);

    const response = await client.messages.create({
      body: message,
      from: workspace.twilioFromNumber,
      to,
    });

    // Logger l'envoi
    await prisma.smsLog.create({
      data: {
        workspaceId,
        leadId,
        to,
        message,
        sid: response.sid,
        status: response.status,
      },
    });

    return { success: true, sid: response.sid };
  } catch (error) {
    console.error("[Twilio SMS] Error:", error);
    
    if (leadId) {
      await prisma.smsLog.create({
        data: {
          workspaceId,
          leadId,
          to,
          message,
          status: "failed",
          errorMessage: String(error),
        },
      });
    }
    
    throw error;
  }
}
