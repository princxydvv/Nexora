# Sentry Error Tracking Setup

This guide explains how to set up Sentry error tracking for the Nexora AI SaaS application.

## What is Sentry?

Sentry is an error tracking and performance monitoring platform that helps you:
- Track errors in real-time
- Monitor application performance
- Capture user sessions for debugging
- Get alerts when issues occur

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new project (select "Next.js" as the platform)
3. Copy your DSN (Data Source Name) from the project settings

### 2. Install Dependencies

```bash
# Add Sentry to your project
pnpm add @sentry/nextjs
```

### 3. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Sentry Configuration
SENTRY_DSN=https://your-project-id@sentry.io/your-project-id
SENTRY_ENABLED=true  # Set to false to disable in development
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 4. Sentry Configuration File

The project already has Sentry configured in `lib/sentry.ts`. The configuration includes:

- **Error Tracking**: Automatically captures JavaScript errors
- **Performance Monitoring**: Tracks API route performance and page loads
- **Session Replay**: Records user sessions for debugging (10% of sessions, 100% of error sessions)
- **Source Maps**: Uploads source maps for better error stack traces

### 5. Build Configuration

Sentry requires a build hook. The project is already configured with:

```javascript
// next.config.mjs
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(
  nextConfig,
  {
    // Sentry configuration options
    silent: true,
    org: 'your-org',
    project: 'your-project',
  }
)
```

### 6. Manual Error Capture

You can manually capture errors using the helper functions in `lib/sentry.ts`:

```typescript
import { captureException, captureMessage, setUser } from '@/lib/sentry'

// Capture an exception
try {
  // Your code
} catch (error) {
  captureException(error, { context: 'additional info' })
}

// Capture a message
captureMessage('Something happened', 'warning')

// Set user context (helps identify which user experienced the error)
setUser({
  id: user.id,
  email: user.email,
})
```

## Features Enabled

### ✅ Performance Monitoring
- **Sample Rate**: 10% in production, 100% in development
- **Tracks**: API route latency, page load times, database queries

### ✅ Session Replay
- **Sample Rate**: 10% of normal sessions
- **Error Sessions**: 100% of sessions with errors
- **Privacy**: All text is masked, media is blocked

### ✅ Error Filtering
The following errors are automatically filtered out:
- ResizeObserver loop errors
- Non-Error promise rejections
- Chunk load errors

### ✅ Data Sanitization
- Cookies are removed from error reports
- Authorization headers are removed
- Sensitive data is not sent to Sentry

## Environment-Specific Behavior

### Development
- Sentry is **disabled** by default unless `SENTRY_ENABLED=true`
- Errors are logged to console only
- No data is sent to Sentry

### Production
- Sentry is **enabled** automatically
- Errors are sent to Sentry
- Performance monitoring is active
- Session replay is active

## Monitoring Best Practices

1. **Set Up Alerts**: Configure alerts in Sentry for critical errors
2. **Review Issues Regularly**: Check Sentry dashboard daily for new issues
3. **Tag Issues**: Use tags to categorize errors by feature or severity
4. **Assign Owners**: Assign team members to resolve specific issues
5. **Track Performance**: Monitor p95 and p99 latency metrics

## Useful Links

- [Sentry Documentation](https://docs.sentry.io/)
- [Next.js SDK Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## Cost Considerations

Sentry offers a free tier with:
- 5,000 events/month
- 1 project
- Basic performance monitoring

For production use, consider the Team plan ($26/month) which includes:
- 50,000 events/month
- Multiple projects
- Advanced features

## Troubleshooting

### Sentry not capturing errors
- Check that `SENTRY_DSN` is set correctly
- Verify `SENTRY_ENABLED=true` in production
- Check browser console for Sentry initialization messages

### Source maps not working
- Ensure source maps are uploaded during build
- Check that `sentry.properties` is configured correctly
- Verify build hook is running in deployment

### High event volume
- Adjust `tracesSampleRate` to reduce performance events
- Use error filtering to ignore non-critical errors
- Consider upgrading your Sentry plan
