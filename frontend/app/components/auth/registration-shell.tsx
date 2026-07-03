"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { LanguageSwitcher } from "@/app/components/language-switcher"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { Moon, Sun } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"

type RegistrationHeaderProps = {
  stepLabel?: string
  showSaveExit?: boolean
  onSaveExit?: () => void
}

export function RegistrationHeader({
  stepLabel,
  showSaveExit,
  onSaveExit,
}: RegistrationHeaderProps) {
  const { darkMode, toggleTheme } = useStoredTheme()
  const { t } = useTranslations()

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-slate-200/80 bg-[#F8FAFC]/95 px-4 py-3 backdrop-blur-sm dark:border-[var(--border)] dark:bg-[var(--bg)]/95 sm:px-6 lg:px-8">
      <TutoraLogo href="/" size="sm" />
      <div className="hidden min-w-0 flex-1 sm:block">
        {stepLabel ? (
          <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {stepLabel}
          </p>
        ) : null}
      </div>
      <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
          Already have an account? Log in
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
  )
}

type RegistrationProgressProps = {
  current: number
  total: number
  labels?: string[]
}

export function RegistrationProgress({
  current,
  total,
  labels,
}: RegistrationProgressProps) {
  const percent = Math.min(100, Math.round((current / total) * 100))

  return (
    <div className="space-y-3" aria-label={`Step ${current} of ${total}`}>
      <div className="flex items-end justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--text-primary)]">
          Step {current} of {total}
        </p>
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          {percent}%
        </p>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-800"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] transition-[width] duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {labels && labels.length > 0 ? (
        <p className="hidden text-xs text-[var(--text-muted)] lg:block">
          {labels[current - 1]}
        </p>
      ) : null}
    </div>
  )
}

type RegistrationShellProps = {
  children: ReactNode
  preview?: ReactNode
  header?: ReactNode
  progress?: ReactNode
  footer?: ReactNode
}

export function RegistrationShell({
  children,
  preview,
  header,
  progress,
  footer,
}: RegistrationShellProps) {
  return (
    <div className="min-h-dvh bg-[#F8FAFC] text-[var(--text-primary)] dark:bg-[var(--bg)]">
      {header}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:min-h-[calc(100dvh-57px)] lg:flex-row">
        <div className="flex w-full flex-col lg:max-w-[640px] lg:shrink-0 lg:border-r lg:border-slate-200/80 dark:lg:border-[var(--border)]">
          <div className="border-b border-slate-200/80 px-4 py-4 dark:border-[var(--border)] sm:px-6 lg:hidden">
            <Link
              href="/login"
              className="text-sm font-semibold text-[var(--primary-from)] hover:underline"
            >
              Already have an account? Log in
            </Link>
          </div>
          {progress ? (
            <div className="border-b border-slate-200/80 px-4 py-4 dark:border-[var(--border)] sm:px-6 lg:px-8">
              {progress}
            </div>
          ) : null}
          <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
            <div className="mx-auto w-full max-w-xl flex-1">{children}</div>
            {footer ? <div className="mx-auto mt-6 w-full max-w-xl">{footer}</div> : null}
          </div>
        </div>
        {preview ? (
          <aside className="hidden flex-1 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-8 dark:from-violet-950/20 dark:via-[var(--bg)] dark:to-indigo-950/20 lg:flex lg:items-center lg:justify-center lg:p-10 xl:p-12">
            <div className="w-full max-w-lg">{preview}</div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
