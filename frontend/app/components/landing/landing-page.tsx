import { SmoothScrollProvider } from "@/app/components/landing/animations/smooth-scroll-provider"
import { LandingNavbar } from "@/app/components/landing/navbar"
import { LandingHero } from "@/app/components/landing/hero"
import { TrustMetrics } from "@/app/components/landing/trust-metrics"
import { CategoryGrid } from "@/app/components/landing/category-grid"
import { HowItWorks } from "@/app/components/landing/how-it-works"
import { FeaturedTutors } from "@/app/components/landing/featured-tutors"
import { ProductScrollStory } from "@/app/components/landing/product-scroll-story/product-scroll-story"
import { UserPaths } from "@/app/components/landing/user-paths"
import { Benefits } from "@/app/components/landing/benefits"
import { Testimonials } from "@/app/components/landing/testimonials"
import { LandingFaq } from "@/app/components/landing/faq"
import { FinalCta } from "@/app/components/landing/final-cta"
import { LandingFooter } from "@/app/components/landing/footer"
import { LandingHashScroll } from "@/app/components/landing/landing-hash-scroll"

export function LandingPage() {
  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[var(--background)]">
        <LandingHashScroll />
        <LandingNavbar />
        <main>
          <LandingHero />
          <TrustMetrics />
          <CategoryGrid />
          <HowItWorks />
          <FeaturedTutors />
          <ProductScrollStory />
          <UserPaths />
          <Benefits />
          <Testimonials />
          <LandingFaq />
          <FinalCta />
        </main>
        <LandingFooter />
      </div>
    </SmoothScrollProvider>
  )
}
