import type { ReactNode } from "react"

export function Card({
  children,
  className = "",
  elevated = false,
}: {
  children: ReactNode
  className?: string
  elevated?: boolean
}) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] ${
        elevated ? "shadow-[var(--shadow-md)]" : "shadow-[var(--shadow-sm)]"
      } ${className}`.trim()}
    >
      {children}
    </div>
  )
}

