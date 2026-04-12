import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API pour gérer les paramètres du Workspace (Agence).
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      name, 
      twilioAccountSid, 
      twilioAuthToken, 
      twilioFromNumber 
    } = body;

    const updated = await prisma.workspace.update({
      where: { id: session.user.workspaceId },
      data: {
        name: name || undefined,
        twilioAccountSid: twilioAccountSid !== undefined ? twilioAccountSid : undefined,
        twilioAuthToken: twilioAuthToken !== undefined ? twilioAuthToken : undefined,
        twilioFromNumber: twilioFromNumber !== undefined ? twilioFromNumber : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[Workspace Settings] Error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.workspaceId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const workspace = await prisma.workspace.findUnique({
      where: { id: session.user.workspaceId },
    });

    return NextResponse.json(workspace);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
