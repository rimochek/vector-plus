"use client"

import { ArrowRight, GraduationCap, UserRound } from "lucide-react"
import { Reveal } from "@/app/components/landing/animations/reveal"
import { LandingSection } from "@/app/components/landing/shared/section-heading"
import { ButtonLink } from "@/app/components/ui/button"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function UserPaths() {
  const { paths } = useLandingContent()

  return (
    <LandingSection id="for-tutors">
      <div className="grid gap-6 lg:grid-cols-2">
        <Reveal>
          <article className="flex h-full flex-col rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[var(--shadow-sm)]">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <UserRound className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-extrabold text-[var(--text-primary)]">{paths.studentTitle}</h3>
            <p className="mt-3 flex-1 text-base leading-relaxed text-[var(--text-muted)]">
              {paths.studentDescription}
            </p>
            <ButtonLink href="/tutors" variant="primary" className="mt-8 gap-2 self-start">
              {paths.studentCta}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="flex h-full flex-col rounded-[var(--radius-panel)] border border-[var(--border)] bg-[#1e1b4b] p-8 text-white shadow-[var(--shadow-md)] dark:bg-[#141022]">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-violet-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h3 className="text-2xl font-extrabold">{paths.tutorTitle}</h3>
            <p className="mt-3 flex-1 text-base leading-relaxed text-violet-100/80">
              {paths.tutorDescription}
            </p>
            <ButtonLink
              href="/signup/tutor"
              variant="secondary"
              className="mt-8 gap-2 self-start border-white/15 bg-white text-[#1e1b4b] hover:bg-violet-50"
            >
              {paths.tutorCta}
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </article>
        </Reveal>
      </div>
    </LandingSection>
  )
}
