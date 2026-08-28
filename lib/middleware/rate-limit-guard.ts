/**
 * Rate limit guard for API routes
 * Usage: Wrap API route handlers with this guard
 */

import {
  checkRateLimit,
  createRateLimitHeaders,
  getClientIdentifier,
  RATE_LIMITS,
  type RateLimitConfig,
} from './rate-limit'

export type RateLimitGuardResult =
  | { allowed: true; headers: Record<string, string> }
  | { allowed: false; headers: Record<string, string>; retryAfter: number }

/**
 * Rate limit guard for API routes
 * @param config - Rate limit configuration or preset name
 * @returns A guard function returning a discriminated result object
 */
export function rateLimitGuard(
  config: RateLimitConfig | keyof typeof RATE_LIMITS
) {
  const limitConfig: RateLimitConfig =
    typeof config === 'string' ? RATE_LIMITS[config] : config

  return async (request: Request): Promise<RateLimitGuardResult> => {
    const identifier = getClientIdentifier({
      cookies: {
        getAll: () => {
          // Extract cookies from request
          const cookieHeader = request.headers.get('cookie')
          if (!cookieHeader) return []

          return cookieHeader.split(';').map((cookie) => {
            const [name, value] = cookie.trim().split('=')
            return { name, value: value || '' }
          })
        },
      },
      headers: request.headers,
    })

    const result = checkRateLimit(identifier, limitConfig)

    if (!result.success) {
      return {
        allowed: false,
        headers: createRateLimitHeaders(result),
        retryAfter: Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
      }
    }

    return { allowed: true, headers: createRateLimitHeaders(result) }
  }
}
