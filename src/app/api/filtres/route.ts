import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API pour gérer les filtres sauvegardés par workspace.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const filters = await prisma.savedFilter.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(filters);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { name, filters } = await req.json();

    if (!name || !filters) {
      return NextResponse.json({ error: "Nom et filtres requis" }, { status: 400 });
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        workspaceId: session.user.workspaceId,
        name,
        filters,
      },
    });

    return NextResponse.json(savedFilter);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du filtre" }, { status: 500 });
  }
}
