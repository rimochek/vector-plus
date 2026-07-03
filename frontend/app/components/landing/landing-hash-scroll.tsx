"use client"

import { useEffect } from "react"

export function LandingHashScroll() {
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const id = hash.slice(1)
    const scrollToTarget = () => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    const timer = window.setTimeout(scrollToTarget, 80)
    return () => window.clearTimeout(timer)
  }, [])

  return null
}
