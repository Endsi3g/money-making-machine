import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { emailQueue } from "@/lib/queues/email-queue";
import { getGmailStatus } from "@/lib/email/gmail-oauth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  // Rate limit: 5 campaign launches per workspace per hour
  const rl = await rateLimit({ key: `campaign-send:${workspaceId}`, limit: 5, duration: 3600 });
  if (!rl.success) return rateLimitResponse(rl.limit, rl.remaining, rl.reset);

  // Verify Gmail is connected
  const gmailStatus = await getGmailStatus(workspaceId);
  if (!gmailStatus.connected) {
    return NextResponse.json(
      { error: "Gmail n'est pas connecté. Allez dans Paramètres > Gmail." },
      { status: 400 }
    );
  }

  // Load campaign with leads
  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, workspaceId },
    include: {
      campaignLeads: {
        where: { status: "EN_ATTENTE" },
        include: {
          lead: { select: { email: true, emailExtracted: true } },
        },
      },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (campaign.status !== "BROUILLON" && campaign.status !== "PLANIFIE") {
    return NextResponse.json(
      { error: "Cette campagne ne peut pas être envoyée dans son état actuel" },
      { status: 400 }
    );
  }

  // Filter leads that have a valid email
  const sendableLeads = campaign.campaignLeads.filter((cl) => {
    const email = cl.lead.email || cl.lead.emailExtracted;
    return email && email.includes("@");
  });

  if (sendableLeads.length === 0) {
    return NextResponse.json(
      { error: "Aucun destinataire avec un email valide" },
      { status: 400 }
    );
  }

  // Update campaign status to EN_COURS
  await prisma.campaign.update({
    where: { id: campaign.id },
    data: { status: "EN_COURS" },
  });

  // Queue all email jobs with rate-limited delay
  const delayBetweenEmails = Math.ceil(3600000 / campaign.emailsPerHour); // ms between emails

  for (let i = 0; i < sendableLeads.length; i++) {
    const cl = sendableLeads[i];
    await emailQueue.add(
      `email-${cl.id}`,
      {
        campaignLeadId: cl.id,
        campaignId: campaign.id,
        workspaceId,
      },
      {
        delay: i * delayBetweenEmails,
      }
    );
  }

  console.log(`[EMAIL_CAMPAIGN] Campaign ${campaign.id}: ${sendableLeads.length} emails queued`);

  return NextResponse.json(
    {
      success: true,
      message: `${sendableLeads.length} email(s) en file d'attente`,
      queued: sendableLeads.length,
    },
    { status: 202 }
  );
}
