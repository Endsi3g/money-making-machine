import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { z } from "zod";
import { LeadStatus } from "@prisma/client";

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1),
  action: z.enum(["delete", "archive", "changeStatus"]),
  payload: z
    .object({
      status: z.nativeEnum(LeadStatus).optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;

  try {
    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { ids, action, payload } = parsed.data;

    // Verify all leads belong to this workspace
    const count = await prisma.lead.count({
      where: { id: { in: ids }, workspaceId },
    });

    if (count !== ids.length) {
      return NextResponse.json({ error: "Accès non autorisé à certains prospects" }, { status: 403 });
    }

    if (action === "delete") {
      await prisma.lead.deleteMany({ where: { id: { in: ids }, workspaceId } });
      return NextResponse.json({ success: true, affected: ids.length });
    }

    if (action === "archive") {
      await prisma.lead.updateMany({
        where: { id: { in: ids }, workspaceId },
        data: { status: LeadStatus.ARCHIVE },
      });
      return NextResponse.json({ success: true, affected: ids.length });
    }

    if (action === "changeStatus" && payload?.status) {
      await prisma.lead.updateMany({
        where: { id: { in: ids }, workspaceId },
        data: { status: payload.status },
      });
      return NextResponse.json({ success: true, affected: ids.length });
    }

    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  } catch (err) {
    console.error("[BULK_ACTION]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
