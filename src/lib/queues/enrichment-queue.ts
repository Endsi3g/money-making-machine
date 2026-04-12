import { Queue } from "bullmq";
import { createRedisClient } from "@/lib/redis";

export interface EnrichmentJobData {
  leadId: string;
  workspaceId: string;
}

export const enrichmentQueue = new Queue<EnrichmentJobData>("enrichment", {
  connection: createRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});
