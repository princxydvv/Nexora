/**
 * Rate limiting utility for API routes
 * Uses in-memory store with sliding window algorithm
 */

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (identifier: string) => string // Custom key generator
}

interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
  limit: number
}

// In-memory store for rate limits
// In production, use Redis or similar distributed store
const rateLimitStore = new Map<string, { count: number; reset: number }>()

/**
 * Rate limit configuration for different endpoint types
 */
export const RATE_LIMITS = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  },
  // Moderate limits for research generation (expensive operations)
  research: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Standard limits for general API endpoints
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 30,
  },
  // Lenient limits for read-only endpoints
  read: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  // Strict limits for payment endpoints
  payment: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
} as const

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const key = config.keyGenerator ? config.keyGenerator(identifier) : identifier

  const record = rateLimitStore.get(key)

  // Clean up expired entries
  if (record && now > record.reset) {
    rateLimitStore.delete(key)
  }

  const current = rateLimitStore.get(key)

  if (!current) {
    // First request in window
    rateLimitStore.set(key, {
      count: 1,
      reset: now + config.windowMs,
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      reset: now + config.windowMs,
      limit: config.maxRequests,
    }
  }

  // Check if limit exceeded
  if (current.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      reset: current.reset,
      limit: config.maxRequests,
    }
  }

  // Increment counter
  current.count++

  return {
    success: true,
    remaining: config.maxRequests - current.count,
    reset: current.reset,
    limit: config.maxRequests,
  }
}

/**
 * Get client identifier from request
 * Prioritizes the authenticated user (via Supabase auth token cookie)
 * over IP address. Falls back to IP when unauthenticated.
 */
export function getClientIdentifier(request: {
  cookies: { getAll: () => Array<{ name: string; value: string }> }
  headers: { get: (name: string) => string | null }
  ip?: string
}): string {
  const cookies = request.cookies.getAll()

  // Supabase SSO stores the session in a cookie named `sb-<project-ref>-auth-token`.
  // Extract the user id from that JWT (payload segment) for a stable per-user key.
  const authCookie = cookies.find((cookie) => cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token'))
  if (authCookie?.value) {
    const parts = authCookie.value.split('.')
    if (parts.length >= 2) {
      try {
        const decoded = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
        const sub = decoded?.sub
        if (typeof sub === 'string' && sub) {
          return `user:${sub}`
        }
      } catch {
        // fall through to IP if the token can't be parsed
      }
    }
  }

  // Fall back to IP address
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  return `ip:${ip}`
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  }
}

/**
 * Rate limit middleware factory
 */
export function withRateLimit(config: RateLimitConfig) {
  return async (request: {
    cookies: { getAll: () => Array<{ name: string; value: string }> }
    headers: { get: (name: string) => string | null }
    ip?: string
  }) => {
    const identifier = getClientIdentifier(request)
    const result = checkRateLimit(identifier, config)

    if (!result.success) {
      return {
        allowed: false,
        headers: createRateLimitHeaders(result),
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      }
    }

    return {
      allowed: true,
      headers: createRateLimitHeaders(result),
    }
  }
}

/**
 * Clean up expired rate limit entries
 * Call this periodically to prevent memory leaks
 */
export function cleanupRateLimitStore() {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.reset) {
      rateLimitStore.delete(key)
    }
  }
}

// Clean up every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}
