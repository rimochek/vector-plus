"use client"

import { motion, useSpring } from "motion/react"
import type { ReactNode } from "react"
import { useRef } from "react"
import { useFinePointer, usePrefersReducedMotion } from "@/app/components/landing/animations/use-reduced-motion"

export function HeroParallax({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const finePointer = useFinePointer()
  const x = useSpring(0, { stiffness: 120, damping: 22 })
  const y = useSpring(0, { stiffness: 120, damping: 22 })

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || !finePointer || !rootRef.current) return
    const rect = rootRef.current.getBoundingClientRect()
    const nx = (event.clientX - rect.left) / rect.width - 0.5
    const ny = (event.clientY - rect.top) / rect.height - 0.5
    x.set(nx * 10)
    y.set(ny * 8)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  if (reduced || !finePointer) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={rootRef}
      className={className}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <motion.div style={{ x, y }}>{children}</motion.div>
    </div>
  )
}

export function HeroParallaxChild({
  children,
  depth = 1,
  className,
}: {
  children: ReactNode
  depth?: number
  className?: string
}) {
  const reduced = usePrefersReducedMotion()
  const finePointer = useFinePointer()
  const x = useSpring(0, { stiffness: 100 + depth * 10, damping: 24 })
  const y = useSpring(0, { stiffness: 100 + depth * 10, damping: 24 })

  if (reduced || !finePointer) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div style={{ x, y }} className={className}>
      {children}
    </motion.div>
  )
}
