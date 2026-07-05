'use client'

import Link from 'next/link'

export default function Error({ reset }: { reset: () => void }) {
    return (
        <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
            <div className="max-w-lg rounded-3xl border border-border bg-card/80 p-8 text-center backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">500</p>
                <h1 className="mt-4 text-3xl font-display font-italic text-foreground">Something went wrong</h1>
                <p className="mt-3 text-sm text-muted-foreground">The page failed to render. You can retry or go back to a safe route.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button onClick={reset} className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground">Retry</button>
                    <Link href="/" className="rounded-lg border border-border px-5 py-3 font-medium text-foreground">Go home</Link>
                </div>
            </div>
        </main>
    )
}