import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkspaceRole } from "@prisma/client";
import { NextResponse } from "next/server";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  AGENT: 1,
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null };
  }
  return { error: null, session };
}

export async function requireWorkspaceAccess(
  workspaceId: string,
  minRole: WorkspaceRole = WorkspaceRole.AGENT
) {
  const { error, session } = await requireAuth();
  if (error || !session) return { error: error ?? NextResponse.json({ error: "Non autorisé" }, { status: 401 }), session: null, membership: null };

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: session.user.id,
      },
    },
  });

  if (!membership) {
    return {
      error: NextResponse.json({ error: "Accès refusé à ce workspace" }, { status: 403 }),
      session: null,
      membership: null,
    };
  }

  if (ROLE_HIERARCHY[membership.role] < ROLE_HIERARCHY[minRole]) {
    return {
      error: NextResponse.json(
        { error: `Rôle requis: ${minRole}` },
        { status: 403 }
      ),
      session: null,
      membership: null,
    };
  }

  return { error: null, session, membership };
}

export async function getDefaultWorkspaceId(userId: string): Promise<string | null> {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    orderBy: { invitedAt: "asc" },
    select: { workspaceId: true },
  });
  return membership?.workspaceId ?? null;
}

export async function logActivity(
  workspaceId: string,
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>
) {
  await prisma.activityLog.create({
    data: {
      workspaceId,
      userId,
      action,
      entityType,
      entityId,
      metadata,
    },
  });
}
