import Navbar from '@/components/layout/navbar'
import CosmicBackground from '@/components/layout/cosmic-background'
import Hero from '@/components/marketing/hero'
import TrustSection from '@/components/marketing/trust-section'
import FeatureShowcase from '@/components/marketing/feature-showcase'
import Features from '@/components/marketing/features'
import HowItWorks from '@/components/marketing/how-it-works'
import UseCases from '@/components/marketing/use-cases'
import ProductPreview from '@/components/marketing/product-preview'
import Pricing from '@/components/marketing/pricing'
import FAQ from '@/components/marketing/faq'
import CTABanner from '@/components/marketing/cta-banner'
import Footer from '@/components/layout/footer'

export default function Page() {
  return (
    <main className="relative w-full overflow-x-hidden bg-background">
      <CosmicBackground />
      <Navbar />
      <Hero />
      <TrustSection />
      <FeatureShowcase />
      <Features />
      <HowItWorks />
      <UseCases />
      <ProductPreview />
      <Pricing />
      <FAQ />
      <CTABanner />
      <Footer />
    </main>
  )
}
