import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { LeadSource, LeadStatus } from "@prisma/client";
import { dispatchWebhook } from "@/lib/webhooks/webhook-dispatcher";

const createLeadSchema = z.object({
  businessName: z.string().min(1, "Nom d'entreprise requis"),
  category: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  twitter: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") as LeadStatus | null;
  const source = searchParams.get("source") as LeadSource | null;
  const city = searchParams.get("city") || "";
  const cursor = searchParams.get("cursor") || undefined;
  const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);

  const where = {
    workspaceId,
    ...(search && {
      OR: [
        { businessName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { city: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(status && { status }),
    ...(source && { source }),
    ...(city && { city: { contains: city, mode: "insensitive" as const } }),
  };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      take: take + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: "desc" },
    }),
    prisma.lead.count({ where }),
  ]);

  const hasMore = leads.length > take;
  const items = hasMore ? leads.slice(0, take) : leads;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ leads: items, total, nextCursor, hasMore });
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = createLeadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        ...parsed.data,
        workspaceId,
        source: LeadSource.MANUEL,
        email: parsed.data.email || null,
        website: parsed.data.website || null,
      },
    });

    await logActivity(workspaceId, session.user.id, "LEAD_CREATED", "Lead", lead.id, {
      businessName: lead.businessName,
    });

    // Envoyer le webhook
    await dispatchWebhook("LEAD_CREATED", lead, workspaceId);

    return NextResponse.json(lead, { status: 201 });
  } catch (err) {
    console.error("[LEAD_CREATE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
