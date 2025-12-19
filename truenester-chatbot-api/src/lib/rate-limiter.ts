/**
 * Rate Limiter Middleware
 * 
 * WHY: Protects the API from abuse and ensures fair usage.
 * - Prevents spam submissions
 * - Protects against DDoS
 * - Configurable per-endpoint limits
 * 
 * Uses in-memory storage (suitable for single-instance deployments).
 * For multi-instance, swap to Redis-based implementation.
 */

import { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
  keyGenerator?: (req: Request) => string;
  skipFailedRequests?: boolean;
  message?: string;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,   // 1 minute
  maxRequests: 60,       // 60 requests per minute
  message: "Too many requests, please try again later.",
};

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
      }
    }
  }

  private getKey(req: Request, keyGenerator?: (req: Request) => string): string {
    if (keyGenerator) {
      return keyGenerator(req);
    }
    // Default: use IP address
    const forwarded = req.headers["x-forwarded-for"];
    const ip = typeof forwarded === "string" 
      ? forwarded.split(",")[0].trim() 
      : req.ip || req.socket.remoteAddress || "unknown";
    return `ip:${ip}`;
  }

  check(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || entry.resetAt < now) {
      // Create new entry
      entry = {
        count: 1,
        resetAt: now + config.windowMs,
      };
      this.store.set(key, entry);
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: entry.resetAt,
      };
    }

    // Increment count
    entry.count++;
    this.store.set(key, entry);

    const allowed = entry.count <= config.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  middleware(config: Partial<RateLimitConfig> = {}): (req: Request, res: Response, next: NextFunction) => void {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };

    return (req: Request, res: Response, next: NextFunction): void => {
      const key = this.getKey(req, mergedConfig.keyGenerator);
      const result = this.check(key, mergedConfig);

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", mergedConfig.maxRequests);
      res.setHeader("X-RateLimit-Remaining", result.remaining);
      res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000));

      if (!result.allowed) {
        logger.warn("Rate limit exceeded", {
          key,
          limit: mergedConfig.maxRequests,
          windowMs: mergedConfig.windowMs,
        });

        res.status(429).json({
          error: mergedConfig.message,
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        });
        return;
      }

      next();
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // General API: 60 requests per minute
  general: rateLimiter.middleware({
    windowMs: 60 * 1000,
    maxRequests: 60,
  }),

  // Lead submission: 10 per minute (prevent spam)
  leadSubmission: rateLimiter.middleware({
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: "Too many lead submissions. Please wait before submitting again.",
  }),

  // Contact form: 5 per minute
  contactForm: rateLimiter.middleware({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: "Too many contact form submissions. Please wait a moment.",
  }),

  // Admin API: 120 per minute (higher limit for admin operations)
  admin: rateLimiter.middleware({
    windowMs: 60 * 1000,
    maxRequests: 120,
  }),

  // Export endpoints: 5 per minute (heavy operations)
  export: rateLimiter.middleware({
    windowMs: 60 * 1000,
    maxRequests: 5,
    message: "Export rate limit reached. Please wait before exporting again.",
  }),
};

export { RateLimiter, RateLimitConfig };
export default rateLimiter;
