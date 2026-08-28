'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { captureException } from '@/lib/sentry'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    // Send to Sentry (no-op if SDK/DSN not configured)
    void captureException(error, {
      componentStack: errorInfo.componentStack,
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full space-y-4 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h2>
            <p className="text-muted-foreground">
              We apologize for the inconvenience. An error occurred while rendering this page.
            </p>
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 p-4 bg-secondary rounded-lg text-xs overflow-auto">
                {this.state.error?.message}
                {'\n\n'}
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
