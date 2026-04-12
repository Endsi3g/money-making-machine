import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1×1 transparent GIF (43 bytes)
const PIXEL_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

export async function GET(req: NextRequest) {
  const trackingId = new URL(req.url).searchParams.get("t");

  if (trackingId) {
    try {
      // Update CampaignLead.openedAt + Campaign.totalOpened
      const cl = await prisma.campaignLead.findUnique({
        where: { trackingId },
        select: { id: true, campaignId: true, openedAt: true },
      });

      if (cl && !cl.openedAt) {
        await prisma.$transaction([
          prisma.campaignLead.update({
            where: { id: cl.id },
            data: { openedAt: new Date(), status: "OUVERT" },
          }),
          prisma.campaign.update({
            where: { id: cl.campaignId },
            data: { totalOpened: { increment: 1 } },
          }),
          prisma.emailLog.create({
            data: {
              campaignId: cl.campaignId,
              campaignLeadId: cl.id,
              event: "OUVERT",
              metadata: {
                userAgent: req.headers.get("user-agent") ?? "unknown",
                ip: req.headers.get("x-forwarded-for") ?? "unknown",
              },
            },
          }),
        ]);
      }
    } catch (err) {
      // Silently fail — tracking should never break the email experience
      console.error("[TRACKING_PIXEL]", err);
    }
  }

  return new NextResponse(PIXEL_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Content-Length": String(PIXEL_GIF.length),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
