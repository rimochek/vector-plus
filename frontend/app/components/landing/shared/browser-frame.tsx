import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function BrowserFrame({
  children,
  className,
  title = "Tutora",
}: {
  children: ReactNode
  className?: string
  title?: string
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        <span className="ml-2 text-xs font-medium text-[var(--text-muted)]">{title}</span>
      </div>
      <div className="bg-[var(--background)]">{children}</div>
    </div>
  )
}
