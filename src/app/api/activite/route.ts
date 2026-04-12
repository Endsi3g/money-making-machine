import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);
  const entityType = searchParams.get("entityType") || undefined;

  const where = {
    workspaceId,
    ...(entityType && { entityType }),
  };

  const logs = await prisma.activityLog.findMany({
    where,
    take: take + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  const hasMore = logs.length > take;
  const items = hasMore ? logs.slice(0, take) : logs;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  return NextResponse.json({ logs: items, nextCursor, hasMore });
}
