import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logActivity } from "@/lib/auth-helpers";
import { z } from "zod";
import { LeadStatus } from "@prisma/client";

const updateLeadSchema = z.object({
  businessName: z.string().min(1).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  facebook: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  linkedin: z.string().optional().nullable(),
  twitter: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(LeadStatus).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
    include: {
      campaignLeads: {
        include: { campaign: { select: { id: true, name: true, status: true } } },
        orderBy: { sentAt: "desc" },
        take: 5,
      },
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
  }

  return NextResponse.json(lead);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const existing = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const parsed = updateLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await logActivity(session.user.workspaceId!, session.user.id, "LEAD_UPDATED", "Lead", lead.id, {
      businessName: lead.businessName,
    });

    return NextResponse.json(lead);
  } catch (err) {
    console.error("[LEAD_UPDATE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const existing = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId: session.user.workspaceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
  }

  await prisma.lead.delete({ where: { id: params.id } });

  await logActivity(session.user.workspaceId!, session.user.id, "LEAD_DELETED", "Lead", params.id, {
    businessName: existing.businessName,
  });

  return NextResponse.json({ success: true });
}
