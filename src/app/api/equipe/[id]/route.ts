import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, logActivity } from "@/lib/auth-helpers";
import { WorkspaceRole } from "@prisma/client";
import { z } from "zod";

const updateMemberSchema = z.object({
  role: z.nativeEnum(WorkspaceRole),
});

// PATCH — update member role
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  // Check caller's role
  const callerMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });

  if (!callerMember || callerMember.role !== "OWNER") {
    return NextResponse.json(
      { error: "Seul le OWNER peut modifier les rôles" },
      { status: 403 }
    );
  }

  // Find target member
  const targetMember = await prisma.workspaceMember.findFirst({
    where: { id: params.id, workspaceId },
    include: { user: { select: { email: true } } },
  });

  if (!targetMember) {
    return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
  }

  // Cannot change own role
  if (targetMember.userId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas modifier votre propre rôle" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsed = updateMemberSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: params.id },
      data: { role: parsed.data.role },
    });

    await logActivity(workspaceId, session.user.id, "MEMBER_ROLE_CHANGED", "WorkspaceMember", params.id, {
      email: targetMember.user.email,
      oldRole: targetMember.role,
      newRole: parsed.data.role,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[MEMBER_UPDATE]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE — remove member from workspace
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  // Check caller's role
  const callerMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });

  if (!callerMember || (callerMember.role !== "OWNER" && callerMember.role !== "ADMIN")) {
    return NextResponse.json(
      { error: "Seuls les OWNER et ADMIN peuvent retirer des membres" },
      { status: 403 }
    );
  }

  // Find target
  const targetMember = await prisma.workspaceMember.findFirst({
    where: { id: params.id, workspaceId },
    include: { user: { select: { email: true } } },
  });

  if (!targetMember) {
    return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
  }

  // Cannot remove self
  if (targetMember.userId === session.user.id) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas vous retirer du workspace" },
      { status: 400 }
    );
  }

  // Cannot remove someone with equal or higher role (unless OWNER)
  const roleHierarchy: Record<string, number> = { OWNER: 3, ADMIN: 2, AGENT: 1 };
  if (
    callerMember.role !== "OWNER" &&
    roleHierarchy[targetMember.role] >= roleHierarchy[callerMember.role]
  ) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas retirer un membre de rôle égal ou supérieur" },
      { status: 403 }
    );
  }

  await prisma.workspaceMember.delete({ where: { id: params.id } });

  await logActivity(workspaceId, session.user.id, "MEMBER_REMOVED", "WorkspaceMember", params.id, {
    email: targetMember.user.email,
    role: targetMember.role,
  });

  return NextResponse.json({ success: true });
}
