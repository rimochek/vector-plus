"use client"

import { motion } from "motion/react"
import { useReducedMotion } from "@/lib/onboarding/use-reduced-motion"

type RegistrationProgressProps = {
  current: number
  total: number
  stageLabel?: string
}

export function RegistrationProgress({
  current,
  total,
  stageLabel,
}: RegistrationProgressProps) {
  const reduced = useReducedMotion()
  const percent = Math.min(100, Math.round((current / total) * 100))

  return (
    <div className="space-y-2" aria-label={`Step ${current} of ${total}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Step {current} of {total}
        </p>
        {stageLabel ? (
          <p className="truncate text-xs font-medium text-[var(--text-muted)]">
            {stageLabel}
          </p>
        ) : null}
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)]"
          animate={{ width: `${percent}%` }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
        />
      </div>
    </div>
  )
}
