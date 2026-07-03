"use client"

import { useReducedMotion } from "motion/react"
import { useSyncExternalStore } from "react"

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function getServerSnapshot() {
  return false
}

export function usePrefersReducedMotion() {
  const motionReduced = useReducedMotion()
  const mediaReduced = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  return Boolean(motionReduced ?? mediaReduced)
}

export function useFinePointer() {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(pointer: fine)")
      mq.addEventListener("change", callback)
      return () => mq.removeEventListener("change", callback)
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  )
}

export function useIsDesktop() {
  return useSyncExternalStore(
    (callback) => {
      const mq = window.matchMedia("(min-width: 1024px)")
      mq.addEventListener("change", callback)
      return () => mq.removeEventListener("change", callback)
    },
    () => window.matchMedia("(min-width: 1024px)").matches,
    () => false,
  )
}
