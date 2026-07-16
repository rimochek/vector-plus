"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getStoredUser,
  isLoggedIn,
  refreshCurrentUser,
  type StoredUser,
} from "@/lib/auth-client"

export function useAuthSession() {
  const [user, setUser] = useState<StoredUser | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(() => {
    setLoggedIn(isLoggedIn())
    setUser(getStoredUser())
    setReady(true)
  }, [])

  useEffect(() => {
    let cancelled = false

    const bootstrap = async () => {
      if (isLoggedIn()) {
        await refreshCurrentUser()
      }
      if (!cancelled) refresh()
    }

    void bootstrap()
    window.addEventListener("storage", refresh)
    window.addEventListener("vector-auth-change", refresh)
    return () => {
      cancelled = true
      window.removeEventListener("storage", refresh)
      window.removeEventListener("vector-auth-change", refresh)
    }
  }, [refresh])

  return { user, isLoggedIn: loggedIn, ready }
}
