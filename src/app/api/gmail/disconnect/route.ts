import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { disconnectGmail } from "@/lib/email/gmail-oauth";

export async function POST() {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const workspaceId = session.user.workspaceId;
  if (!workspaceId) {
    return NextResponse.json({ error: "Aucun workspace trouvé" }, { status: 400 });
  }

  await disconnectGmail(workspaceId);
  return NextResponse.json({ success: true, message: "Gmail déconnecté" });
}
