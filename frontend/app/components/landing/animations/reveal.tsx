"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

export type RevealVariant = "up" | "scale" | "left" | "right" | "none"

const variantMap: Record<
  RevealVariant,
  { hidden: { opacity: number; x?: number; y?: number; scale?: number }; show: object }
> = {
  up: { hidden: { opacity: 0, y: 24 }, show: {} },
  scale: { hidden: { opacity: 0, y: 16, scale: 0.97 }, show: {} },
  left: { hidden: { opacity: 0, x: -24 }, show: {} },
  right: { hidden: { opacity: 0, x: 24 }, show: {} },
  none: { hidden: { opacity: 0 }, show: {} },
}

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  variant?: RevealVariant
  once?: boolean
}

export function Reveal({
  children,
  className,
  delay = 0,
  y,
  variant = "up",
  once = true,
}: RevealProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  const base = variantMap[variant]
  const hidden = y !== undefined && variant === "up" ? { ...base.hidden, y } : base.hidden

  return (
    <motion.div
      initial={hidden}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, amount: 0.2, margin: "-40px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
