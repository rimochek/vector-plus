"use client"

import { StaggerContainer, StaggerItem, InteractiveCard } from "@/app/components/landing/animations/stagger"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function Benefits() {
  const { benefits, benefitsSection } = useLandingContent()

  return (
    <LandingSection>
      <SectionHeading
        title={benefitsSection.title}
        description={benefitsSection.description}
      />

      <StaggerContainer className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <StaggerItem key={benefit.title}>
              <InteractiveCard>
                <article className="h-full rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                    {benefit.description}
                  </p>
                </article>
              </InteractiveCard>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </LandingSection>
  )
}
