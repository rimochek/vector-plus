"use client"

import { AnimatedCounter } from "@/app/components/landing/animations/animated-counter"
import { Reveal } from "@/app/components/landing/animations/reveal"
import { LandingSection } from "@/app/components/landing/shared/section-heading"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function TrustMetrics() {
  const { metrics } = useLandingContent()

  return (
    <LandingSection className="border-y border-[var(--border)] bg-[var(--surface-secondary)]/60 py-10 sm:py-12">
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 lg:gap-8">
        {metrics.map((metric, index) => (
          <Reveal key={metric.label} delay={index * 0.05} className="text-center lg:text-left">
            <p className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">
              <AnimatedCounter value={metric.value} />
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">{metric.label}</p>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  )
}
