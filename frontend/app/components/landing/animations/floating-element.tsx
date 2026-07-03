"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { usePrefersReducedMotion } from "@/app/components/landing/animations/use-reduced-motion"
import { useSyncExternalStore } from "react"

function useCanFloat() {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(min-width: 768px)")
      mq.addEventListener("change", callback)
      return () => mq.removeEventListener("change", callback)
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  )
}

export function FloatingElement({
  children,
  className,
  delay = 0,
  offset = 6,
  duration = 5.5,
}: {
  children: ReactNode
  className?: string
  delay?: number
  offset?: number
  duration?: number
}) {
  const reduced = usePrefersReducedMotion()
  const canFloat = useCanFloat()

  if (reduced || !canFloat) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      animate={{ y: [-offset / 2, offset / 2, -offset / 2] }}
      transition={{
        duration: duration + delay * 0.4,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  )
}

/** @deprecated Use FloatingElement */
export const FloatingCard = FloatingElement
