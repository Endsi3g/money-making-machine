import type { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import type { EmailJobData } from "@/lib/queues/email-queue";
import { sendEmail } from "@/lib/email/gmail-client";
import { getGmailProfile } from "@/lib/email/gmail-client";
import { buildVariables, prepareEmail } from "@/lib/email/template-renderer";
import { verifyEmail } from "@/lib/email/email-verifier";

export async function processEmailJob(job: Job<EmailJobData>): Promise<void> {
  const { campaignLeadId, campaignId, workspaceId } = job.data;

  console.log(`[EMAIL] Processing email job for CampaignLead ${campaignLeadId}`);

  // 1. Load campaign lead + lead + campaign
  const campaignLead = await prisma.campaignLead.findUnique({
    where: { id: campaignLeadId },
    include: {
      lead: true,
      campaign: true,
    },
  });

  if (!campaignLead) {
    console.error(`[EMAIL] CampaignLead ${campaignLeadId} not found`);
    return;
  }

  if (campaignLead.status !== "EN_ATTENTE") {
    console.log(`[EMAIL] CampaignLead ${campaignLeadId} already processed (status: ${campaignLead.status})`);
    return;
  }

  const { lead, campaign } = campaignLead;
  const recipientEmail = lead.email || lead.emailExtracted;

  if (!recipientEmail) {
    console.error(`[EMAIL] No email for lead ${lead.id}`);
    await prisma.campaignLead.update({
      where: { id: campaignLeadId },
      data: { status: "ECHOUE" },
    });
    return;
  }

  // 2. Verify email before sending
  const verification = await verifyEmail(recipientEmail);
  await prisma.campaignLead.update({
    where: { id: campaignLeadId },
    data: { emailVerified: verification.valid },
  });

  if (!verification.valid) {
    console.warn(`[EMAIL] Email invalid for ${lead.businessName}: ${verification.reason}`);
    await prisma.$transaction([
      prisma.campaignLead.update({
        where: { id: campaignLeadId },
        data: { status: "REBONDI", bouncedAt: new Date() },
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: { totalBounced: { increment: 1 } },
      }),
      prisma.emailLog.create({
        data: {
          campaignId,
          campaignLeadId,
          leadId: lead.id,
          workspaceId,
          event: "REBONDI",
          metadata: { reason: verification.reason },
        },
      }),
    ]);
    return;
  }

  // 3. Get sender profile
  const profile = await getGmailProfile(workspaceId);

  // 4. Render template
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const variables = buildVariables(lead);

  // Déterminer les templates à utiliser selon la variation A/B
  const variation = campaignLead.variation || "A";
  const targetSubject = (variation === "B" && campaign.subjectB) ? campaign.subjectB : campaign.subject;
  const targetHtml = (variation === "B" && campaign.bodyHtmlB) ? campaign.bodyHtmlB : campaign.bodyHtml;

  const { subject, html } = prepareEmail(
    targetSubject,
    targetHtml,
    variables,
    campaignLead.trackingId,
    baseUrl
  );

  // 5. Send via Gmail
  try {
    await sendEmail(workspaceId, {
      to: recipientEmail,
      from: campaign.fromEmail || profile.email,
      fromName: campaign.fromName || profile.name,
      subject,
      html,
      replyTo: campaign.replyTo || undefined,
    });

    // 6. Update status
    await prisma.$transaction([
      prisma.campaignLead.update({
        where: { id: campaignLeadId },
        data: {
          status: "ENVOYE",
          sentAt: new Date(),
          personalizedSubject: subject,
          personalizedBody: html,
        },
      }),
      prisma.campaign.update({
        where: { id: campaignId },
        data: {
          totalSent: { increment: 1 },
          totalDelivered: { increment: 1 },
        },
      }),
      prisma.lead.update({
        where: { id: lead.id },
        data: { status: "CONTACTE" },
      }),
      prisma.emailLog.create({
        data: {
          campaignId,
          campaignLeadId,
          leadId: lead.id,
          workspaceId,
          event: "ENVOYE",
          metadata: { to: recipientEmail, subject },
        },
      }),
    ]);

    console.log(`[EMAIL] ✅ Sent to ${recipientEmail} (${lead.businessName})`);
  } catch (err) {
    console.error(`[EMAIL] ❌ Failed to send to ${recipientEmail}:`, err);

    await prisma.$transaction([
      prisma.campaignLead.update({
        where: { id: campaignLeadId },
        data: { status: "ECHOUE" },
      }),
      prisma.emailLog.create({
        data: {
          campaignId,
          campaignLeadId,
          leadId: lead.id,
          workspaceId,
          event: "ECHOUE",
          metadata: { error: String(err) },
        },
      }),
    ]);

    throw err; // Re-throw for BullMQ retry
  }

  // 7. Check if campaign is complete
  const remaining = await prisma.campaignLead.count({
    where: { campaignId, status: "EN_ATTENTE" },
  });

  if (remaining === 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "TERMINE" },
    });
    console.log(`[EMAIL] 🏁 Campaign ${campaignId} completed`);
  }
}
