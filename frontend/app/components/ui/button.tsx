import type { ButtonHTMLAttributes, ReactNode } from "react"
import Link from "next/link"

type Variant = "primary" | "secondary" | "ghost"

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--primary-from)] text-white shadow-md hover:bg-indigo-700 transition duration-150 ease-in-out",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--chip)] transition duration-150 ease-in-out",
  ghost:
    "text-[var(--text-secondary)] hover:bg-[var(--chip)] hover:text-[var(--text-primary)] transition duration-150 ease-in-out",
}

type BaseProps = {
  variant?: Variant
  children: ReactNode
  className?: string
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-[var(--radius-button)] px-5 py-3 text-sm font-semibold active:scale-[0.98] disabled:opacity-50 ${variantClass[variant]} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className = "",
}: BaseProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center rounded-[var(--radius-button)] px-5 py-3 text-sm font-semibold active:scale-[0.98] ${variantClass[variant]} ${className}`.trim()}
    >
      {children}
    </Link>
  )
}
