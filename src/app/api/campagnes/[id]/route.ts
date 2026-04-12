import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";

const updateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  bodyHtml: z.string().optional(),
  bodyText: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional().nullable(),
  emailsPerHour: z.number().int().min(1).max(500).optional(),
});

// GET — single campaign with recipients
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize = 50;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, workspaceId },
    include: {
      campaignLeads: {
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { id: "asc" },
        include: {
          lead: {
            select: {
              id: true,
              businessName: true,
              email: true,
              emailExtracted: true,
              city: true,
              category: true,
              status: true,
            },
          },
        },
      },
      _count: { select: { campaignLeads: true } },
    },
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  return NextResponse.json(campaign);
}

// PATCH — update campaign
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;

  const existing = await prisma.campaign.findFirst({
    where: { id: params.id, workspaceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (existing.status !== "BROUILLON") {
    return NextResponse.json(
      { error: "Seules les campagnes en brouillon peuvent être modifiées" },
      { status: 400 }
    );
  }

  const body = await req.json();
  const parsed = updateCampaignSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(campaign);
}

// DELETE — delete campaign (only if BROUILLON)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;

  const existing = await prisma.campaign.findFirst({
    where: { id: params.id, workspaceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Campagne introuvable" }, { status: 404 });
  }

  if (existing.status !== "BROUILLON") {
    return NextResponse.json(
      { error: "Seules les campagnes en brouillon peuvent être supprimées" },
      { status: 400 }
    );
  }

  await prisma.campaign.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
