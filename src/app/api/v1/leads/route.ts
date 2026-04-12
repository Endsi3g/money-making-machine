import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * API Publique V1 - Lecture des prospects.
 * Cette route est accessible via Clé API.
 */
export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.headers.get("X-Workspace-Id");

    if (!workspaceId) {
      return NextResponse.json({ error: "Clé API manquante ou invalide" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get("take") || "20"), 100);
    const skip = parseInt(searchParams.get("skip") || "0");

    const leads = await prisma.lead.findMany({
      where: { workspaceId },
      take,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        businessName: true,
        email: true,
        phone: true,
        website: true,
        city: true,
        status: true,
        score: true,
        category: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      data: leads,
      meta: {
        count: leads.length,
        take,
        skip,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
