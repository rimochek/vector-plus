"use client"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

type StoryStepProps = {
  index: number
  label: string
  title: string
  description: string
  /** Static layouts (mobile / reduced motion) — desktop scroll story uses `.is-active` from GSAP */
  active?: boolean
  className?: string
}

export const StoryStep = forwardRef<HTMLDivElement, StoryStepProps>(function StoryStep(
  { index, label, title, description, active = false, className },
  ref,
) {
  return (
    <div
      ref={ref}
      data-story-step={index}
      className={cn(
        "story-step rounded-[var(--radius-card)] border px-5 py-4 opacity-50",
        "border-transparent bg-transparent",
        "[&.is-active]:border-[var(--primary)] [&.is-active]:bg-[var(--surface)] [&.is-active]:opacity-100 [&.is-active]:shadow-[var(--shadow-sm)]",
        active && "is-active",
        className,
      )}
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">{label}</p>
      <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{description}</p>
    </div>
  )
})
