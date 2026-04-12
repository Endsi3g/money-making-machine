import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { exchangeCode } from "@/lib/email/gmail-oauth";

export async function GET(req: NextRequest) {
  const { error, session } = await requireAuth();
  if (error || !session) return error;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/parametres/gmail?error=missing_code", req.url));
  }

  const workspaceId = Buffer.from(state, "base64url").toString();

  // Security: make sure the workspace from the state matches the session
  if (workspaceId !== session.user.workspaceId) {
    return NextResponse.redirect(new URL("/parametres/gmail?error=workspace_mismatch", req.url));
  }

  try {
    await exchangeCode(code, workspaceId);
    return NextResponse.redirect(new URL("/parametres/gmail?success=true", req.url));
  } catch (err) {
    console.error("[GMAIL_CALLBACK]", err);
    return NextResponse.redirect(new URL("/parametres/gmail?error=exchange_failed", req.url));
  }
}
