"use client"

import { forwardRef, useLayoutEffect, useRef, type ReactNode } from "react"
import { Bookmark, Calendar, Heart, MessageSquare, Search, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProductScrollStepId } from "@/app/components/landing/data"
import { BrowserFrame } from "@/app/components/landing/shared/browser-frame"

function FindPanel() {
  return (
    <div className="space-y-3 p-5">
      <div className="relative rounded-xl border-2 border-[var(--primary)] bg-[var(--surface-secondary)] px-4 py-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--primary)]" />
        <p className="pl-7 text-sm font-medium text-[var(--text-primary)]">IELTS · Online · Evening</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {["IELTS", "₸5k–10k", "Online"].map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]"
          >
            {chip}
          </span>
        ))}
      </div>
      <div className="grid gap-2">
        {["Amina K. · 4.9 · ₸8,500/hr", "James W. · 4.8 · ₸7,000/hr", "Elena R. · 4.9 · ₸9,500/hr"].map(
          (row) => (
            <div
              key={row}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium"
            >
              {row}
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function ComparePanel() {
  return (
    <div className="space-y-3 p-5">
      <div className="rounded-xl border-2 border-[var(--primary)] bg-[var(--surface)] p-4 shadow-[var(--shadow-md)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-bold text-[var(--text-primary)]">Amina Kasymova</p>
            <p className="text-xs font-semibold text-[var(--primary)]">IELTS · 6 yrs</p>
          </div>
          <Heart className="h-4 w-4 fill-[var(--primary-soft)] text-[var(--primary)]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-primary)]">
            <Star className="h-3.5 w-3.5 fill-[var(--warning)] text-[var(--warning)]" /> 4.9
          </span>
          <span>₸8,500/hr</span>
          <span>Evenings · Online</span>
        </div>
      </div>
      {["James W. · 4.8", "Elena R. · 4.9"].map((row) => (
        <div
          key={row}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm opacity-60"
        >
          {row}
        </div>
      ))}
    </div>
  )
}

function BookPanel() {
  return (
    <div className="space-y-3 p-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-sm font-bold text-[var(--text-primary)]">Amina Kasymova</p>
        <p className="text-xs text-[var(--text-muted)]">IELTS speaking · 60 min</p>
      </div>
      <div className="rounded-xl bg-[var(--primary-soft)] p-4">
        <p className="text-xs font-semibold uppercase text-[var(--primary)]">Available slots</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Mon 5 PM", "Tue 6 PM", "Thu 7 PM"].map((slot, i) => (
            <span
              key={slot}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                i === 1
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-[var(--surface)]",
              )}
            >
              {slot}
            </span>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)] p-3">
        <Calendar className="h-5 w-5 text-[var(--primary)]" />
        <div>
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">Booking request sent</p>
          <p className="text-sm font-bold">Tue · 6:00 PM · Pending tutor approval</p>
        </div>
      </div>
    </div>
  )
}

function LearnPanel() {
  return (
    <div className="space-y-3 p-5">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Upcoming lesson</p>
        <p className="mt-1 font-bold">IELTS speaking · Tue 6:00 PM</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Saved tutors", value: "3" },
          { label: "Messages", value: "1" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
            <p className="text-xl font-extrabold">{item.value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[var(--primary)]">
          <MessageSquare className="h-4 w-4" />
          Tutor chat
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          &ldquo;I&apos;ll share a speaking worksheet before our session.&rdquo;
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
        <Bookmark className="h-4 w-4" />
        Dashboard · lessons, favorites, and notifications
      </div>
    </div>
  )
}

const PANELS: Record<ProductScrollStepId, () => ReactNode> = {
  find: FindPanel,
  compare: ComparePanel,
  book: BookPanel,
  learn: LearnPanel,
}

export function ProductPreviewSingle({ step }: { step: ProductScrollStepId }) {
  const Panel = PANELS[step]
  return (
    <BrowserFrame title={`Tutora — ${step}`}>
      <Panel />
    </BrowserFrame>
  )
}

export const ProductPreviewStage = forwardRef<
  HTMLDivElement,
  { className?: string }
>(function ProductPreviewStage({ className }, ref) {
  const steps: ProductScrollStepId[] = ["find", "compare", "book", "learn"]
  const measureRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const stage = measureRef.current?.parentElement
    if (!stage) return

    const panels = stage.querySelectorAll<HTMLElement>("[data-story-panel]")
    let maxHeight = 0
    panels.forEach((panel) => {
      maxHeight = Math.max(maxHeight, panel.offsetHeight)
    })
    if (maxHeight > 0) {
      stage.style.height = `${maxHeight}px`
    }
  }, [])

  return (
    <div ref={ref} className={cn("relative w-full min-h-[340px]", className)}>
      {/* Invisible sizer — all panels stacked for height measurement */}
      <div ref={measureRef} className="pointer-events-none invisible absolute inset-x-0 top-0" aria-hidden>
        {steps.map((step) => {
          const Panel = PANELS[step]
          return (
            <div key={step}>
              <BrowserFrame title={`Tutora — ${step}`}>
                <Panel />
              </BrowserFrame>
            </div>
          )
        })}
      </div>

      {steps.map((step, index) => {
        const Panel = PANELS[step]
        return (
          <div
            key={step}
            data-story-panel={step}
            className="story-panel absolute inset-x-0 top-0"
            aria-hidden={index !== 0}
          >
            <BrowserFrame title={`Tutora — ${step}`}>
              <Panel />
            </BrowserFrame>
          </div>
        )
      })}
    </div>
  )
})
