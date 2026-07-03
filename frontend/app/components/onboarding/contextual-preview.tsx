"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useReducedMotion } from "@/lib/onboarding/use-reduced-motion"

export function ContextualPreview({
  visualKey,
  children,
}: {
  visualKey: string
  children: ReactNode
}) {
  const reduced = useReducedMotion()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={visualKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0.1 : 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
