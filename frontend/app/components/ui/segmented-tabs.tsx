"use client"

export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
  label,
}: {
  tabs: { id: T; label: string }[]
  active: T
  onChange: (id: T) => void
  ariaLabel?: string
  label?: (id: T) => string
}) {
  return (
    <div
      className="inline-flex w-full max-w-full overflow-x-auto rounded-xl bg-[var(--chip)] p-1 sm:w-auto"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map(({ id, label: tabLabel }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={active === id}
          onClick={() => onChange(id)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition duration-150 ease-in-out ${
            active === id
              ? "bg-[var(--primary-from)] text-white shadow-sm"
              : "text-[var(--text-muted)] hover:bg-indigo-50 hover:text-[var(--primary-from)] dark:hover:bg-[rgba(255,255,255,0.06)]"
          }`}
        >
          {label ? label(id) : tabLabel}
        </button>
      ))}
    </div>
  )
}
