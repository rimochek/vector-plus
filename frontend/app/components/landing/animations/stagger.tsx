"use client"

import { motion, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15, margin: "-40px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  variant = "up",
}: {
  children: ReactNode
  className?: string
  variant?: "up" | "scale"
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  const hidden =
    variant === "scale"
      ? { opacity: 0, y: 18, scale: 0.98 }
      : { opacity: 0, y: 22 }

  return (
    <motion.div
      variants={{
        hidden,
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
        },
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

export function InteractiveCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}
