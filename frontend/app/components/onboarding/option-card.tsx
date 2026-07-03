"use client"

import type { ReactNode } from "react"
import { Check } from "lucide-react"

type OptionCardProps = {
  selected: boolean
  onClick: () => void
  children: ReactNode
  description?: string
  compact?: boolean
}

export function OptionCard({
  selected,
  onClick,
  children,
  description,
  compact,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-from)] active:scale-[0.98] hover:-translate-y-0.5 ${
        compact ? "min-h-[52px] py-3" : "min-h-[56px] py-4"
      } ${
        selected
          ? "scale-[1.01] border-[var(--primary-from)] bg-violet-50 shadow-sm dark:bg-violet-950/25"
          : "border-slate-200 bg-white hover:border-violet-200 dark:border-[var(--border)] dark:bg-[var(--surface)]"
      }`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? "border-[var(--primary-from)] bg-[var(--primary-from)] text-white"
            : "border-slate-300 bg-white dark:border-[var(--border)]"
        }`}
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--text-primary)] sm:text-base">
          {children}
        </span>
        {description ? (
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  )
}
