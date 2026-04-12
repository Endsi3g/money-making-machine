import { BaseScraper, ScrapedLead, ScrapeOptions } from "./base-scraper";
import { createContext } from "./utils/browser-pool";
import { RATE_LIMITERS } from "./utils/rate-limiter";
import type { Page } from "playwright";

export class PagesJaunesScraper extends BaseScraper {
  async *scrape(options: ScrapeOptions): AsyncGenerator<ScrapedLead> {
    const { keywords, location, maxResults } = options;
    const rateLimiter = RATE_LIMITERS.PAGES_JAUNES;

    const context = await createContext();
    const page = await context.newPage();

    try {
      let scraped = 0;
      let pageNum = 1;

      while (scraped < maxResults) {
        const searchUrl = `https://www.pagesjaunes.ca/search/si/${pageNum}/${encodeURIComponent(keywords)}/${encodeURIComponent(location)}`;

        await rateLimiter.acquire();

        try {
          await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(1000 + Math.random() * 1000);

          // Check if we have results
          const noResults = await page.$(".no-results, [data-testid='no-results']");
          if (noResults) break;

          // Get listing links
          const listingLinks = await page.$$eval(
            "a.listing-name, .result-with-gallery .info a[href*='/bus/'], .organic .info h3 a",
            (links) =>
              links
                .map((l) => (l as HTMLAnchorElement).href)
                .filter((href) => href.includes("pagesjaunes.ca"))
                .slice(0, 20)
          );

          if (listingLinks.length === 0) break;

          for (const link of listingLinks) {
            if (scraped >= maxResults) break;

            await rateLimiter.acquire();

            try {
              const lead = await this.scrapeListing(page, link);
              if (lead) {
                scraped++;
                yield lead;
              }
            } catch (err) {
              // Skip failed listings
              console.error(`[PagesJaunes] Error scraping ${link}:`, err);
            }
          }

          pageNum++;

          // Check if there's a next page
          const hasNext = await page.$("a[aria-label='Suivant'], .pager a.next");
          if (!hasNext) break;
        } catch (err) {
          console.error(`[PagesJaunes] Error on page ${pageNum}:`, err);
          break;
        }
      }
    } finally {
      await page.close();
      await context.close();
    }
  }

  private async scrapeListing(page: Page, url: string): Promise<ScrapedLead | null> {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(500 + Math.random() * 500);

    const data = await page.evaluate(() => {
      const getText = (selector: string): string => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || "";
      };

      const getAttr = (selector: string, attr: string): string => {
        const el = document.querySelector(selector) as HTMLElement | null;
        return (el?.getAttribute(attr) || "").trim();
      };

      const name = getText("h1.business-name, h1[itemprop='name'], .biz-name h1");
      const phone = getText(
        ".phoneNumber, [itemprop='telephone'], .phone-number, a[href^='tel:']"
      ).replace(/\D/g, "");
      const address = getText("address, [itemprop='streetAddress'], .address");
      const city = getText("[itemprop='addressLocality'], .city");
      const province = getText("[itemprop='addressRegion'], .province") || "QC";
      const postalCode = getText("[itemprop='postalCode'], .postal-code");
      const website = getAttr("a[data-bi='website'], a.websiteLink", "href");
      const category = getText(".businessCategory, .categories");
      const description = getText(".businessDescription, [itemprop='description']");

      const ratingEl = document.querySelector("[itemprop='ratingValue'], .rating-number");
      const rating = ratingEl ? parseFloat(ratingEl.textContent?.trim() || "0") : undefined;

      const reviewCountEl = document.querySelector("[itemprop='reviewCount'], .review-count");
      const reviewCount = reviewCountEl
        ? parseInt(reviewCountEl.textContent?.replace(/\D/g, "") || "0")
        : undefined;

      return {
        name,
        phone: phone.length >= 10 ? phone : "",
        address,
        city,
        province,
        postalCode,
        website: website?.startsWith("http") ? website : "",
        category,
        description,
        rating: !isNaN(rating || NaN) ? rating : undefined,
        reviewCount: reviewCount || undefined,
      };
    });

    if (!data.name) return null;

    return {
      businessName: data.name,
      category: data.category || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      province: data.province || "QC",
      postalCode: data.postalCode || undefined,
      phone: data.phone || undefined,
      website: data.website || undefined,
      rating: data.rating,
      reviewCount: data.reviewCount,
      description: data.description || undefined,
      sourceUrl: url,
    };
  }
}
