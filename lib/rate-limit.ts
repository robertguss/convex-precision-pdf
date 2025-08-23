// Rate limiting disabled for local development
// Original rate limiting code commented out below:

// import { Ratelimit } from "@upstash/ratelimit";
// import { Redis } from "@upstash/redis";

/**
 * Rate limiter configuration for API endpoints - DISABLED FOR LOCAL DEVELOPMENT
 * Original functionality commented out to remove all rate limiting
 */

// Stub function that always allows requests
export function rateLimit(config: {
  interval: number;
  uniqueTokenPerInterval?: number;
}) {
  return {
    limit: async (identifier: string, options?: any) => {
      // Always return success for local development
      return {
        success: true,
        limit: 999999,
        remaining: 999999,
        reset: Date.now() + 3600000, // 1 hour from now
      };
    },
  };
}

/**
 * Upload limiter stub - always allows uploads for local development
 */
export const uploadLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max unique tokens
});

/* ORIGINAL RATE LIMITING CODE - COMMENTED OUT FOR LOCAL DEVELOPMENT

// Create a Redis instance - in production, use environment variables
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

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

export const uploadLimiter = rateLimit({
  interval: 60 * 60 * 1000, // 1 hour
  uniqueTokenPerInterval: 500, // Max unique tokens
});

*/