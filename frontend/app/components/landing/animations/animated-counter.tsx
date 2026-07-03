"use client"

import { useInView, useReducedMotion } from "motion/react"
import { useEffect, useRef, useState } from "react"

export function AnimatedCounter({
  value,
  suffix = "",
  className,
}: {
  value: string
  suffix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-40px" })
  const reduced = useReducedMotion()
  const numericMatch = value.match(/^(\d+)/)
  const target = numericMatch ? Number(numericMatch[1]) : null
  const prefix = numericMatch ? value.slice(numericMatch[1].length) : value
  const [display, setDisplay] = useState(reduced || target === null ? value : "0")

  useEffect(() => {
    if (!inView || target === null || reduced) {
      setDisplay(value)
      return
    }

    let frame = 0
    const totalFrames = 75
    const id = window.setInterval(() => {
      frame += 1
      const progress = frame / totalFrames
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(`${Math.round(target * eased)}${prefix}`)
      if (frame >= totalFrames) window.clearInterval(id)
    }, 16)

    return () => window.clearInterval(id)
  }, [inView, prefix, reduced, target, value])

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  )
}
