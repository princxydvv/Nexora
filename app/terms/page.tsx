import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="text-primary hover:text-primary/80 mb-8 inline-block">
          ← Back to Home
        </Link>
        
        <h1 className="text-4xl font-display font-italic text-foreground mb-8">
          Terms of Service
        </h1>
        
        <div className="space-y-6 text-foreground">
          <section>
            <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Nexora, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">2. Use License</h2>
            <p className="text-muted-foreground">
              Permission is granted to temporarily download one copy of the materials (information or software) on Nexora for personal, non-commercial transitory viewing only.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">3. Disclaimer</h2>
            <p className="text-muted-foreground">
              The materials on Nexora are provided on an &apos;as is&apos; basis. Nexora makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">4. Limitations</h2>
            <p className="text-muted-foreground">
              In no event shall Nexora or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">5. Accuracy of Materials</h2>
            <p className="text-muted-foreground">
              The materials appearing on Nexora could include technical, typographical, or photographic errors. Nexora does not warrant that any of the materials are accurate, complete, or current.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">6. Modifications</h2>
            <p className="text-muted-foreground">
              Nexora may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-3">7. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
