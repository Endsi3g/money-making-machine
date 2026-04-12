import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { enrichmentQueue } from "@/lib/queues/enrichment-queue";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, workspaceId },
  });

  if (!lead) {
    return NextResponse.json({ error: "Prospect non trouvé" }, { status: 404 });
  }

  // Already enriched — idempotent, return existing data
  if (lead.status === "ENRICHI" && lead.enrichedAt) {
    return NextResponse.json({ success: true, alreadyEnriched: true, lead });
  }

  await enrichmentQueue.add("enrich", { leadId: params.id, workspaceId });

  return NextResponse.json(
    { success: true, message: "Enrichissement lancé" },
    { status: 202 }
  );
}
