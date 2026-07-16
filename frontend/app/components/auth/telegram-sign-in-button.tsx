"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  authenticateWithTelegram,
  authenticateWithTelegramWidget,
  type TelegramAuthResponse,
  type TelegramWidgetUser,
} from "@/lib/auth/telegram-auth"
import { getDefaultRouteForUser } from "@/lib/auth-client"

declare global {
  interface Window {
    Telegram?: { WebApp?: { initData?: string; ready: () => void; expand: () => void } }
    onTutoraTelegramAuth?: (user: TelegramWidgetUser) => void
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
  const containerRef = useRef<HTMLDivElement>(null)
  const attempted = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const [loading, setLoading] = useState(false)
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "")

  useEffect(() => {
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [onError, onSuccess])

  useEffect(() => {
    const finishAuthentication = (request: Promise<TelegramAuthResponse>) => {
      setLoading(true)
      void request
        .then((data) => {
          onSuccessRef.current?.(data)
          if (redirectAfterSuccess) router.push(getDefaultRouteForUser(data.user))
        })
        .catch((error: unknown) => {
          attempted.current = false
          onErrorRef.current?.(error instanceof Error ? error.message : "Telegram sign-in failed")
        })
        .finally(() => setLoading(false))
    }

    const initData = window.Telegram?.WebApp?.initData
    if (initData && !attempted.current) {
      attempted.current = true
      window.Telegram?.WebApp?.ready()
      window.Telegram?.WebApp?.expand()
      finishAuthentication(authenticateWithTelegram(initData, intendedRole))
      return
    }

    if (!username || !containerRef.current) return
    window.onTutoraTelegramAuth = (user) => {
      if (attempted.current) return
      attempted.current = true
      finishAuthentication(authenticateWithTelegramWidget(user, intendedRole))
    }

    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.async = true
    script.setAttribute("data-telegram-login", username)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-radius", "24")
    script.setAttribute("data-request-access", "write")
    script.setAttribute("data-userpic", "false")
    script.setAttribute("data-onauth", "onTutoraTelegramAuth(user)")
    containerRef.current.replaceChildren(script)

    return () => {
      delete window.onTutoraTelegramAuth
      containerRef.current?.replaceChildren()
    }
  }, [intendedRole, redirectAfterSuccess, router, username])

  if (!username) return null
  return (
    <div className="relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-full">
      <div ref={containerRef} className={loading ? "invisible" : "flex justify-center"} />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-full bg-[#229ED9] px-5 py-3 text-sm font-bold text-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          Входим через Telegram…
        </div>
      )}
    </div>
  )
}
