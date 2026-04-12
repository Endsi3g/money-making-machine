import { google } from "googleapis";
import { getValidToken } from "./gmail-oauth";

export interface SendEmailOptions {
  to: string;
  from: string;
  fromName: string;
  subject: string;
  html: string;
  replyTo?: string;
}

// Build an RFC 2822-compliant raw message for Gmail API
function buildRawMessage(options: SendEmailOptions): string {
  const { to, from, fromName, subject, html, replyTo } = options;

  // Base64-encode subject for non-ASCII support
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;

  const lines = [
    `From: ${fromName} <${from}>`,
    `To: ${to}`,
    replyTo ? `Reply-To: ${replyTo}` : null,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    html,
  ].filter(Boolean);

  return Buffer.from(lines.join("\r\n")).toString("base64url");
}

export async function sendEmail(workspaceId: string, options: SendEmailOptions): Promise<void> {
  const auth = await getValidToken(workspaceId);
  const gmail = google.gmail({ version: "v1", auth });

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: buildRawMessage(options) },
  });
}

export async function getGmailProfile(workspaceId: string): Promise<{ email: string; name: string }> {
  const auth = await getValidToken(workspaceId);
  const gmail = google.gmail({ version: "v1", auth });
  const oauth2 = google.oauth2({ version: "v2", auth });

  const [profileRes, userInfoRes] = await Promise.all([
    gmail.users.getProfile({ userId: "me" }),
    oauth2.userinfo.get(),
  ]);

  return {
    email: profileRes.data.emailAddress!,
    name: userInfoRes.data.name || profileRes.data.emailAddress!,
  };
}
