import {
  type INanoServiceResponse,
  type JsonLikeObject,
  NanoService,
  NanoServiceResponse,
  type ParamsDictionary,
} from "@nanoservice-ts/runner";
import { type Context, GlobalError } from "@nanoservice-ts/shared";

type RateLimiterInputType = {
  identifier: string; // IP, user ID, or custom identifier
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: string; // Custom key generation logic
};

type RateLimitInfoType = {
  identifier: string;
  windowMs: number;
  maxRequests: number;
  currentRequests: number;
  remainingRequests: number;
  resetTime: string;
  isAllowed: boolean;
  retryAfter?: number; // Seconds until next request allowed
};

type RateLimiterOutputType = {
  success: boolean;
  rateLimit: RateLimitInfoType;
  message: string;
  statusCode: number;
};

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export default class RateLimiter extends NanoService<RateLimiterInputType> {
  constructor() {
    super();
    
    this.inputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "Unique identifier for rate limiting (IP, user ID, etc.)"
        },
        windowMs: {
          type: "number",
          minimum: 1000,
          maximum: 86400000, // 24 hours
          default: 60000, // 1 minute
          description: "Time window in milliseconds (default: 60000 = 1 minute)"
        },
        maxRequests: {
          type: "number",
          minimum: 1,
          maximum: 10000,
          default: 100,
          description: "Maximum requests per window (default: 100)"
        },
        skipSuccessfulRequests: {
          type: "boolean",
          default: false,
          description: "Don't count successful requests (default: false)"
        },
        skipFailedRequests: {
          type: "boolean",
          default: false,
          description: "Don't count failed requests (default: false)"
        },
        keyGenerator: {
          type: "string",
          description: "Custom key generation logic (optional)"
        }
      },
      required: ["identifier", "windowMs", "maxRequests"]
    };

    this.outputSchema = {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        success: {
          type: "boolean",
          description: "Whether the request is allowed (not rate limited)"
        },
        rateLimit: {
          type: "object",
          properties: {
            isAllowed: {
              type: "boolean",
              description: "Whether this request is allowed"
            },
            currentRequests: {
              type: "number",
              description: "Current number of requests in the time window"
            },
            maxRequests: {
              type: "number",
              description: "Maximum requests allowed in the time window"
            },
            remainingRequests: {
              type: "number",
              description: "Number of requests remaining in the current window"
            },
            windowMs: {
              type: "number",
              description: "Time window duration in milliseconds"
            },
            retryAfter: {
              type: "number",
              description: "Seconds until the rate limit resets"
            },
            resetTime: {
              type: "number",
              description: "Unix timestamp when the rate limit will reset"
            }
          },
          required: ["isAllowed", "currentRequests", "maxRequests", "remainingRequests", "windowMs", "retryAfter", "resetTime"]
        },
        message: {
          type: "string",
          description: "Human-readable message about the rate limit status"
        },
        statusCode: {
          type: "number",
          enum: [200, 429],
          description: "HTTP status code (200 = allowed, 429 = rate limited)"
        }
      },
      required: ["success", "rateLimit", "message", "statusCode"]
    };
  }

  async handle(ctx: Context, inputs: RateLimiterInputType): Promise<INanoServiceResponse> {
    const response = new NanoServiceResponse();

    try {
      // Validate inputs
      if (!inputs.identifier || typeof inputs.identifier !== 'string') {
        throw new Error('Identifier is required and must be a string');
      }

      if (inputs.windowMs < 1000 || inputs.windowMs > 86400000) {
        throw new Error('Window must be between 1 second and 24 hours');
      }

      if (inputs.maxRequests < 1 || inputs.maxRequests > 10000) {
        throw new Error('Max requests must be between 1 and 10,000');
      }

      ctx.logger.log(`Rate limiting check for: ${inputs.identifier}`);

      // Generate rate limit key
      const key = inputs.keyGenerator || `rate_limit:${inputs.identifier}:${inputs.windowMs}:${inputs.maxRequests}`;
      
      // Check and update rate limit
      const rateLimitInfo = this.checkRateLimit(key, inputs.windowMs, inputs.maxRequests);

      const result: RateLimiterOutputType = {
        success: rateLimitInfo.isAllowed,
        rateLimit: rateLimitInfo,
        message: rateLimitInfo.isAllowed 
          ? `Request allowed (${rateLimitInfo.remainingRequests} remaining)`
          : `Rate limit exceeded. Try again in ${rateLimitInfo.retryAfter} seconds`,
        statusCode: rateLimitInfo.isAllowed ? 200 : 429
      };

      // Store result in context
      if (ctx.vars === undefined) ctx.vars = {};
      ctx.vars.rateLimitInfo = rateLimitInfo as unknown as ParamsDictionary;
      ctx.vars.isRateLimited = !rateLimitInfo.isAllowed as unknown as ParamsDictionary;
      ctx.vars.remainingRequests = rateLimitInfo.remainingRequests as unknown as ParamsDictionary;

      // Clean up old entries periodically
      this.cleanupExpiredEntries();

      ctx.logger.log(`Rate limit result: ${rateLimitInfo.isAllowed ? 'ALLOWED' : 'BLOCKED'} - ${rateLimitInfo.currentRequests}/${rateLimitInfo.maxRequests} requests`);
      response.setSuccess(result as unknown as JsonLikeObject);

    } catch (error: unknown) {
      const nodeError = new GlobalError(
        error instanceof Error ? error.message : "Rate limiting failed"
      );
      nodeError.setCode(500);
      response.setError(nodeError);
      
      ctx.logger.error('Rate limiter error:', error instanceof Error ? (error.stack || error.message) : String(error));
    }

    return response;
  }

  private checkRateLimit(key: string, windowMs: number, maxRequests: number): RateLimitInfoType {
    const now = Date.now();
    
    // Get or create entry
    let entry = rateLimitStore.get(key);
    
    // Reset if window has expired
    if (!entry || entry.resetTime <= now) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // Increment request count
    entry.count += 1;
    
    // Update store
    rateLimitStore.set(key, entry);

    // Calculate remaining requests
    const remainingRequests = Math.max(0, maxRequests - entry.count);
    const isAllowed = entry.count <= maxRequests;
    
    // Calculate retry after (in seconds)
    const retryAfter = isAllowed ? undefined : Math.ceil((entry.resetTime - now) / 1000);

    return {
      identifier: key,
      windowMs,
      maxRequests,
      currentRequests: entry.count,
      remainingRequests,
      resetTime: new Date(entry.resetTime).toISOString(),
      isAllowed,
      retryAfter
    };
  }

  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime <= now) {
        rateLimitStore.delete(key);
        cleanedCount++;
      }
    }
  }

  // Static method to get current store size (for monitoring)
  static getStoreSize(): number {
    return rateLimitStore.size;
  }

  // Static method to clear all entries (for testing)
  static clearStore(): void {
    rateLimitStore.clear();
  }
}
