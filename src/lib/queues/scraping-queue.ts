import { Queue } from "bullmq";
import { createRedisClient } from "@/lib/redis";

export interface ScrapingJobData {
  jobId: string;
  workspaceId: string;
  source: "PAGES_JAUNES" | "YELP" | "GOOGLE_MAPS";
  keywords: string;
  location: string;
  maxResults: number;
}

export const scrapingQueue = new Queue<ScrapingJobData>("scraping", {
  connection: createRedisClient(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
