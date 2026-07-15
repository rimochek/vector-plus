"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock, Trash2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, ApiError } from "@/lib/api-client"
import { logout } from "@/lib/auth-client"
import { Button } from "@/app/components/ui/button"
import { useToast } from "@/lib/toast-context"

export function AccountSettingsPanel() {
  const { t } = useTranslations()
  const router = useRouter()
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordError(null)

    if (newPassword.length < 8) {
      setPasswordError(t("settings.passwordTooShort"))
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("settings.passwordMismatch"))
      return
    }

    setPasswordLoading(true)
    try {
      await api.auth.changePassword(currentPassword, newPassword)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success(t("settings.passwordUpdated"))
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : t("settings.passwordUpdateFailed")
      setPasswordError(message)
    } finally {
      setPasswordLoading(false)
    }
  }

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
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {t("settings.changePassword")}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {t("settings.changePasswordHint")}
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => void handleChangePassword(e)}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {t("settings.currentPassword")}
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {t("settings.newPassword")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[var(--text-secondary)]">
              {t("settings.confirmPassword")}
            </span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)]"
            />
          </label>

          {passwordError ? (
            <p className="text-sm text-[var(--danger)]">{passwordError}</p>
          ) : null}

          <Button type="submit" disabled={passwordLoading} className="gap-2">
            {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("settings.savePassword")}
          </Button>
        </form>
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
