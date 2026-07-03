"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useReducedMotion } from "@/lib/onboarding/use-reduced-motion"

export type StepDirection = "forward" | "back"

export function directionToNumber(direction: StepDirection): number {
  return direction === "forward" ? 1 : -1
}

const stepVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 20 : -20,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
  }),
}

type AnimatedStepContainerProps = {
  stepKey: string
  direction: StepDirection
  children: ReactNode
}

export function AnimatedStepContainer({
  stepKey,
  direction,
  children,
}: AnimatedStepContainerProps) {
  const reduced = useReducedMotion()
  const custom = directionToNumber(direction)

  return (
    <div className="relative overflow-hidden">
      <AnimatePresence mode="wait" initial={false} custom={custom}>
        <motion.div
          key={stepKey}
          custom={custom}
          variants={
            reduced
              ? {
                  enter: { opacity: 0 },
                  center: { opacity: 1 },
                  exit: { opacity: 0 },
                }
              : stepVariants
          }
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            duration: reduced ? 0.12 : 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ willChange: reduced ? "opacity" : "opacity, transform" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

type StepNavigationProps = {
  onBack?: () => void
  onContinue?: () => void
  continueLabel?: string
  backLabel?: string
  continueDisabled?: boolean
  loading?: boolean
  secondaryAction?: ReactNode
}

export function StepNavigation({
  onBack,
  onContinue,
  continueLabel = "Continue",
  backLabel = "Back",
  continueDisabled,
  loading,
  secondaryAction,
}: StepNavigationProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
          >
            {backLabel}
          </button>
        ) : null}
        {secondaryAction}
      </div>
      {onContinue ? (
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || loading}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--primary-from)] px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Please wait…" : continueLabel}
        </button>
      ) : null}
    </div>
  )
}
