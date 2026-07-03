"use client"

import { StaggerContainer, StaggerItem } from "@/app/components/landing/animations/stagger"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

function TestimonialCard({
  testimonial,
}: {
  testimonial: ReturnType<typeof useLandingContent>["testimonials"][number]
}) {
  return (
    <article className="w-[22rem] shrink-0 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
          {testimonial.initials}
        </div>
        <div>
          <p className="font-bold text-[var(--text-primary)]">{testimonial.name}</p>
          <p className="text-xs font-semibold text-[var(--primary)]">{testimonial.goal}</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        {testimonial.subject}
      </p>
    </article>
  )
}

export function Testimonials() {
  const { testimonials, testimonialsSection } = useLandingContent()

  return (
    <LandingSection className="overflow-hidden bg-[var(--surface-secondary)]/40">
      <SectionHeading
        title={testimonialsSection.title}
        description={testimonialsSection.description}
      />

      <div className="mt-12 hidden md:block">
        <div className="overflow-hidden">
          <div className="landing-marquee-track flex w-max">
            <div className="landing-marquee-group flex shrink-0 gap-5 pr-5">
              {testimonials.map((item) => (
                <TestimonialCard key={item.id} testimonial={item} />
              ))}
            </div>
            <div className="landing-marquee-group flex shrink-0 gap-5 pr-5" aria-hidden>
              {testimonials.map((item) => (
                <TestimonialCard key={`${item.id}-dup`} testimonial={item} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-4 md:hidden">
        <StaggerContainer className="grid gap-4">
          {testimonials.slice(0, 3).map((item) => (
            <StaggerItem key={item.id}>
              <TestimonialCard testimonial={item} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </LandingSection>
  )
}
