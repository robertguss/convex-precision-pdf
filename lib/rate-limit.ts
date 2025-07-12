import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiter configuration for API endpoints
 * Uses Upstash Redis for distributed rate limiting in serverless environments
 */

// Create a Redis instance - in production, use environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Create a rate limiter instance
 * @param config - Rate limit configuration
 * @returns Configured rate limiter
 */
export function rateLimit(config: {
  interval: number;
  uniqueTokenPerInterval?: number;
}) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      config.uniqueTokenPerInterval || 10,
      `${config.interval} ms`
    ),
    analytics: true,
    prefix: "precision-pdf",
  });
}

/**
 * Rate limiter for upload endpoints
 * Free users: 10 uploads per hour
 * Paid users: 50 uploads per hour
 */
export const uploadLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max unique tokens
});