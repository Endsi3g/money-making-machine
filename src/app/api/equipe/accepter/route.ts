import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logActivity } from "@/lib/auth-helpers";

// POST — accept an invite by token
export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token requis" }, { status: 400 });
    }

    const invite = await prisma.workspaceInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation expirée" }, { status: 410 });
    }

    // Verify email matches
    if (invite.email !== session.user.email) {
      return NextResponse.json(
        { error: "Cette invitation est destinée à une autre adresse email" },
        { status: 403 }
      );
    }

    // Check not already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      // Clean up invite and return success
      await prisma.workspaceInvite.delete({ where: { token } });
      return NextResponse.json({ success: true, message: "Vous êtes déjà membre" });
    }

    // Create membership + delete invite in a transaction
    await prisma.$transaction([
      prisma.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId: session.user.id,
          role: invite.role,
          joinedAt: new Date(),
        },
      }),
      prisma.workspaceInvite.delete({ where: { token } }),
    ]);

    await logActivity(
      invite.workspaceId,
      session.user.id,
      "MEMBER_JOINED",
      "WorkspaceMember",
      session.user.id,
      { email: session.user.email, role: invite.role }
    );

    return NextResponse.json({
      success: true,
      message: "Vous avez rejoint le workspace",
      workspaceId: invite.workspaceId,
    });
  } catch (err) {
    console.error("[INVITE_ACCEPT]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
