"use client"

import { motion } from "motion/react"
import { useReducedMotion } from "@/lib/onboarding/use-reduced-motion"

export function FriendlyError({ message }: { message?: string | null }) {
  const reduced = useReducedMotion()
  if (!message) return null

  return (
    <motion.p
      initial={reduced ? false : { opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduced ? 0 : 0.2 }}
      className="text-sm text-red-600"
      role="alert"
    >
      {message}
    </motion.p>
  )
}

export function FormErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
      role="alert"
    >
      {message}
    </div>
  )
}
