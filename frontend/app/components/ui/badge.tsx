import type { ReactNode } from "react"

type BadgeTone = "primary" | "success" | "warning" | "danger" | "muted" | "info"

const toneClass: Record<BadgeTone, string> = {
  primary: "bg-[var(--primary-soft)] text-[var(--primary-hover)]",
  success: "bg-[var(--success-soft)] text-[var(--success)]",
  warning: "bg-[var(--warning-soft)] text-amber-700 dark:text-amber-300",
  danger: "bg-[var(--danger-soft)] text-[var(--danger)]",
  muted: "bg-[var(--chip)] text-[var(--text-muted)]",
  info: "bg-[var(--info-soft)] text-[var(--info)]",
}

export function Badge({
  children,
  tone = "muted",
  className = "",
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClass[tone]} ${className}`.trim()}
    >
      {children}
    </span>
  )
}

