import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const trackingId = searchParams.get("t");
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  if (trackingId) {
    try {
      const cl = await prisma.campaignLead.findUnique({
        where: { trackingId },
        select: { id: true, campaignId: true, clickedAt: true },
      });

      if (cl && !cl.clickedAt) {
        await prisma.$transaction([
          prisma.campaignLead.update({
            where: { id: cl.id },
            data: { clickedAt: new Date(), status: "CLIQUE" },
          }),
          prisma.campaign.update({
            where: { id: cl.campaignId },
            data: { totalClicked: { increment: 1 } },
          }),
          prisma.emailLog.create({
            data: {
              campaignId: cl.campaignId,
              campaignLeadId: cl.id,
              event: "CLIQUE",
              metadata: {
                url,
                userAgent: req.headers.get("user-agent") ?? "unknown",
              },
            },
          }),
        ]);
      }
    } catch (err) {
      console.error("[TRACKING_LINK]", err);
    }
  }

  return NextResponse.redirect(url, 302);
}
