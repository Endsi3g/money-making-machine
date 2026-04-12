/**
 * Token bucket rate limiter for scraping
 * Ensures we don't exceed request limits for each source
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second

  constructor(requestsPerSecond: number) {
    this.maxTokens = requestsPerSecond * 2;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = requestsPerSecond;
  }

  async acquire(): Promise<void> {
    this.refill();

    if (this.tokens < 1) {
      // Calculate wait time
      const waitMs = Math.ceil(((1 - this.tokens) / this.refillRate) * 1000);
      await this.sleep(waitMs);
      this.refill();
    }

    this.tokens -= 1;

    // Add jitter: extra random delay of 0-500ms
    await this.sleep(Math.random() * 500);
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Pre-configured rate limiters per source
export const RATE_LIMITERS = {
  PAGES_JAUNES: new RateLimiter(1),    // 1 req/sec
  YELP: new RateLimiter(0.5),          // 1 req/2sec
  GOOGLE_MAPS: new RateLimiter(0.5),   // 1 req/2sec
};
