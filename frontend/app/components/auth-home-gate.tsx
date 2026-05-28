"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { getDefaultRouteForUser, getStoredUser, isLoggedIn } from "@/lib/auth-client"

export function AuthHomeGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [showLanding, setShowLanding] = useState(false)

  useEffect(() => {
    if (isLoggedIn()) {
      router.replace(getDefaultRouteForUser(getStoredUser()))
      return
    }
    setShowLanding(true)
  }, [router])

  if (!showLanding) return null

  return children
}
