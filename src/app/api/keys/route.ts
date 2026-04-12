import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/api-keys";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
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

    const { name, scopes, expiresAt } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Nom requis" }, { status: 400 });
    }

    const { key, keyHash, keyPrefix } = generateApiKey();

    const apiKey = await prisma.apiKey.create({
      data: {
        workspaceId: session.user.workspaceId,
        name,
        keyHash,
        keyPrefix,
        scopes: scopes || ["leads:read"],
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // On retourne la clé brute (key) SEULEMENT à la création
    return NextResponse.json({ ...apiKey, key });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création de la clé" }, { status: 500 });
  }
}
