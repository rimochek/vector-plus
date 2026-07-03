"use client"

import { ArrowRight } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { MagneticButtonLink } from "@/app/components/landing/animations/magnetic-button"
import { Reveal } from "@/app/components/landing/animations/reveal"
import { LandingSection } from "@/app/components/landing/shared/section-heading"
import { ButtonLink } from "@/app/components/ui/button"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function FinalCta() {
  const reduced = useReducedMotion()
  const { cta } = useLandingContent()

  return (
    <LandingSection className="pb-20 pt-8">
      <Reveal>
        <div className="relative overflow-hidden rounded-[var(--radius-panel)] bg-[#1e1b4b] px-6 py-14 text-center text-white sm:px-10 sm:py-16 lg:px-16 dark:bg-[#141022]">
          {!reduced && (
            <>
              <motion.div
                aria-hidden
                animate={{ scale: [1, 1.08, 1], opacity: [0.25, 0.4, 0.25] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="pointer-events-none absolute -left-10 top-0 h-40 w-40 rounded-full bg-violet-500/30 blur-3xl"
              />
              <motion.div
                aria-hidden
                animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="pointer-events-none absolute -right-8 bottom-0 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl"
              />
            </>
          )}

          <div className="relative z-10 mx-auto max-w-3xl">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              {cta.title}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-violet-100/85 sm:text-lg">
              {cta.description}
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <MagneticButtonLink
                href="/tutors"
                variant="primary"
                className="gap-2 bg-white px-7 py-3.5 text-[#1e1b4b] hover:bg-violet-50"
              >
                {cta.findTutor}
                <ArrowRight className="h-4 w-4" />
              </MagneticButtonLink>
              <ButtonLink
                href="/signup/tutor"
                variant="secondary"
                className="border-white/20 bg-transparent px-7 py-3.5 text-white hover:bg-white/10"
              >
                {cta.becomeTutor}
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </LandingSection>
  )
}
