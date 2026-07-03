"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RegisterRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const role = params.get("role")
    if (role === "tutor") {
      router.replace("/signup/tutor")
      return
    }
    if (role === "student") {
      router.replace("/signup/student")
      return
    }
    router.replace("/signup")
  }, [router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8FAFC] text-sm text-[var(--text-muted)]">
      Redirecting…
    </div>
  )
}
