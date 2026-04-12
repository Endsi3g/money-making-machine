import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getGmailStatus } from "@/lib/email/gmail-oauth";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  const status = await getGmailStatus(workspaceId);
  return NextResponse.json(status);
}
