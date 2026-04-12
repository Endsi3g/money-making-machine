import { BaseScraper, ScrapedLead, ScrapeOptions } from "./base-scraper";
import { createContext } from "./utils/browser-pool";
import { RATE_LIMITERS } from "./utils/rate-limiter";
import type { Page } from "playwright";

export class GoogleMapsScraper extends BaseScraper {
  async *scrape(options: ScrapeOptions): AsyncGenerator<ScrapedLead> {
    const { keywords, location, maxResults } = options;
    const rateLimiter = RATE_LIMITERS.GOOGLE_MAPS;

    const context = await createContext();
    const page = await context.newPage();

    try {
      let scraped = 0;
      const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(keywords)}+${encodeURIComponent(location)}`;

      await rateLimiter.acquire();

      try {
        await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
        await page.waitForTimeout(2000 + Math.random() * 1000);

        // Scroll to load more results
        for (let i = 0; i < Math.min(maxResults / 20, 10); i++) {
          await page.evaluate(() => {
            const scrollables = document.querySelectorAll("[role='feed']");
            if (scrollables.length > 0) {
              (scrollables[0] as HTMLElement).scrollTop = (scrollables[0] as HTMLElement).scrollHeight;
            }
          });
          await page.waitForTimeout(1000 + Math.random() * 500);
        }

        // Extract business listings
        const listings = await page.evaluate(() => {
          const results: Array<{
            name: string;
            rating?: number;
            reviews?: number;
            address?: string;
            phone?: string;
            website?: string;
            type?: string;
          }> = [];

          const items = document.querySelectorAll("[data-item-id], [role='button'][data-content-owner]");

          items.forEach((item) => {
            const nameEl = item.querySelector("[role='heading'], .x8hlje7");
            const name = nameEl?.textContent?.trim() || "";
            if (!name) return;

            const ratingEl = item.querySelector("[role='img'][aria-label*='star']");
            const ratingText = ratingEl?.getAttribute("aria-label") || "";
            const ratingMatch = ratingText.match(/([\d.]+)/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

            const reviewEl = item.querySelector(".HCoeqe");
            const reviewCount = reviewEl ? parseInt(reviewEl.textContent?.replace(/\D/g, "") || "0") : undefined;

            results.push({
              name,
              rating,
              reviews: reviewCount,
              type: item.querySelector(".d4w47c")?.textContent?.trim(),
            });
          });

          return results;
        });

        // Visit each listing for details
        for (const listing of listings) {
          if (scraped >= maxResults) break;

          await rateLimiter.acquire();

          try {
            // Click on the listing to open details
            const details = await page.evaluate((name) => {
              const items = document.querySelectorAll("[role='button'][data-content-owner]");
              for (const item of items) {
                if (item.textContent?.includes(name)) {
                  (item as HTMLElement).click();
                  return true;
                }
              }
              return false;
            }, listing.name);

            if (details) {
              await page.waitForTimeout(1000);

              const detailsData = await page.evaluate(() => {
                const phoneEl = document.querySelector("a[href^='tel:']");
                const phone = phoneEl?.getAttribute("href")?.replace("tel:", "") || "";

                const websiteEl = document.querySelector("a[href^='http'][href*=':/']");
                const website = websiteEl?.getAttribute("href") || "";

                const addressEl = document.querySelector("button[data-tooltip]");
                const address = addressEl?.textContent?.trim() || "";

                return { phone, website, address };
              });

              const lead: ScrapedLead = {
                businessName: listing.name,
                category: listing.type,
                address: detailsData.address || undefined,
                city: undefined,
                province: "QC",
                phone: detailsData.phone || undefined,
                website: detailsData.website || undefined,
                rating: listing.rating,
                reviewCount: listing.reviews,
                sourceUrl: page.url(),
              };

              scraped++;
              yield lead;
            }
          } catch (err) {
            console.error(`[GoogleMaps] Error processing ${listing.name}:`, err);
          }
        }
      } catch (err) {
        console.error(`[GoogleMaps] Error during scrape:`, err);
      }
    } finally {
      await page.close();
      await context.close();
    }
  }
}
