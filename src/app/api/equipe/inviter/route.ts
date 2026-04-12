import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logActivity } from "@/lib/auth-helpers";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email("Email invalide"),
  role: z.nativeEnum(WorkspaceRole).default(WorkspaceRole.AGENT),
});

export async function POST(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  // Rate limit: 10 invitations per workspace per hour
  const rl = await rateLimit({ key: `invite:${workspaceId}`, limit: 10, duration: 3600 });
  if (!rl.success) return rateLimitResponse(rl.limit, rl.remaining, rl.reset);

  // Check that the inviter is at least ADMIN
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: session.user.id },
    },
  });

  if (!membership || (membership.role !== "OWNER" && membership.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "Seuls les OWNER et ADMIN peuvent inviter des membres" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = inviteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, role } = parsed.data;

    // Cannot invite with higher role than self
    const roleHierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, AGENT: 1 };
    if (roleHierarchy[role] > roleHierarchy[membership.role]) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas inviter quelqu'un avec un rôle supérieur au vôtre" },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      const existingMember = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId: existingUser.id },
        },
      });
      if (existingMember) {
        return NextResponse.json(
          { error: "Cet utilisateur est déjà membre du workspace" },
          { status: 409 }
        );
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.workspaceInvite.findUnique({
      where: { workspaceId_email: { workspaceId, email } },
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      return NextResponse.json(
        { error: "Une invitation est déjà en attente pour cet email" },
        { status: 409 }
      );
    }

    // Create or update invite (7-day expiry)
    const invite = await prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId, email } },
      create: {
        workspaceId,
        email,
        role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      update: {
        role,
        token: undefined, // will auto-generate via @default(cuid())
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await logActivity(workspaceId, session.user.id, "MEMBER_INVITED", "WorkspaceInvite", invite.id, {
      email,
      role,
    });

    return NextResponse.json(
      { success: true, invite, message: `Invitation envoyée à ${email}` },
      { status: 201 }
    );
  } catch (err) {
    console.error("[INVITE_CREATE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
