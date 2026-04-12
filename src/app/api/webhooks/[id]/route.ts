import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { active, events, name, url } = await req.json();

    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook || webhook.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });
    }

    const updated = await prisma.webhook.update({
      where: { id: params.id },
      data: {
        active: active !== undefined ? active : undefined,
        events: events || undefined,
        name: name || undefined,
        url: url || undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: params.id },
    });

    if (!webhook || webhook.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: "Webhook introuvable" }, { status: 404 });
    }

    await prisma.webhook.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
