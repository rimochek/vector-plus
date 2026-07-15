"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import {
  authenticateWithGoogle,
  GoogleAuthError,
  type GoogleAuthResponse,
} from "@/lib/auth/google-auth"
import { getDefaultRouteForUser } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          renderButton: (
            element: HTMLElement,
            options: Record<string, unknown>,
          ) => void
          prompt: () => void
        }
      }
    }
  }
}

type GoogleSignInButtonProps = {
  intendedRole?: "STUDENT" | "TUTOR"
  onSuccess?: (data: GoogleAuthResponse) => void
  onError?: (message: string) => void
  className?: string
  redirectAfterSuccess?: boolean
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client"

let gisScriptPromise: Promise<void> | null = null

function loadGoogleScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gisScriptPromise) return gisScriptPromise

  gisScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(
      `script[src="${GIS_SCRIPT_SRC}"]`,
    ) as HTMLScriptElement | null

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Google SDK failed to load")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google SDK failed to load"))
    document.head.appendChild(script)
  })

  return gisScriptPromise
}

export function GoogleSignInButton({
  intendedRole,
  onSuccess,
  onError,
  className = "",
  redirectAfterSuccess = true,
}: GoogleSignInButtonProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const handleCredential = useCallback(
    async (credential: string) => {
      if (loading) return
      setLoading(true)
      try {
        const data = await authenticateWithGoogle({
          credential,
          intendedRole,
        })
        onSuccess?.(data)
        if (redirectAfterSuccess) {
          router.push(getDefaultRouteForUser(data.user))
        }
      } catch (error) {
        const message =
          error instanceof GoogleAuthError
            ? error.message
            : "We couldn't sign you in with Google. Please try again."
        onError?.(message)
      } finally {
        setLoading(false)
      }
    },
    [intendedRole, loading, onError, onSuccess, redirectAfterSuccess, router],
  )

  useEffect(() => {
    if (!clientId || !containerRef.current) return

    let cancelled = false

    void loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) {
          return
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              void handleCredential(response.credential)
            }
          },
          auto_select: false,
          ux_mode: "popup",
        })

        containerRef.current.innerHTML = ""
        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          width: Math.min(containerRef.current.offsetWidth || 320, 400),
        })

        setReady(true)
      })
      .catch(() => {
        onError?.("Google sign-in is unavailable right now.")
      })

    return () => {
      cancelled = true
    }
  }, [clientId, handleCredential, onError])

  if (!clientId) {
    return null
  }

  return (
    <div className={className}>
      {!ready || loading ? (
        <div className="flex min-h-[44px] items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-[var(--text-muted)] dark:border-[var(--border)] dark:bg-[var(--surface)]">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in with Google…
            </>
          ) : (
            "Loading Google sign-in…"
          )}
        </div>
      ) : null}
      <div
        ref={containerRef}
        className={`flex min-h-[44px] justify-center ${ready && !loading ? "" : "sr-only"}`}
      />
    </div>
  )
}

export function GoogleAuthDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-slate-200 dark:bg-[var(--border)]" />
      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        or
      </span>
      <div className="h-px flex-1 bg-slate-200 dark:bg-[var(--border)]" />
    </div>
  )
}
