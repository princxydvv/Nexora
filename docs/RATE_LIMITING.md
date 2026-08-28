# Rate Limiting Implementation

This document explains the rate limiting system implemented in Nexora AI SaaS.

## Overview

Rate limiting is applied to all API routes to prevent abuse and ensure fair usage. The system uses an in-memory store with a sliding window algorithm.

## Rate Limits by Endpoint

### Research Generation (Expensive Operations)
- Window: 1 minute
- Max Requests: 5 requests per minute per user/IP

**Rationale**: Research generation is computationally expensive and requires API calls to AI providers. Limiting to 5 requests per minute prevents abuse while allowing legitimate usage.

### Payment Endpoints
- Window: 1 minute  
- Max Requests: 10 requests per minute per user/IP

**Rationale**: Payment operations should be limited to prevent fraud and duplicate charges.

### General API Endpoints
- Window: 1 minute
- Max Requests: 30 requests per minute per user/IP

**Rationale**: Standard limit for general API operations.

### Read-Only Endpoints
- Window: 1 minute
- Max Requests: 100 requests per minute per user/IP

**Rationale**: Lenient limit for GET requests that don't modify data.

## Implementation

### Files

1. **`lib/middleware/rate-limit.ts`** - Core rate limiting logic
2. **`lib/middleware/rate-limit-guard.ts`** - API route guard wrapper
3. **Applied to**:
   - `app/api/research/route.ts` (POST)
   - `app/api/research/[id]/route.ts` (GET)
   - `app/api/billing/route.ts` (GET)
   - `app/api/billing/razorpay/create-order/route.ts` (POST)
   - `app/api/billing/razorpay/verify-payment/route.ts` (POST)
   - `app/api/billing/razorpay/webhook/route.ts` (POST)

### Client Identification

The system identifies clients using:

1. **User ID** (preferred): Extracted from authentication cookies
2. **IP Address** (fallback): From request headers

This ensures authenticated users have separate rate limits from anonymous users.

## Response Headers

Every API response includes rate limit headers:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 28
X-RateLimit-Reset: 2026-08-12T10:30:00.000Z
```

When rate limited, the response includes:
```
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{
  "error": "Too many requests",
  "message": "Please wait before retrying"
}
```

## Rate Limit Responses

### Success (200 OK)
Response includes rate limit headers showing remaining requests.

### Rate Limited (429 Too Many Requests)
```json
{
  "error": "Too many requests",
  "message": "Please wait before retrying",
  "retryAfter": 45
}
```

Headers include Retry-After for client to know when to retry.

## Production Considerations

### Current Implementation
- Uses in-memory store (Map)
- Suitable for single-server deployments
- Automatic cleanup of expired entries

### For Production (Multiple Servers)

For production with multiple servers or serverless functions, replace the in-memory store with Redis.

## Monitoring

Monitor rate limit metrics:

1. **Track 429 responses**: Alert if rate limits are frequently hit
2. **Monitor rate limit hit rate**: Should be < 1% of total requests
3. **Review rate limit configuration**: Adjust limits based on usage patterns

## Adjusting Rate Limits

To modify rate limits, edit `lib/middleware/rate-limit.ts`:

```typescript
export const RATE_LIMITS = {
  research: {
    windowMs: 60 * 1000,
    maxRequests: 5,
  },
}
```

## Testing

Test rate limiting by sending multiple rapid requests to API endpoints. The 6th request within 1 minute to research endpoint should return 429.

## Troubleshooting

### Rate limits too strict
- Increase maxRequests in the configuration
- Increase windowMs to allow more requests over a longer period

### Rate limits not working
- Verify middleware is applied to API routes
- Check that the in-memory store is not being reset
- Review server logs for errors
