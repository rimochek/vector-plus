"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { authenticateWithTelegram, type TelegramAuthResponse } from "@/lib/auth/telegram-auth"
import { getDefaultRouteForUser } from "@/lib/auth-client"

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready: () => void; expand: () => void } }
  }
}

export function TelegramSignInButton({
  intendedRole,
  redirectAfterSuccess = true,
  onSuccess,
  onError,
}: {
  intendedRole?: "STUDENT" | "TUTOR"
  redirectAfterSuccess?: boolean
  onSuccess?: (data: TelegramAuthResponse) => void
  onError?: (message: string) => void
}) {
  const router = useRouter()
  const attempted = useRef(false)
  const [loading, setLoading] = useState(false)
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData
    if (!initData || attempted.current) return
    attempted.current = true
    window.Telegram?.WebApp?.ready()
    window.Telegram?.WebApp?.expand()
    setLoading(true)
    void authenticateWithTelegram(initData, intendedRole)
      .then((data) => {
        onSuccess?.(data)
        if (redirectAfterSuccess) router.push(getDefaultRouteForUser(data.user))
      })
      .catch((error: unknown) => onError?.(error instanceof Error ? error.message : "Telegram sign-in failed"))
      .finally(() => setLoading(false))
  }, [intendedRole, onError, onSuccess, redirectAfterSuccess, router])

  if (!username) return null
  return (
    <a
      href={`https://t.me/${username.replace(/^@/, "")}?startapp=auth`}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#178bc1]"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      {loading ? "Входим через Telegram…" : "Продолжить с Telegram"}
    </a>
  )
}
