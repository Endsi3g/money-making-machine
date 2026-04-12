import * as cheerio from "cheerio";
import { extractEmails } from "./email-extractor";

export interface WebsiteAnalysis {
  text: string;        // cleaned visible text, max 3000 chars
  description: string; // <meta description> or first paragraph
  emails: string[];    // emails found in the raw HTML
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract emails from raw HTML before cleaning
    const emails = extractEmails(html);

    // Remove non-content noise
    $("script, style, nav, footer, header, aside, noscript, iframe").remove();

    // Get meta description
    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() ||
      $("p").first().text().trim().slice(0, 300) ||
      "";

    // Get visible text
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 3000);

    return { text, description, emails };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
