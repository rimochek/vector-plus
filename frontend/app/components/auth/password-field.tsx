"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { PASSWORD_REQUIREMENTS } from "@/lib/validation/password"

type PasswordFieldProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  autoComplete?: string
  showStrength?: boolean
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete = "new-password",
  showStrength = true,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={showStrength ? `${id}-requirements` : undefined}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm outline-none ring-[var(--primary-from)] focus:ring-2 dark:border-[var(--border)] dark:bg-[var(--surface)]"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--chip)]"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {showStrength ? (
        <ul id={`${id}-requirements`} className="space-y-1">
          {PASSWORD_REQUIREMENTS.map((requirement) => {
            const met = requirement.test(value)
            return (
              <li
                key={requirement.id}
                className={`text-xs ${met ? "text-emerald-600" : "text-[var(--text-muted)]"}`}
              >
                {met ? "✓" : "○"} {requirement.label}
              </li>
            )
          })}
        </ul>
      ) : null}
      {error ? (
        <p className="text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function FormErrorSummary({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
      role="alert"
    >
      {message}
    </div>
  )
}

export type SaveStatusState = "idle" | "saving" | "saved" | "error"

export function SaveStatus({
  status,
  onRetry,
}: {
  status: SaveStatusState
  onRetry?: () => void
}) {
  if (status === "idle") return null

  return (
    <div className="text-xs font-semibold">
      {status === "saving" ? (
        <span className="text-[var(--text-muted)]">Saving…</span>
      ) : null}
      {status === "saved" ? (
        <span className="text-emerald-600">Saved</span>
      ) : null}
      {status === "error" ? (
        <span className="text-red-600">
          Could not save.{" "}
          {onRetry ? (
            <button type="button" onClick={onRetry} className="underline">
              Retry
            </button>
          ) : null}
        </span>
      ) : null}
    </div>
  )
}
