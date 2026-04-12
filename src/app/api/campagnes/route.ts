import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";
import { CampaignStatus } from "@prisma/client";

const createCampaignSchema = z.object({
  name: z.string().min(1, "Nom de campagne requis"),
  type: z.enum(["STANDARD", "A_B"]).default("STANDARD"),
  subject: z.string().min(1, "Sujet requis"),
  bodyHtml: z.string().min(1, "Corps du message requis"),
  subjectB: z.string().optional(),
  bodyHtmlB: z.string().optional(),
  bodyText: z.string().optional(),
  bodyTextB: z.string().optional(),
  fromName: z.string().optional(),
  fromEmail: z.string().email().optional(),
  replyTo: z.string().email().optional(),
  emailsPerHour: z.number().int().min(1).max(500).default(50),
  leadIds: z.array(z.string()).optional(),
});

// GET — list campaigns for the workspace
export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const rawStatus = searchParams.get("status");
  const validStatuses = Object.values(CampaignStatus) as string[];
  const status = rawStatus && validStatuses.includes(rawStatus)
    ? (rawStatus as CampaignStatus)
    : undefined;

  const campaigns = await prisma.campaign.findMany({
    where: {
      workspaceId,
      ...(status && { status }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { campaignLeads: true },
      },
    },
  });

  return NextResponse.json({ campaigns });
}

// POST — create a new campaign
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { leadIds, ...campaignData } = parsed.data;

    const campaign = await prisma.campaign.create({
      data: {
        ...campaignData,
        workspaceId,
      },
    });

    // Attach leads to the campaign if provided
    if (leadIds && leadIds.length > 0) {
      // Validate leads belong to workspace
      const leads = await prisma.lead.findMany({
        where: { id: { in: leadIds }, workspaceId },
        select: { id: true },
      });

      await prisma.campaignLead.createMany({
        data: leads.map((lead, index) => ({
          campaignId: campaign.id,
          leadId: lead.id,
          // Répartition 50/50 pour l'A/B testing simple
          variation: campaign.type === "A_B" ? (index % 2 === 0 ? "A" : "B") : "A",
        })),
        skipDuplicates: true,
      });

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { totalRecipients: leads.length },
      });
    }

    return NextResponse.json(campaign, { status: 201 });
  } catch (err) {
    console.error("[CAMPAIGN_CREATE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
