import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API pour détecter les doublons potentiels.
 * Basé sur le nom du commerce (insensible à la casse/espaces) et la ville.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // On récupère tous les prospects du workspace
    // Pour une détection plus fine sur de gros volumes, il faudrait faire un GROUP BY en SQL pur
    // Mais Prisma groupBy ne supporte pas bien le fuzzy matching
    
    // Approche SQL Raw pour performance
    const duplicates = await prisma.$queryRaw`
      SELECT 
        LOWER(TRIM("businessName")) as "normalizedName", 
        LOWER(TRIM("city")) as "normalizedCity", 
        COUNT(*) as "count",
        array_agg(id) as "ids"
      FROM "Lead"
      WHERE "workspaceId" = ${session.user.workspaceId}
      GROUP BY "normalizedName", "normalizedCity"
      HAVING COUNT(*) > 1
      ORDER BY "count" DESC
    `;

    // Hydrater les données des leads pour l'UI
    const groups = await Promise.all((duplicates as any[]).map(async (group: any) => {
      const leads = await prisma.lead.findMany({
        where: { id: { in: group.ids } },
      });
      return {
        name: group.normalizedName,
        city: group.normalizedCity,
        count: group.count,
        leads
      };
    }));

    return NextResponse.json(groups);
  } catch (error) {
    console.error("[Doublons] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la détection" }, { status: 500 });
  }
}
