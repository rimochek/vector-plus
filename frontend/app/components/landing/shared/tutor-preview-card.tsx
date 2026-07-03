"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"
import { Heart, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLandingContent } from "@/app/components/landing/use-landing-content"
import type { SampleTutor } from "@/app/components/landing/data"
import { formatTenge } from "@/lib/currency"

type TutorPreviewCardProps = {
  tutor: SampleTutor
  className?: string
  compact?: boolean
  href?: string
}

export function TutorPreviewCard({
  tutor,
  className,
  compact = false,
  href = "/tutors",
}: TutorPreviewCardProps) {
  const reduced = useReducedMotion()
  const { tutorCard } = useLandingContent()

  return (
    <motion.article
      whileHover={reduced ? undefined : { y: -6 }}
      whileTap={reduced ? undefined : { scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] transition-shadow duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-lg)]",
        compact ? "p-3" : "p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <motion.div
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-bold text-white",
            tutor.accent,
            compact ? "h-11 w-11 text-sm" : "h-14 w-14 text-base",
          )}
          whileHover={reduced ? undefined : { scale: 1.04 }}
        >
          {tutor.initials}
        </motion.div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className={cn("font-bold text-[var(--text-primary)]", compact ? "text-sm" : "text-base")}>
                {tutor.displayName}
              </p>
              <p className="text-xs font-semibold text-[var(--primary)]">{tutor.subject}</p>
            </div>
            <motion.button
              type="button"
              aria-label={tutorCard.save}
              className="rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--chip)] hover:text-[var(--primary)]"
              whileHover={reduced ? undefined : { scale: 1.12 }}
              whileTap={reduced ? undefined : { scale: 0.92 }}
            >
              <Heart className="h-4 w-4" />
            </motion.button>
          </div>
          {!compact && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--text-muted)]">
              {tutor.headline}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
              <Star className="h-3.5 w-3.5 fill-[var(--warning)] text-[var(--warning)]" />
              {tutor.rating.toFixed(1)}
            </span>
            <span>({tutor.reviews})</span>
            {tutor.verified && (
              <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--primary)]">
                {tutorCard.verified}
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {formatTenge(tutor.priceKzt)}
              <span className="ml-1 text-xs font-medium text-[var(--text-muted)]">/hr</span>
            </p>
            <Link href={href} className="text-xs font-semibold text-[var(--primary)] hover:underline">
              {tutorCard.viewProfile} →
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
