"use client"

import { useCallback, useEffect, useState } from "react"
import {
  getStoredUser,
  isLoggedIn,
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
    refresh()
    window.addEventListener("storage", refresh)
    window.addEventListener("vector-auth-change", refresh)
    return () => {
      window.removeEventListener("storage", refresh)
      window.removeEventListener("vector-auth-change", refresh)
    }
  }, [refresh])

  return { user, isLoggedIn: loggedIn, ready }
}
