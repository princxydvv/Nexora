import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, Instrument_Serif } from 'next/font/google'
import { AuthProvider } from '@/features/auth/contexts/auth-context'
import { ErrorBoundary } from '@/app/_components/error-boundary'
import { initSentry } from '@/lib/sentry'
import './globals.css'

// Initialize Sentry error tracking (fire-and-forget; runs only when SDK + DSN present)
void initSentry()

const inter = Inter({ variable: '--font-sans', subsets: ['latin'] })
const instrumentSerif = Instrument_Serif({
  variable: '--font-display',
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
})

export const metadata: Metadata = {
  title: 'Nexora - AI Research Analyst',
  description: 'Transform any topic into a structured research report with verified sources, insights, risks, opportunities, and actionable recommendations.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050505' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} bg-background`} data-scroll-behavior="smooth">
      <body className="font-sans antialiased text-foreground">
        <AuthProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AuthProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
