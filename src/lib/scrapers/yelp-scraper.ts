import { BaseScraper, ScrapedLead, ScrapeOptions } from "./base-scraper";
import { createContext } from "./utils/browser-pool";
import { RATE_LIMITERS } from "./utils/rate-limiter";
import type { Page } from "playwright";

export class YelpScraper extends BaseScraper {
  async *scrape(options: ScrapeOptions): AsyncGenerator<ScrapedLead> {
    const { keywords, location, maxResults } = options;
    const rateLimiter = RATE_LIMITERS.YELP;

    const context = await createContext();
    const page = await context.newPage();

    try {
      let scraped = 0;
      let offset = 0;

      while (scraped < maxResults) {
        const searchUrl = `https://www.yelp.ca/search?find_desc=${encodeURIComponent(keywords)}&find_loc=${encodeURIComponent(location)}&start=${offset}`;

        await rateLimiter.acquire();

        try {
          await page.goto(searchUrl, { waitUntil: "networkidle", timeout: 30000 });
          await page.waitForTimeout(1500 + Math.random() * 1000);

          // Extract business links from search results
          const links = await page.$$eval(
            '[data-testid="serp-ia-card"] a[href*="/biz/"], .businessName__373c0__WORTHY a',
            (anchors) =>
              [...new Set(anchors.map((a) => (a as HTMLAnchorElement).href))]
                .filter((href) => href.includes("yelp.ca/biz") || href.includes("yelp.com/biz"))
                .slice(0, 10)
          );

          if (links.length === 0) break;

          for (const link of links) {
            if (scraped >= maxResults) break;

            await rateLimiter.acquire();

            try {
              const lead = await this.scrapeListing(page, link);
              if (lead) {
                scraped++;
                yield lead;
              }
            } catch (err) {
              console.error(`[Yelp] Error scraping ${link}:`, err);
            }
          }

          offset += 10;
          if (links.length < 10) break;
        } catch (err) {
          console.error(`[Yelp] Error at offset ${offset}:`, err);
          break;
        }
      }
    } finally {
      await page.close();
      await context.close();
    }
  }

  private async scrapeListing(page: Page, url: string): Promise<ScrapedLead | null> {
    // Remove query params to get the canonical URL
    const cleanUrl = url.split("?")[0];
    await page.goto(cleanUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1000 + Math.random() * 500);

    const data = await page.evaluate(() => {
      const getText = (selector: string): string =>
        document.querySelector(selector)?.textContent?.trim() || "";

      const name = getText("h1[class*='businessName'], .biz-page-title, h1.heading--h1");
      const phone = getText("a[href^='tel:'], p.phone");
      const website = (document.querySelector("a[href*='biz-website']") as HTMLAnchorElement)?.href || "";

      // Address extraction
      const addressEl = document.querySelector("address, [class*='mapBoxText'], .lemon--address__373c0__2sPac");
      const addressText = addressEl?.textContent?.trim() || "";

      // Rating
      const ratingEl = document.querySelector("[class*='five-stars'] span, .i-stars");
      const ratingText = ratingEl?.getAttribute("aria-label") || "";
      const ratingMatch = ratingText.match(/([\d.]+)\s*star/i);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

      // Review count
      const reviewEl = document.querySelector("[class*='reviewCount'], .review-count");
      const reviewCount = reviewEl
        ? parseInt(reviewEl.textContent?.replace(/\D/g, "") || "0")
        : undefined;

      // Category
      const category = getText("[class*='categoryLink'], .category-str-list");

      // Description
      const description = getText(".businessDescription-longform, .from-the-business [class*='paragraph']");

      return { name, phone, website, addressText, rating, reviewCount, category, description };
    });

    if (!data.name) return null;

    // Parse address text into components
    const addressParts = data.addressText.split(",").map((s) => s.trim());
    const city = addressParts.length > 1 ? addressParts[addressParts.length - 2] : "";
    const address = addressParts.slice(0, -2).join(", ");

    return {
      businessName: data.name,
      category: data.category || undefined,
      address: address || undefined,
      city: city || undefined,
      province: "QC",
      phone: data.phone?.replace(/\D/g, "").slice(-10) || undefined,
      website: data.website || undefined,
      rating: data.rating,
      reviewCount: data.reviewCount || undefined,
      description: data.description || undefined,
      sourceUrl: cleanUrl,
    };
  }
}
