import Link from 'next/link'

export default function NotFound() {
    return (
        <main className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
            <div className="max-w-lg rounded-3xl border border-border bg-card/80 p-8 text-center backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.25em] text-muted-foreground">404</p>
                <h1 className="mt-4 text-3xl font-display font-italic text-foreground">Page not found</h1>
                <p className="mt-3 text-sm text-muted-foreground">The route you opened does not exist or has moved.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Link href="/" className="rounded-lg bg-primary px-5 py-3 font-medium text-primary-foreground">Go home</Link>
                    <Link href="/dashboard" className="rounded-lg border border-border px-5 py-3 font-medium text-foreground">Open dashboard</Link>
                </div>
            </div>
        </main>
    )
}