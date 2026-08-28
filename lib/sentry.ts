/**
 * Sentry error tracking configuration
 * Only initializes when @sentry/nextjs is installed and DSN is provided.
 * Uses optional dynamic import so the app boots even without the SDK.
 */

type SentryClient = {
  init?: (options: Record<string, unknown>) => void
  captureException?: (error: Error, options?: Record<string, unknown>) => void
  captureMessage?: (message: string, level?: string) => void
  setUser?: (user: { id: string; email?: string; username?: string } | null) => void
}

let sentryInstance: SentryClient | null = null

async function loadSentry(): Promise<SentryClient | null> {
  if (sentryInstance) return sentryInstance
  try {
    // @sentry/nextjs is an optional dependency. The dynamic import keeps the app
    // bootable when the SDK is not installed yet.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = await import(/* webpackIgnore: true */ '@sentry/nextjs')
    sentryInstance = mod as unknown as SentryClient
    return sentryInstance
  } catch {
    console.log('Sentry SDK not installed - error tracking disabled')
    return null
  }
}

export async function initSentry() {
  const sdks = await loadSentry()
  if (!sdks?.init) return

  // Only initialize if DSN is provided
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    console.log('Sentry DSN not configured - error tracking disabled')
    return
  }

  // Only initialize in production or when SENTRY_ENABLED is set
  const isEnabled =
    process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true'

  if (!isEnabled) {
    console.log('Sentry disabled in development mode')
    return
  }

  try {
    sdks.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

      // Session Replay
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Error filtering
      beforeSend(event: any, hint: any) {
        const error = hint?.originalException

        if (error && typeof error === 'object' && 'message' in error) {
          const message = String(error.message)

          // Ignore common non-critical errors
          const ignoredErrors = [
            'ResizeObserver loop limit exceeded',
            'ResizeObserver loop completed with undelivered notifications',
            'Non-Error promise rejection captured',
            'chunk',
          ]

          if (ignoredErrors.some((ignored: string) => message.includes(ignored))) {
            return null
          }
        }

        // Sanitize sensitive data
        if (event?.request) {
          delete event.request.cookies
          delete event.request.headers?.authorization
        }

        return event
      },
    })

    console.log('Sentry initialized successfully')
  } catch (error) {
    console.log('Sentry init failed:', error)
  }
}

/**
 * Capture an exception manually
 */
export async function captureException(error: Error, context?: Record<string, unknown>) {
  const sdks = await loadSentry()
  if (sdks?.captureException) {
    sdks.captureException(error, { extra: context })
  }
}

/**
 * Capture a message
 */
export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  const sdks = await loadSentry()
  if (sdks?.captureMessage) {
    sdks.captureMessage(message, level)
  }
}

/**
 * Set user context for error tracking
 */
export async function setUser(user: { id: string; email?: string; username?: string }) {
  const sdks = await loadSentry()
  if (sdks?.setUser) {
    sdks.setUser(user)
  }
}

/**
 * Clear user context
 */
export async function clearUser() {
  const sdks = await loadSentry()
  if (sdks?.setUser) {
    sdks.setUser(null)
  }
}
