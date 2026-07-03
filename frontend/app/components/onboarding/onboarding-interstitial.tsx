"use client"

import type { ReactNode } from "react"
import { motion } from "motion/react"
import { Check } from "lucide-react"
import { useReducedMotion, motionTransition } from "@/lib/onboarding/use-reduced-motion"
import { StepNavigation } from "./animated-step"

type BenefitListProps = {
  items: string[]
}

export function BenefitList({ items }: BenefitListProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[var(--primary-from)] dark:bg-violet-950/50">
            <Check className="h-3 w-3" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

type SampleTestimonialProps = {
  quote: string
  context: string
}

export function SampleTestimonial({ quote, context }: SampleTestimonialProps) {
  return (
    <figure className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
      <figcaption className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary-from)]">
        Sample experience
      </figcaption>
      <p className="text-sm leading-relaxed text-[var(--text-primary)]">
        “{quote}”
      </p>
      <p className="mt-2 text-xs text-[var(--text-muted)]">{context}</p>
    </figure>
  )
}

type OnboardingInterstitialProps = {
  eyebrow?: string
  title: string
  description: string
  benefits?: string[]
  testimonial?: { quote: string; context: string }
  preview?: ReactNode
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
  onBack?: () => void
}

export function OnboardingInterstitial({
  eyebrow,
  title,
  description,
  benefits,
  testimonial,
  preview,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onBack,
}: OnboardingInterstitialProps) {
  const reduced = useReducedMotion()

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98, y: 16 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.99, y: -12 }}
      transition={motionTransition(reduced, 0.35)}
      className="space-y-6"
    >
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary-from)]">
          {eyebrow}
        </p>
      ) : null}
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base">
          {description}
        </p>
      </div>
      {benefits ? <BenefitList items={benefits} /> : null}
      {preview ? <div className="lg:hidden">{preview}</div> : null}
      {testimonial ? (
        <SampleTestimonial quote={testimonial.quote} context={testimonial.context} />
      ) : null}
      <StepNavigation
        onBack={onBack}
        onContinue={onPrimary}
        continueLabel={primaryLabel}
        secondaryAction={
          onSecondary && secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondary}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
            >
              {secondaryLabel}
            </button>
          ) : undefined
        }
      />
    </motion.div>
  )
}

type OptionCardProps = {
  selected: boolean
  title: string
  description?: string
  onClick: () => void
  icon?: ReactNode
}

export function OptionCard({
  selected,
  title,
  description,
  onClick,
  icon,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-from)] ${
        selected
          ? "border-[var(--primary-from)] bg-violet-50 shadow-md dark:bg-violet-950/20"
          : "border-slate-200 bg-white hover:-translate-y-0.5 hover:shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface)]"
      }`}
    >
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-[var(--primary-from)] dark:bg-violet-950/40">
            {icon}
          </div>
        ) : null}
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{title}</p>
          {description ? (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{description}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

export function SelectableChip({
  selected,
  children,
  onClick,
}: {
  selected: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-from)] ${
        selected
          ? "border-[var(--primary-from)] bg-violet-50 text-[var(--primary-from)] dark:bg-violet-950/30"
          : "border-slate-200 bg-white text-[var(--text-secondary)] hover:bg-[var(--chip)] dark:border-[var(--border)] dark:bg-[var(--surface)]"
      }`}
    >
      {children}
    </button>
  )
}
