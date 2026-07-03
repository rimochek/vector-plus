"use client"

import { StaggerContainer, StaggerItem, InteractiveCard } from "@/app/components/landing/animations/stagger"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function HowItWorks() {
  const { howItWorks, howSection } = useLandingContent()

  return (
    <LandingSection id="how-it-works" className="bg-[var(--surface-secondary)]/40">
      <SectionHeading title={howSection.title} />

      <StaggerContainer className="relative mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div
          aria-hidden
          className="pointer-events-none absolute left-[16.666%] right-[16.666%] top-12 hidden h-px bg-[var(--border-strong)] lg:block"
        />
        {howItWorks.map((step) => (
          <StaggerItem key={step.step}>
            <InteractiveCard>
              <article className="relative h-full rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-extrabold text-[var(--primary)]">
                  {step.step}
                </span>
                <h3 className="mt-5 text-xl font-bold text-[var(--text-primary)]">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
                  {step.description}
                </p>
                <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-xs font-semibold text-[var(--text-secondary)]">
                  {step.preview}
                </div>
              </article>
            </InteractiveCard>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </LandingSection>
  )
}
