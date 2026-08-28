/**
 * Ambient type declaration for the optional `@sentry/nextjs` SDK.
 *
 * The SDK is NOT a hard dependency: the app dynamically imports it in
 * `lib/sentry.ts` and gracefully disables error tracking when it is not
 * installed. This declaration lets TypeScript type-check that module
 * without requiring `pnpm add @sentry/nextjs` first.
 */

declare module '@sentry/nextjs' {
  interface SentryInitOptions {
    dsn?: string
    environment?: string
    release?: string
    tracesSampleRate?: number
    replaysSessionSampleRate?: number
    replaysOnErrorSampleRate?: number
    beforeSend?: (event: any, hint: any) => any
  }

  export function init(options: SentryInitOptions): void
  export function captureException(error: unknown, options?: Record<string, unknown>): void
  export function captureMessage(message: string, level?: string): void
  export function setUser(user: { id: string; email?: string; username?: string } | null): void

  export const browserTracingIntegration: () => unknown
  export const replayIntegration: (options?: Record<string, unknown>) => unknown

  const Sentry: {
    init: typeof init
    captureException: typeof captureException
    captureMessage: typeof captureMessage
    setUser: typeof setUser
    browserTracingIntegration: typeof browserTracingIntegration
    replayIntegration: typeof replayIntegration
  }

  export default Sentry
}