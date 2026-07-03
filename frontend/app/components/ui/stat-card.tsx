import type { LucideIcon } from "lucide-react"

export function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-md">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-[var(--primary-from)] dark:bg-indigo-950/40">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
          {label}
        </p>
        <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  )
}
