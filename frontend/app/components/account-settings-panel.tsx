"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, Loader2, LogOut, Send, Trash2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, ApiError } from "@/lib/api-client"
import { getStoredUser, logout, refreshCurrentUser } from "@/lib/auth-client"
import type { TelegramWidgetUser } from "@/lib/auth/telegram-auth"
import { Button } from "@/app/components/ui/button"
import { useToast } from "@/lib/toast-context"

declare global {
  interface Window {
    onTutoraTelegramLink?: (user: TelegramWidgetUser) => void
  }
}

function TelegramLinkWidget({ onLinked }: { onLinked: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const username = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.replace(/^@/, "")

  useEffect(() => {
    if (!username || !containerRef.current) return
    window.onTutoraTelegramLink = (user) => {
      setLoading(true)
      void api.auth
        .linkTelegram(user)
        .then(() => {
          toast.success("Telegram account connected")
          onLinked()
        })
        .catch((error: unknown) =>
          toast.error(error instanceof Error ? error.message : "Could not connect Telegram"),
        )
        .finally(() => setLoading(false))
    }

    const script = document.createElement("script")
    script.src = "https://telegram.org/js/telegram-widget.js?22"
    script.async = true
    script.setAttribute("data-telegram-login", username)
    script.setAttribute("data-size", "large")
    script.setAttribute("data-radius", "20")
    script.setAttribute("data-request-access", "write")
    script.setAttribute("data-userpic", "false")
    script.setAttribute("data-onauth", "onTutoraTelegramLink(user)")
    containerRef.current.replaceChildren(script)

    return () => {
      delete window.onTutoraTelegramLink
      containerRef.current?.replaceChildren()
    }
  }, [onLinked, toast, username])

  if (!username) return <p className="text-sm text-[var(--danger)]">Telegram is not configured.</p>
  return (
    <div className="relative flex min-h-10 items-center">
      <div ref={containerRef} className={loading ? "invisible" : ""} />
      {loading && (
        <div className="absolute inset-0 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Connecting Telegram…
        </div>
      )}
    </div>
  )
}

export function AccountSettingsPanel() {
  const { t } = useTranslations()
  const router = useRouter()
  const toast = useToast()

  const [telegramLinked, setTelegramLinked] = useState(
    () => getStoredUser()?.authProviders?.includes("telegram") ?? false,
  )
  const [logoutLoading, setLogoutLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    void refreshCurrentUser().then((user) =>
      setTelegramLinked(user?.authProviders?.includes("telegram") ?? false),
    )
  }, [])

  const handleLogout = async () => {
    setLogoutLoading(true)
    await logout()
    router.replace("/login")
  }

  const handleTelegramLinked = useCallback(() => {
    setTelegramLinked(true)
    void refreshCurrentUser()
  }, [])

  const handleDeleteAccount = async () => {
    setDeleteError(null)
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      setDeleteError(t("settings.deleteConfirmHint"))
      return
    }

    setDeleteLoading(true)
    try {
      await api.auth.deleteAccount()
      await logout()
      toast.success(t("settings.accountDeleted"))
      router.push("/login")
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("settings.deleteFailed")
      setDeleteError(message)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Send className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Telegram
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Connect Telegram to use it for login and receive lesson notifications.
            </p>
          </div>
        </div>

        {telegramLinked ? (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5" /> Telegram account connected
          </div>
        ) : (
          <TelegramLinkWidget onLinked={handleTelegramLinked} />
        )}
      </section>

      <section className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Sign out</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">End your current session on this device.</p>
          </div>
          <Button type="button" className="gap-2" disabled={logoutLoading} onClick={() => void handleLogout()}>
            {logoutLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            Sign out
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-red-200 bg-[var(--surface)] p-6 dark:border-red-900/50">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40">
            <Trash2 className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t("settings.deleteAccount")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("settings.deleteAccountHint")}
            </p>
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            {t("settings.deleteConfirmLabel")}
          </span>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-red-500"
          />
        </label>

        {deleteError ? (
          <p className="mt-3 text-sm text-[var(--danger)]">{deleteError}</p>
        ) : null}

        <Button
          type="button"
          className="mt-4 gap-2 border-transparent bg-red-600 text-white hover:bg-red-700"
          disabled={deleteLoading}
          onClick={() => void handleDeleteAccount()}
        >
          {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t("settings.deleteAccount")}
        </Button>
      </section>
    </div>
  )
}
