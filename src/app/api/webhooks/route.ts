import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const webhooks = await prisma.webhook.findMany({
      where: { workspaceId: session.user.workspaceId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(webhooks);
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

    const { name, url, events } = await req.json();

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const webhook = await prisma.webhook.create({
      data: {
        workspaceId: session.user.workspaceId,
        name,
        url,
        events,
        secret: crypto.randomBytes(32).toString("hex"),
        active: true,
      },
    });

    return NextResponse.json(webhook);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la création du webhook" }, { status: 500 });
  }
}
