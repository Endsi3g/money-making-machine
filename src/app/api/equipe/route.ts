import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

// GET — list all workspace members
export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: { invitedAt: "asc" },
  });

  // Also fetch pending invites
  const invites = await prisma.workspaceInvite.findMany({
    where: {
      workspaceId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ members, invites });
}
