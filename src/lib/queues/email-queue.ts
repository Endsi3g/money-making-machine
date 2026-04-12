import { Queue } from "bullmq";
import { createRedisClient } from "@/lib/redis";

export interface EmailJobData {
  campaignLeadId: string;
  campaignId: string;
  workspaceId: string;
}

export const emailQueue = new Queue<EmailJobData>("email", {
  connection: createRedisClient(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 60000 },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
});
