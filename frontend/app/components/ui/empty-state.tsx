import type { LucideIcon } from "lucide-react"

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <div className="mb-4 rounded-full bg-[var(--chip)] p-4">
        <Icon className="h-8 w-8 text-[var(--text-muted)] opacity-60" />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-muted)]">{description}</p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-[var(--radius-button)] bg-[var(--primary-from)] px-4 py-2 text-sm font-semibold text-white shadow-md transition duration-150 ease-in-out hover:bg-indigo-700"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
