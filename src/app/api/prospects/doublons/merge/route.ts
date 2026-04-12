import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API pour fusionner des doublons.
 * Le lead "keepId" survit et récupère les données manquantes des "mergeIds".
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { keepId, mergeIds } = await req.json();

    if (!keepId || !mergeIds || !Array.isArray(mergeIds)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const masterLead = await prisma.lead.findUnique({ where: { id: keepId } });
    if (!masterLead || masterLead.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: "Lead maître introuvable" }, { status: 404 });
    }

    const secondaryLeads = await prisma.lead.findMany({
      where: { id: { in: mergeIds }, workspaceId: session.user.workspaceId }
    });

    // 1. Fusionner les données (on garde la valeur du maître si elle existe, sinon on prend une valeur secondaire)
    const updateData: any = {};
    const fieldsToMerge = ["email", "phone", "website", "address", "category", "description", "facebook", "instagram", "linkedin", "twitter"];

    for (const field of fieldsToMerge) {
      if (!(masterLead as any)[field]) {
        const found = secondaryLeads.find(l => (l as any)[field]);
        if (found) {
          updateData[field] = (found as any)[field];
        }
      }
    }

    // 2. Mettre à jour le maître
    await prisma.lead.update({
      where: { id: keepId },
      data: updateData,
    });

    // 3. Réassigner les relations (CampaignLead, EmailLog)
    // BullMQ ne bougera pas, mais les données DB oui.
    await prisma.campaignLead.updateMany({
      where: { leadId: { in: mergeIds } },
      data: { leadId: keepId },
    });

    await prisma.emailLog.updateMany({
      where: { leadId: { in: mergeIds } },
      data: { leadId: keepId },
    });

    await prisma.smsLog.updateMany({
      where: { leadId: { in: mergeIds } },
      data: { leadId: keepId },
    });

    // 4. Supprimer les doublons
    await prisma.lead.deleteMany({
      where: { id: { in: mergeIds } },
    });

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
        action: "MERGE_LEADS",
        entityType: "LEAD",
        entityId: keepId,
        metadata: { mergedCount: mergeIds.length, secondaryIds: mergeIds },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Merge] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la fusion" }, { status: 500 });
  }
}
