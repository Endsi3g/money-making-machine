import { Worker } from "bullmq";
import { createRedisClient } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { Deduplicator } from "@/lib/scrapers/utils/deduplicator";
import { PagesJaunesScraper } from "@/lib/scrapers/pages-jaunes-scraper";
import { YelpScraper } from "@/lib/scrapers/yelp-scraper";
import { GoogleMapsScraper } from "@/lib/scrapers/google-maps-scraper";
import type { ScrapingJobData } from "@/lib/queues/scraping-queue";
import type { EnrichmentJobData } from "@/lib/queues/enrichment-queue";
import { processEnrichmentJob } from "@/lib/workers/enrichment-worker";
import { EmailJobData } from "@/lib/queues/email-queue";
import { processEmailJob } from "@/lib/workers/email-worker";
import * as Sentry from "@sentry/nextjs";

// Initialiser Sentry pour le worker
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

const redisConnection = createRedisClient();

// Scraping worker
const scrapingWorker = new Worker<ScrapingJobData>(
  "scraping",
  async (job) => {
    const { jobId, workspaceId, source, keywords, location, maxResults } = job.data;

    console.log(`[Worker] Starting scraping job ${jobId} for ${source}`);

    // Update job status
    await prisma.scrapingJob.update({
      where: { id: jobId },
      data: { status: "EN_COURS", startedAt: new Date() },
    });

    let scraper;
    if (source === "PAGES_JAUNES") {
      scraper = new PagesJaunesScraper();
    } else if (source === "YELP") {
      scraper = new YelpScraper();
    } else if (source === "GOOGLE_MAPS") {
      scraper = new GoogleMapsScraper();
    } else {
      throw new Error(`Unknown source: ${source}`);
    }

    const dedup = new Deduplicator(workspaceId);
    const pub = createRedisClient(); // single pub client for the whole job
    let totalScraped = 0;
    let totalDupes = 0;

    try {
      for await (const lead of scraper.scrape({ keywords, location, maxResults })) {
        // Check for duplicates
        const isDupe = await dedup.isDuplicate(lead.businessName, lead.city || "", lead.phone);
        if (isDupe) {
          totalDupes++;
          continue;
        }

        // Mark as seen
        await dedup.markSeen(lead.businessName, lead.city || "", lead.phone);

        // Create lead in DB
        await prisma.lead.create({
          data: {
            workspaceId,
            businessName: lead.businessName,
            category: lead.category,
            address: lead.address,
            city: lead.city,
            province: lead.province || "QC",
            postalCode: lead.postalCode,
            phone: lead.phone,
            email: lead.email,
            website: lead.website,
            rating: lead.rating,
            reviewCount: lead.reviewCount,
            source: source as any,
            sourceUrl: lead.sourceUrl,
            status: "NOUVEAU",
            score: 50,
          },
        });

        totalScraped++;

        // Update progress
        await prisma.scrapingJob.update({
          where: { id: jobId },
          data: {
            totalScraped,
            totalDupes,
            totalFound: totalScraped + totalDupes,
          },
        });

        // Publish progress via Redis pub/sub
        await pub.publish(
          `scraping:${jobId}`,
          JSON.stringify({
            jobId,
            scraped: totalScraped,
            dupes: totalDupes,
            total: totalScraped + totalDupes,
            lastLead: { businessName: lead.businessName, city: lead.city },
          })
        );
      }

      // Mark as complete
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: "TERMINE",
          completedAt: new Date(),
          totalFound: totalScraped,
          totalScraped,
          totalDupes,
        },
      });

      console.log(`[Worker] Job ${jobId} completed: ${totalScraped} leads, ${totalDupes} dupes`);
      pub.disconnect();
      throw error;
    } catch (error) {
      console.error(`[Worker] Job ${jobId} failed:`, error);
      
      // Capturer l'erreur dans Sentry
      Sentry.captureException(error, {
        extra: { jobId, workspaceId, source, keywords, location },
        tags: { jobType: "scraping", source },
      });

      pub.disconnect();

      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: {
          status: "ECHOUE",
          completedAt: new Date(),
          errorMessage: String(error),
        },
      });

      throw error;
    }
  },
  { connection: redisConnection }
);

scrapingWorker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

scrapingWorker.on("failed", (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err);
});

// Enrichment worker
const enrichmentWorker = new Worker<EnrichmentJobData>(
  "enrichment",
  processEnrichmentJob,
  { connection: createRedisClient() }
);

enrichmentWorker.on("completed", (job) => {
  console.log(`✅ Enrichment ${job.id} done`);
});

enrichmentWorker.on("failed", (job, err) => {
  console.error(`❌ Enrichment ${job?.id} failed:`, err);
});

// Email worker
const emailWorker = new Worker<EmailJobData>(
  "email",
  processEmailJob,
  { connection: createRedisClient() }
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Email ${job.id} sent`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`❌ Email ${job?.id} failed:`, err);
});

console.log("🚀 Worker server started - listening for scraping + enrichment + email jobs");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down workers...");
  await scrapingWorker.close();
  await enrichmentWorker.close();
  await emailWorker.close();
  await redisConnection.quit();
  process.exit(0);
});
