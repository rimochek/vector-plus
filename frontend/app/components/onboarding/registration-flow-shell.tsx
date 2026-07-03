"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { LanguageSwitcher } from "@/app/components/language-switcher"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { SaveStatus, type SaveStatusState } from "@/app/components/auth/password-field"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { Moon, Sun } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { RegistrationProgress } from "@/app/components/onboarding/registration-progress"
import { ContextualPreview } from "@/app/components/onboarding/contextual-preview"
import { AnimatedStepContainer, type StepDirection } from "@/app/components/onboarding/animated-step"

type RegistrationFlowShellProps = {
  stepKey: string
  direction: StepDirection
  children: ReactNode
  previewKey?: string
  preview?: ReactNode
  onBack?: () => void
  progressCurrent?: number
  progressTotal?: number
  progressStageLabel?: string
  showSaveExit?: boolean
  onSaveExit?: () => void
  saveStatus?: SaveStatusState
  onRetrySave?: () => void
}

export function RegistrationFlowShell({
  stepKey,
  direction,
  children,
  previewKey,
  preview,
  onBack,
  progressCurrent,
  progressTotal,
  progressStageLabel,
  showSaveExit,
  onSaveExit,
  saveStatus,
  onRetrySave,
}: RegistrationFlowShellProps) {
  const { darkMode, toggleTheme } = useStoredTheme()
  const { t } = useTranslations()

  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-[var(--text-primary)] dark:bg-[var(--bg)]">
      <header className="flex shrink-0 items-center gap-2 border-b border-slate-200/80 bg-[#F8FAFC]/95 px-4 py-3 backdrop-blur-sm dark:border-[var(--border)] dark:bg-[var(--bg)]/95 sm:gap-3 sm:px-6 lg:px-8">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-[var(--text-secondary)] hover:bg-[var(--chip)]"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        ) : (
          <span className="min-w-10" />
        )}
        <TutoraLogo href="/" size="sm" />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {saveStatus ? (
            <SaveStatus status={saveStatus} onRetry={onRetrySave} />
          ) : null}
          {showSaveExit ? (
            <button
              type="button"
              onClick={onSaveExit}
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)] sm:inline-flex"
            >
              Save and exit
            </button>
          ) : null}
          <Link
            href="/login"
            className="hidden text-sm font-semibold text-[var(--primary-from)] hover:underline sm:inline"
          >
            Log in
          </Link>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-zinc-300"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:min-h-[calc(100dvh-57px)] lg:flex-row">
        <div className="flex w-full flex-col lg:max-w-[640px] lg:shrink-0 lg:border-r lg:border-slate-200/80 dark:lg:border-[var(--border)]">
          {progressCurrent && progressTotal ? (
            <div className="border-b border-slate-200/80 px-4 py-4 dark:border-[var(--border)] sm:px-6 lg:px-8">
              <RegistrationProgress
                current={progressCurrent}
                total={progressTotal}
                stageLabel={progressStageLabel}
              />
            </div>
          ) : null}

          <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <div className="mx-auto w-full max-w-xl rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_16px_48px_rgba(15,23,42,0.06)] transition-[min-height] duration-200 dark:border-[var(--border)] dark:bg-[var(--surface)] sm:p-7">
              <AnimatedStepContainer stepKey={stepKey} direction={direction}>
                {children}
              </AnimatedStepContainer>
            </div>

            <p className="mx-auto mt-4 w-full max-w-xl text-center text-sm text-[var(--text-muted)] lg:hidden">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-[var(--primary-from)] hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {preview ? (
          <aside className="hidden flex-1 items-center justify-center bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 dark:from-violet-950/20 dark:via-[var(--bg)] dark:to-indigo-950/20 lg:flex lg:p-10 xl:p-12">
            <div className="w-full max-w-lg">
              <ContextualPreview visualKey={previewKey ?? stepKey}>
                {preview}
              </ContextualPreview>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}

// Legacy shell for role selection page only
