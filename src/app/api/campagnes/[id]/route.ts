import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET — single campaign with recipients
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;

  const campaign = await prisma.campaign.findFirst({
    where: { id: params.id, workspaceId },
    include: {
      campaignLeads: {
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

  const campaign = await prisma.campaign.update({
    where: { id: params.id },
    data: {
      name: body.name,
      subject: body.subject,
      bodyHtml: body.bodyHtml,
      bodyText: body.bodyText,
      fromName: body.fromName,
      fromEmail: body.fromEmail,
      replyTo: body.replyTo,
      emailsPerHour: body.emailsPerHour,
    },
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
