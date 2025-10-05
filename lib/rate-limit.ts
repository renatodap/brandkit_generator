import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiter instance
 * Uses Upstash Redis for distributed rate limiting
 */
export const ratelimit = process.env['UPSTASH_REDIS_REST_URL'] && process.env['UPSTASH_REDIS_REST_TOKEN']
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null;

/**
 * Rate limiting middleware for API routes
 * @param identifier - Unique identifier (usually IP address or user ID)
 * @returns Object with success status and optional error
 */
export async function checkRateLimit(identifier: string): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  error?: string;
}> {
  // If rate limiting is not configured, allow all requests
  if (!ratelimit) {
    return { success: true };
  }

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    if (!success) {
      const resetDate = new Date(reset);
      const resetIn = Math.ceil((reset - Date.now()) / 1000);

      return {
        success: false,
        limit,
        remaining: 0,
        reset,
        error: `Rate limit exceeded. Try again in ${resetIn} seconds (resets at ${resetDate.toLocaleTimeString()})`,
      };
    }

    return { success: true, limit, remaining, reset };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request (fail open)
    return { success: true };
  }
}

/**
 * Get client IP address from request
 * @param request - Next.js request object
 * @returns IP address or 'unknown'
 */
export function getClientIp(request: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  if (forwarded) {
    // x-forwarded-for may contain multiple IPs, get the first one
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  return 'unknown';
}
