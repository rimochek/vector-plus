"use client"

import { useEffect } from "react"
import Lenis from "lenis"
import "lenis/dist/lenis.css"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { usePrefersReducedMotion } from "@/app/components/landing/animations/use-reduced-motion"

gsap.registerPlugin(ScrollTrigger)

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    if (reduced) return

    const lenis = new Lenis({
      lerp: 0.1,
      duration: 1.15,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      autoRaf: false,
    })

    const onScroll = () => ScrollTrigger.update()
    lenis.on("scroll", onScroll)

    const ticker = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      lenis.off("scroll", onScroll)
      gsap.ticker.remove(ticker)
      lenis.destroy()
    }
  }, [reduced])

  return children
}
