/**
 * Rate Limiting Configuration and Utilities
 *
 * Multi-layer rate limiting implementation:
 * - Per IP address
 * - Per user
 * - Per API key
 * - Per endpoint
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limit configurations by endpoint/resource
 */
export const rateLimitConfigs = {
  // Authentication endpoints - strict limits
  '/api/auth/login': {
    maxRequests: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    keyPrefix: 'auth:login',
  },
  '/api/auth/register': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'auth:register',
  },
  '/api/auth/reset-password': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'auth:reset',
  },

  // API endpoints - moderate limits
  '/api/documents/upload': {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'api:upload',
  },
  '/api/documents': {
    maxRequests: 1000,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'api:documents',
  },

  // Export endpoints - strict limits
  '/api/export': {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'api:export',
  },

  // Default limits
  default: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    keyPrefix: 'api:default',
  },
} as const;

/**
 * Get rate limit configuration for an endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return rateLimitConfigs[endpoint as keyof typeof rateLimitConfigs] || rateLimitConfigs.default;
}

/**
 * In-memory rate limit store (use Redis in production)
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetAt: number }>();

  async get(key: string): Promise<{ count: number; resetAt: number } | null> {
    const record = this.store.get(key);
    if (!record) return null;

    // Clean up expired records
    if (Date.now() > record.resetAt) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  async set(key: string, value: { count: number; resetAt: number }): Promise<void> {
    this.store.set(key, value);
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetAt: number }> {
    const now = Date.now();
    const record = await this.get(key);

    if (!record) {
      const newRecord = { count: 1, resetAt: now + windowMs };
      await this.set(key, newRecord);
      return newRecord;
    }

    record.count++;
    await this.set(key, record);
    return record;
  }

  // Cleanup expired records periodically
  startCleanup(intervalMs: number = 60000): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.store.entries()) {
        if (now > record.resetAt) {
          this.store.delete(key);
        }
      }
    }, intervalMs);
  }
}

const store = new RateLimitStore();
store.startCleanup();

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `${config.keyPrefix}:${identifier}`;
  const record = await store.increment(key, config.windowMs);

  return {
    allowed: record.count <= config.maxRequests,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - record.count),
    resetAt: record.resetAt,
  };
}

/**
 * Get identifier from request
 */
export function getIdentifier(request: Request): string {
  // Try to get user ID from auth header
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    // In production, decode JWT and get user ID
    // For now, use a hash of the token
    return `user:${hashString(authHeader)}`;
  }

  // Try to get API key
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    return `apikey:${hashString(apiKey)}`;
  }

  // Fall back to IP address
  const ip = request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || request.headers.get('X-Real-IP')
    || 'unknown';

  return `ip:${ip}`;
}

/**
 * Simple hash function for identifiers
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Rate limit middleware for Edge Functions
 */
export async function rateLimitMiddleware(
  request: Request,
  endpoint: string,
  handler: (req: Request) => Promise<Response>
): Promise<Response> {
  const config = getRateLimitConfig(endpoint);
  const identifier = getIdentifier(request);
  const result = await checkRateLimit(identifier, config);

  // Add rate limit headers to response
  const addRateLimitHeaders = (response: Response): Response => {
    response.headers.set('X-RateLimit-Limit', result.limit.toString());
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', result.resetAt.toString());
    return response;
  };

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    const response = new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
        },
      }
    );
    return addRateLimitHeaders(response);
  }

  const response = await handler(request);
  return addRateLimitHeaders(response);
}

/**
 * Example usage in Edge Function:
 *
 * ```typescript
 * export default async function handler(req: Request) {
 *   return rateLimitMiddleware(req, '/api/documents', async (req) => {
 *     // Your handler logic here
 *     return new Response(JSON.stringify({ data: 'hello' }));
 *   });
 * }
 * ```
 */

/**
 * Production-ready Redis implementation (example):
 *
 * ```typescript
 * import { Redis } from '@upstash/redis';
 *
 * const redis = new Redis({
 *   url: process.env.UPSTASH_REDIS_REST_URL!,
 *   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
 * });
 *
 * export async function checkRateLimitRedis(
 *   identifier: string,
 *   config: RateLimitConfig
 * ): Promise<RateLimitResult> {
 *   const key = `${config.keyPrefix}:${identifier}`;
 *   const multi = redis.multi();
 *
 *   multi.incr(key);
 *   multi.pexpire(key, config.windowMs);
 *
 *   const [count] = await multi.exec() as [number, string];
 *   const ttl = await redis.pttl(key);
 *
 *   return {
 *     allowed: count <= config.maxRequests,
 *     limit: config.maxRequests,
 *     remaining: Math.max(0, config.maxRequests - count),
 *     resetAt: Date.now() + ttl,
 *   };
 * }
 * ```
 */
