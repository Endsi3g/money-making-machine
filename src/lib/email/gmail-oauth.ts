import crypto from "crypto";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const key = process.env.GMAIL_ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("GMAIL_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return Buffer.from(key, "hex");
}

function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(data: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = data.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/gmail/callback`
  );
}

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getAuthUrl(workspaceId: string): string {
  const oauth2Client = createOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force refresh token on every connect
    state: Buffer.from(workspaceId).toString("base64url"),
  });
}

export async function exchangeCode(code: string, workspaceId: string): Promise<void> {
  const oauth2Client = createOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error("Missing tokens from Google OAuth exchange");
  }

  oauth2Client.setCredentials(tokens);

  // Get connected email address
  const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
  const { data: userInfo } = await oauth2.userinfo.get();

  await prisma.gmailToken.upsert({
    where: { workspaceId },
    create: {
      workspaceId,
      email: userInfo.email!,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date!),
      scope: tokens.scope ?? SCOPES.join(" "),
    },
    update: {
      email: userInfo.email!,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token),
      expiresAt: new Date(tokens.expiry_date!),
      scope: tokens.scope ?? SCOPES.join(" "),
    },
  });
}

export async function getValidToken(workspaceId: string) {
  const record = await prisma.gmailToken.findUnique({ where: { workspaceId } });
  if (!record) throw new Error(`No Gmail token for workspace ${workspaceId}`);

  const oauth2Client = createOAuth2Client();
  oauth2Client.setCredentials({
    access_token: decrypt(record.accessToken),
    refresh_token: decrypt(record.refreshToken),
    expiry_date: record.expiresAt.getTime(),
  });

  // Auto-refresh if expiring within 5 minutes
  const fiveMinutes = 5 * 60 * 1000;
  if (record.expiresAt.getTime() - Date.now() < fiveMinutes) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await prisma.gmailToken.update({
      where: { workspaceId },
      data: {
        accessToken: encrypt(credentials.access_token!),
        expiresAt: new Date(credentials.expiry_date!),
      },
    });
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

export async function getGmailStatus(workspaceId: string): Promise<{ connected: boolean; email?: string }> {
  const record = await prisma.gmailToken.findUnique({
    where: { workspaceId },
    select: { email: true },
  });
  if (!record) return { connected: false };
  return { connected: true, email: record.email };
}

export async function disconnectGmail(workspaceId: string): Promise<void> {
  await prisma.gmailToken.delete({ where: { workspaceId } }).catch(() => null);
}
