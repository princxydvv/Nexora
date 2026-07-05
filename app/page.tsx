import Navbar from '@/components/navbar'
import CosmicBackground from '@/components/cosmic-background'
import Hero from '@/components/hero'
import TrustSection from '@/components/trust-section'
import FeatureShowcase from '@/components/feature-showcase'
import Features from '@/components/features'
import HowItWorks from '@/components/how-it-works'
import UseCases from '@/components/use-cases'
import ProductPreview from '@/components/product-preview'
import Pricing from '@/components/pricing'
import FAQ from '@/components/faq'
import CTABanner from '@/components/cta-banner'
import Footer from '@/components/footer'

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
