"use client"

import { motion } from "motion/react"
import { Search, Star } from "lucide-react"
import { useReducedMotion } from "@/lib/onboarding/use-reduced-motion"

export function StudentSearchPreview() {
  const reduced = useReducedMotion()

  return (
    <div className="rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-xl dark:border-violet-900/40 dark:bg-[var(--surface)]">
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 dark:border-[var(--border)]">
        <Search className="h-4 w-4 text-[var(--primary-from)]" />
        <motion.span
          animate={reduced ? undefined : { opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="text-sm text-[var(--text-muted)]"
        >
          Mathematics
        </motion.span>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        {["IELTS", "₸5k–8k", "Online"].map((chip, index) => (
          <motion.span
            key={chip}
            initial={reduced ? undefined : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.15 }}
            className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-[var(--primary-from)] dark:bg-violet-950/30"
          >
            {chip}
          </motion.span>
        ))}
      </div>
      <div className="space-y-3">
        {[
          { name: "Tutor A", subject: "Math · IELTS", rate: "₸6,000/hr", highlight: false },
          { name: "Tutor B", subject: "Math · Exam prep", rate: "₸7,500/hr", highlight: true },
          { name: "Tutor C", subject: "Math · School support", rate: "₸5,500/hr", highlight: false },
        ].map((card, index) => (
          <motion.div
            key={card.name}
            layout={!reduced}
            animate={
              reduced
                ? undefined
                : card.highlight
                  ? { scale: 1.02, borderColor: "rgb(124 58 237)" }
                  : { scale: 1 }
            }
            transition={{ delay: 0.5 + index * 0.1 }}
            className={`rounded-2xl border p-3 ${
              card.highlight
                ? "border-[var(--primary-from)] bg-violet-50/80 dark:bg-violet-950/20"
                : "border-slate-200 dark:border-[var(--border)]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{card.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{card.subject}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-[var(--primary-from)]">{card.rate}</p>
                {card.highlight ? (
                  <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                    <Star className="h-3 w-3" /> Best match
                  </p>
                ) : null}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function TutorProfileBuildPreview() {
  const reduced = useReducedMotion()
  const steps = [
    "Add photo",
    "Teaching subjects",
    "Set pricing",
    "Add availability",
  ]

  return (
    <div className="rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-xl dark:border-violet-900/40 dark:bg-[var(--surface)]">
      <div className="mb-4 flex items-center gap-3">
        <motion.div
          animate={reduced ? undefined : { opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-200 to-indigo-200 dark:from-violet-900 dark:to-indigo-900"
        />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-3/4 rounded-full bg-slate-200 dark:bg-zinc-700" />
          <div className="h-2 w-1/2 rounded-full bg-slate-100 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <motion.div
            key={step}
            initial={reduced ? undefined : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 * index }}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[var(--border)]"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-[var(--primary-from)] dark:bg-violet-950/40">
              {index + 1}
            </span>
            {step}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function TutorComparisonPreview() {
  const columns = ["Experience", "Price", "Availability"]
  return (
    <div className="rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-xl dark:border-violet-900/40 dark:bg-[var(--surface)]">
      <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        {columns.map((column) => (
          <span key={column}>{column}</span>
        ))}
      </div>
      {[1, 2, 3].map((row) => (
        <div
          key={row}
          className="mb-2 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 px-2 py-3 text-center text-xs dark:border-[var(--border)]"
        >
          <span>{row + 2} yrs</span>
          <span>₸{(4 + row) * 1000}</span>
          <span>Evenings</span>
        </div>
      ))}
    </div>
  )
}

export function ProgressCelebration({
  items,
}: {
  items: { label: string; done: boolean }[]
}) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.label}
          className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
            item.done
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300"
              : "border-slate-200 dark:border-[var(--border)]"
          }`}
        >
          <span>{item.done ? "✓" : "○"}</span>
          {item.label}
        </li>
      ))}
    </ul>
  )
}
