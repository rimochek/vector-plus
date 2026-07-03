"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useFinePointer, usePrefersReducedMotion } from "@/app/components/landing/animations/use-reduced-motion"

type Variant = "primary" | "secondary"

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--primary-from)] text-white shadow-md hover:bg-indigo-700 transition-colors duration-150",
  secondary:
    "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-sm hover:bg-[var(--chip)] transition-colors duration-150",
}

export function MagneticButtonLink({
  href,
  children,
  className = "",
  variant = "primary",
  magnetic = true,
}: {
  href: string
  children: React.ReactNode
  className?: string
  variant?: Variant
  magnetic?: boolean
}) {
  const ref = useRef<HTMLAnchorElement>(null)
  const reduced = usePrefersReducedMotion()
  const finePointer = useFinePointer()
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMove = (event: React.PointerEvent<HTMLAnchorElement>) => {
    if (!magnetic || reduced || !finePointer || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = event.clientX - rect.left - rect.width / 2
    const y = event.clientY - rect.top - rect.height / 2
    setOffset({ x: x * 0.12, y: y * 0.12 })
  }

  const reset = () => setOffset({ x: 0, y: 0 })

  return (
    <motion.div
      style={magnetic && !reduced && finePointer ? { x: offset.x, y: offset.y } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="inline-flex"
    >
      <Link
        ref={ref}
        href={href}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        className={cn(
          "inline-flex items-center justify-center rounded-[var(--radius-button)] px-5 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2",
          variantClass[variant],
          className,
        )}
      >
        <motion.span
          className="inline-flex items-center gap-2"
          whileHover={reduced ? undefined : { scale: 1.02 }}
          whileTap={reduced ? undefined : { scale: 0.98 }}
        >
          {children}
        </motion.span>
      </Link>
    </motion.div>
  )
}
