"use client"

import { useEffect, useState } from "react"

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduced(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return reduced
}

export function motionTransition(reduced: boolean, duration = 0.35) {
  return reduced ? { duration: 0 } : { duration, ease: "easeOut" as const }
}
