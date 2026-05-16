"use client"

import { useCallback, useEffect, useState } from "react"

export function useStoredTheme() {
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("vector-theme")
    const isDark = stored === "dark"
    document.documentElement.classList.toggle("dark", isDark)
    const id = requestAnimationFrame(() => {
      setDarkMode(isDark)
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const toggleTheme = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("vector-theme", next ? "dark" : "light")
      return next
    })
  }, [])

  return { darkMode, toggleTheme } as const
}
