"use client"

import Link from "next/link"
import { useState } from "react"
import { GraduationCap, ShieldCheck, UserRound } from "lucide-react"
import { AuthWizardLayout, WizardStepHeader, type WizardStepItem } from "@/app/components/auth-wizard-layout"
import { GoogleSignInButton, GoogleAuthDivider } from "@/app/components/auth/google-sign-in-button"
import { TelegramSignInButton } from "@/app/components/auth/telegram-sign-in-button"
import { useToast } from "@/lib/toast-context"

const steps: WizardStepItem[] = [
  { id: "signin", label: "Безопасный вход", status: "current" },
  { id: "explore", label: "Найдите преподавателя", status: "upcoming" },
  { id: "learn", label: "Начните учиться", status: "upcoming" },
]

export default function LoginPage() {
  const toast = useToast()
  const [intendedRole, setIntendedRole] = useState<"STUDENT" | "TUTOR" | null>(null)
  return (
    <AuthWizardLayout
      mode="login"
      sidebarTitle="С возвращением в Tutora"
      sidebarSubtitle="Один аккаунт для занятий, расписания и общения."
      steps={steps}
      footer={<>Впервые здесь? <Link href="/signup" className="font-bold text-[var(--primary-from)]">Создать аккаунт</Link></>}
    >
      <div className="space-y-5">
        <WizardStepHeader
          eyebrow="Быстро и безопасно"
          title="Войдите в Tutora"
          subtitle="Пароли больше не нужны — используйте Google или Telegram."
        />
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">
            New to Tutora? Choose how you want to use it
          </legend>
          <p className="text-xs text-[var(--text-muted)]">
            Existing accounts can choose either option — your current role will not change.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={intendedRole === "STUDENT"}
              onClick={() => setIntendedRole("STUDENT")}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                intendedRole === "STUDENT"
                  ? "border-[var(--primary-from)] bg-[var(--primary-soft)] text-[var(--primary-from)] ring-2 ring-[var(--primary-from)]/15"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary-from)]/50"
              }`}
            >
              <GraduationCap className="h-4 w-4" /> Student
            </button>
            <button
              type="button"
              aria-pressed={intendedRole === "TUTOR"}
              onClick={() => setIntendedRole("TUTOR")}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                intendedRole === "TUTOR"
                  ? "border-[var(--primary-from)] bg-[var(--primary-soft)] text-[var(--primary-from)] ring-2 ring-[var(--primary-from)]/15"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary-from)]/50"
              }`}
            >
              <UserRound className="h-4 w-4" /> Tutor
            </button>
          </div>
        </fieldset>
        {!intendedRole && (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-center text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Choose Student or Tutor before continuing.
          </p>
        )}
        <div className={intendedRole ? "" : "pointer-events-none opacity-50"} aria-disabled={!intendedRole}>
          <GoogleSignInButton
            intendedRole={intendedRole ?? undefined}
            onError={(message) => toast.error(message)}
            redirectAfterSuccess
          />
        </div>
        <GoogleAuthDivider />
        <div className={intendedRole ? "" : "pointer-events-none opacity-50"} aria-disabled={!intendedRole}>
          <TelegramSignInButton
            intendedRole={intendedRole ?? undefined}
            onError={(message) => toast.error(message)}
            redirectAfterSuccess
          />
        </div>
        <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Мы не храним пароли. Доступ защищён вашим аккаунтом Google или Telegram.</p>
        </div>
      </div>
    </AuthWizardLayout>
  )
}
