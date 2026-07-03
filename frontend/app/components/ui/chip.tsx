"use client"

import type { ReactNode } from "react"

export function Chip({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-semibold transition duration-150 ease-in-out ${
        selected
          ? "bg-[var(--primary-from)] text-white shadow-sm"
          : "bg-[var(--chip)] text-[var(--text-secondary)] hover:bg-indigo-50 hover:text-[var(--primary-from)] dark:hover:bg-[rgba(255,255,255,0.07)]"
      } ${className}`.trim()}
    >
      {children}
    </button>
  )
}
