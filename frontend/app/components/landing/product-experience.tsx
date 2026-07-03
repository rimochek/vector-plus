"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import {
  Bookmark,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PRODUCT_FEATURES } from "@/app/components/landing/data"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { BrowserFrame } from "@/app/components/landing/shared/browser-frame"

const FEATURE_ICONS = {
  find: Search,
  book: CalendarDays,
  message: MessageSquare,
  track: CalendarDays,
  favorites: Bookmark,
  dashboard: LayoutDashboard,
} as const

function FeaturePreview({ featureId }: { featureId: (typeof PRODUCT_FEATURES)[number]["id"] }) {
  const panels: Record<string, ReactNode> = {
    find: (
      <div className="space-y-3 p-5">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-muted)]">
          Search: IELTS · Evening · Online
        </div>
        <div className="grid gap-2">
          {["Amina K. · 4.9 · ₸8,500/hr", "James W. · 4.8 · ₸7,000/hr"].map((row) => (
            <div key={row} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium">
              {row}
            </div>
          ))}
        </div>
      </div>
    ),
    book: (
      <div className="space-y-3 p-5">
        <div className="rounded-xl bg-[var(--primary-soft)] p-4">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">Available slots</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Mon 5 PM", "Tue 6 PM", "Thu 7 PM"].map((slot) => (
              <span key={slot} className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold">
                {slot}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm">Confirm booking request</div>
      </div>
    ),
    message: (
      <div className="space-y-3 p-5">
        {[
          { mine: false, text: "Can we focus on speaking part 2 this week?" },
          { mine: true, text: "Absolutely — I'll share a practice sheet before Tuesday." },
        ].map((msg, i) => (
          <div key={i} className={`flex ${msg.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                msg.mine
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-secondary)] text-[var(--text-primary)]",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    ),
    track: (
      <div className="space-y-3 p-5">
        <div className="rounded-xl border border-[var(--border)] px-4 py-3">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Upcoming</p>
          <p className="mt-1 font-bold">IELTS speaking · Tue 6:00 PM</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] px-4 py-3 opacity-70">
          <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">Completed</p>
          <p className="mt-1 font-bold">SAT Math · Last week</p>
        </div>
      </div>
    ),
    favorites: (
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {["Elena · SAT", "David · English"].map((name) => (
          <div key={name} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-sm font-bold text-[var(--primary)]">
              {name.charAt(0)}
            </div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-[var(--text-muted)]">Saved · Compare later</p>
          </div>
        ))}
      </div>
    ),
    dashboard: (
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        {[
          { label: "Upcoming lessons", value: "2" },
          { label: "Unread messages", value: "1" },
          { label: "Saved tutors", value: "4" },
          { label: "Notifications", value: "3" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
            <p className="mt-1 text-2xl font-extrabold">{item.value}</p>
          </div>
        ))}
      </div>
    ),
  }

  return panels[featureId] ?? panels.find
}

export function ProductExperience() {
  const [active, setActive] = useState<(typeof PRODUCT_FEATURES)[number]["id"]>("find")
  const reduced = useReducedMotion()
  const current = PRODUCT_FEATURES.find((f) => f.id === active) ?? PRODUCT_FEATURES[0]

  return (
    <LandingSection className="bg-[var(--surface-secondary)]/40">
      <SectionHeading
        title="Everything around your lessons, in one place"
        description="Tutora keeps discovery, booking, messaging, and your dashboard connected."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div className="space-y-2">
          {PRODUCT_FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id]
            const selected = feature.id === active
            return (
              <button
                key={feature.id}
                type="button"
                onClick={() => setActive(feature.id)}
                className={cn(
                  "flex w-full items-start gap-4 rounded-[var(--radius-card)] border px-4 py-4 text-left transition duration-200",
                  selected
                    ? "border-[var(--primary)] bg-[var(--surface)] shadow-[var(--shadow-sm)]"
                    : "border-transparent bg-transparent hover:border-[var(--border)] hover:bg-[var(--surface)]/70",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 rounded-xl p-2",
                    selected
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "bg-[var(--chip)] text-[var(--text-muted)]",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-bold text-[var(--text-primary)]">{feature.title}</span>
                  <span className="mt-1 block text-sm text-[var(--text-muted)]">{feature.description}</span>
                </span>
              </button>
            )
          })}
        </div>

        <BrowserFrame title={`Tutora — ${current.title}`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduced ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <FeaturePreview featureId={active} />
            </motion.div>
          </AnimatePresence>
        </BrowserFrame>
      </div>
    </LandingSection>
  )
}
