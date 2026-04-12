import dns from "dns/promises";

const EMAIL_FORMAT_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_FORMAT_RE.test(email);
}

export async function hasMxRecords(email: string): Promise<boolean> {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;
    const records = await dns.resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}

export async function verifyEmail(email: string): Promise<{ valid: boolean; reason?: string }> {
  if (!isValidEmailFormat(email)) {
    return { valid: false, reason: "Format invalide" };
  }
  const hasRecords = await hasMxRecords(email);
  if (!hasRecords) {
    return { valid: false, reason: "Domaine sans serveur mail (MX)" };
  }
  return { valid: true };
}
