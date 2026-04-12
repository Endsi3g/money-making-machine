import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const key = await prisma.apiKey.findUnique({
      where: { id: params.id },
    });

    if (!key || key.workspaceId !== session.user.workspaceId) {
      return NextResponse.json({ error: "Clé introuvable" }, { status: 404 });
    }

    await prisma.apiKey.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
