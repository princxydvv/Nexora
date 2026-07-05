export default function Loading() {
    return (
        <main className="min-h-screen bg-background px-4 py-12">
            <div className="mx-auto flex max-w-6xl animate-pulse flex-col gap-6">
                <div className="h-10 w-48 rounded-full bg-secondary/60" />
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="h-40 rounded-3xl bg-secondary/60" />
                    <div className="h-40 rounded-3xl bg-secondary/60" />
                    <div className="h-40 rounded-3xl bg-secondary/60" />
                </div>
                <div className="h-80 rounded-3xl bg-secondary/60" />
            </div>
        </main>
    )
}