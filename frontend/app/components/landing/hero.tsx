"use client"

import { ArrowRight, CheckCircle2, Search, ShieldCheck, Calendar } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import { FloatingElement } from "@/app/components/landing/animations/floating-element"
import { HeroParallax } from "@/app/components/landing/animations/hero-parallax"
import { MagneticButtonLink } from "@/app/components/landing/animations/magnetic-button"
import { useLandingContent } from "@/app/components/landing/use-landing-content"
import { BrowserFrame } from "@/app/components/landing/shared/browser-frame"
import { TutorPreviewCard } from "@/app/components/landing/shared/tutor-preview-card"
import { ButtonLink } from "@/app/components/ui/button"
import { Chip } from "@/app/components/ui/chip"

const ease = [0.22, 1, 0.36, 1] as const

export function LandingHero() {
  const reduced = useReducedMotion()
  const { hero, trustPoints, sampleTutors, heroSubjectBadges } = useLandingContent()
  const featured = sampleTutors[0]
  const smallA = sampleTutors[1]
  const smallB = sampleTutors[2]

  const item = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.58, delay, ease },
        }

  return (
    <section className="relative overflow-hidden pt-[72px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-[var(--primary-soft)] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-violet-100 blur-3xl dark:bg-violet-950/30"
      />

      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:px-8 lg:py-24">
        <div className="relative z-10">
          <motion.p
            {...item(0)}
            className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]"
          >
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            {...item(0.08)}
            className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--text-primary)] sm:text-5xl lg:text-6xl"
          >
            {hero.title}{" "}
            <span className="tutora-gradient-text">{hero.titleHighlight}</span>
          </motion.h1>

          <motion.p
            {...item(0.18)}
            className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--text-muted)]"
          >
            {hero.description}
          </motion.p>

          <motion.div
            {...item(0.28)}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <MagneticButtonLink href="/tutors" variant="primary" className="gap-2 px-7 py-3.5 text-base">
              {hero.findTutor}
              <ArrowRight className="h-5 w-5" />
            </MagneticButtonLink>
            <ButtonLink href="/signup/tutor" variant="secondary" className="px-7 py-3.5 text-base">
              {hero.becomeTutor}
            </ButtonLink>
          </motion.div>

          <motion.ul
            {...item(0.36)}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2"
          >
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <CheckCircle2 className="h-4 w-4 text-[var(--success)]" />
                {point}
              </li>
            ))}
          </motion.ul>
        </div>

        <motion.div
          initial={reduced ? false : { opacity: 0, x: 28, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.72, delay: 0.14, ease }}
          className="relative mx-auto w-full max-w-xl lg:max-w-none"
        >
          <HeroParallax className="relative">
            <div
              aria-hidden
              className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[var(--primary-soft)] to-transparent"
            />

            <BrowserFrame title={hero.frameTitle} className="relative">
              <div className="space-y-4 p-4 sm:p-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                  <div className="rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-secondary)] py-3 pl-10 pr-4 text-sm text-[var(--text-muted)]">
                    {hero.searchPlaceholder}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {heroSubjectBadges.map((badge) => (
                    <Chip key={badge} selected={badge === "IELTS"}>
                      {badge}
                    </Chip>
                  ))}
                </div>

                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.32, ease }}
                >
                  <TutorPreviewCard tutor={featured} href="/tutors" />
                </motion.div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <FloatingElement delay={0.2} offset={5} duration={5.2} className="sm:translate-y-2">
                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.42, ease }}
                    >
                      <TutorPreviewCard tutor={smallA} compact href="/tutors" />
                    </motion.div>
                  </FloatingElement>
                  <FloatingElement delay={0.65} offset={7} duration={6.4}>
                    <motion.div
                      initial={reduced ? false : { opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.52, ease }}
                    >
                      <TutorPreviewCard tutor={smallB} compact href="/tutors" />
                    </motion.div>
                  </FloatingElement>
                </div>

                <FloatingElement delay={0.4} offset={4} duration={4.8}>
                  <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--primary-soft)] p-3">
                    <div className="rounded-xl bg-[var(--primary)] p-2 text-white">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                        {hero.lessonConfirmed}
                      </p>
                      <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                        {hero.lessonTime}
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 shrink-0 text-[var(--success)]" />
                  </div>
                </FloatingElement>
              </div>
            </BrowserFrame>
          </HeroParallax>

          <p className="mt-4 text-center text-xs text-[var(--text-muted)] lg:text-left">
            {hero.previewCaption}
          </p>
        </motion.div>
      </div>
    </section>
  )
}
