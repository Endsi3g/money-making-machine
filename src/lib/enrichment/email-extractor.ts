// g flag only for match(); create fresh instances to avoid lastIndex issues
const EMAIL_PATTERN = "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}";
const ASSET_EXTENSIONS = /\.(png|jpg|jpeg|gif|svg|ico|pdf|zip|css|js)$/i;

function isValidEmail(s: string): boolean {
  return new RegExp(`^${EMAIL_PATTERN}$`).test(s) && !ASSET_EXTENSIONS.test(s);
}

export function extractEmails(html: string): string[] {
  const found = new Set<string>();

  // All emails in the raw HTML
  const matches = html.match(new RegExp(EMAIL_PATTERN, "g")) || [];
  for (const match of matches) {
    if (!ASSET_EXTENSIONS.test(match)) {
      found.add(match.toLowerCase());
    }
  }

  // mailto: href values
  const mailtoMatches = html.match(/mailto:([^"'\s>?]+)/gi) || [];
  for (const match of mailtoMatches) {
    const email = match.replace(/^mailto:/i, "").split("?")[0];
    if (isValidEmail(email)) {
      found.add(email.toLowerCase());
    }
  }

  return [...found];
}
