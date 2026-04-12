import { createRedisClient } from "@/lib/redis";
import { ScrapingProgressEvent } from "@/types/scraping";

export interface ScrapedLead {
  businessName: string;
  category?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  rating?: number;
  reviewCount?: number;
  sourceUrl?: string;
  description?: string;
}

export interface ScrapeOptions {
  keywords: string;
  location: string;
  maxResults: number;
  onProgress?: (scraped: number, total: number, dupes: number, lead?: ScrapedLead) => void;
}

export abstract class BaseScraper {
  abstract scrape(options: ScrapeOptions): AsyncGenerator<ScrapedLead>;

  protected async publishProgress(
    jobId: string,
    event: Omit<ScrapingProgressEvent, "jobId">
  ): Promise<void> {
    const pub = createRedisClient();
    try {
      await pub.publish(`scraping:${jobId}`, JSON.stringify({ jobId, ...event }));
    } finally {
      pub.disconnect();
    }
  }
}
