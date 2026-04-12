import { createHash } from "crypto";
import { redis } from "@/lib/redis";

const FINGERPRINT_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

export class Deduplicator {
  private readonly redisKey: string;

  constructor(workspaceId: string) {
    this.redisKey = `workspace:${workspaceId}:lead-fingerprints`;
  }

  static fingerprint(businessName: string, city: string): string {
    const normalized = `${businessName.toLowerCase().trim()}|${city.toLowerCase().trim()}`;
    return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
  }

  async isDuplicate(businessName: string, city: string, phone?: string | null): Promise<boolean> {
    const fp = Deduplicator.fingerprint(businessName, city);
    const exists = await redis.sismember(this.redisKey, fp);

    if (exists) return true;

    // Secondary check: phone number
    if (phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.length >= 10) {
        const phoneKey = `workspace:${this.redisKey}:phone:${cleaned}`;
        const phoneExists = await redis.exists(phoneKey);
        if (phoneExists) return true;
      }
    }

    return false;
  }

  async markSeen(businessName: string, city: string, phone?: string | null): Promise<void> {
    const fp = Deduplicator.fingerprint(businessName, city);

    await redis.sadd(this.redisKey, fp);
    await redis.expire(this.redisKey, FINGERPRINT_TTL_SECONDS);

    if (phone) {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.length >= 10) {
        const phoneKey = `workspace:${this.redisKey}:phone:${cleaned}`;
        await redis.setex(phoneKey, FINGERPRINT_TTL_SECONDS, "1");
      }
    }
  }
}
