"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import {
  Moon,
  Sun,
  Navigation as NavIcon,
  Sparkles,
} from "lucide-react"
import { LanguageSwitcher } from "@/app/components/language-switcher"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { useTranslations } from "@/lib/i18n/locale-context"

export type WizardStepStatus = "complete" | "current" | "upcoming"

export type WizardStepItem = {
  id: string
  label: string
  status: WizardStepStatus
}

type AuthWizardLayoutProps = {
  mode: "register" | "login"
  sidebarTitle: string
  sidebarSubtitle: string
  steps?: WizardStepItem[]
  currentStep?: number
  totalSteps?: number
  progress?: number
  footer?: ReactNode
  children: ReactNode
  nav?: ReactNode
}

function StepIndicator({
  steps,
  currentStep,
  totalSteps,
  progress = 0,
}: {
  steps?: WizardStepItem[]
  currentStep?: number
  totalSteps?: number
  progress?: number
}) {
  if (steps && steps.length > 0) {
    return (
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all ${
                step.status === "complete"
                  ? "bg-white text-[#8B5CF6] shadow-lg shadow-black/10"
                  : step.status === "current"
                    ? "bg-white/20 text-white ring-2 ring-white/40 backdrop-blur-sm"
                    : "bg-white/10 text-white/50"
              }`}
            >
              {step.status === "complete" ? "✓" : index + 1}
            </div>
            <div className="min-w-0">
              <p
                className={`truncate text-sm font-black ${
                  step.status === "upcoming" ? "text-white/45" : "text-white"
                }`}
              >
                {step.label}
              </p>
              {step.status === "current" && (
                <p className="text-xs font-semibold text-violet-200/80">
                  {index + 1} / {steps.length}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between text-sm font-black text-white/80">
        <span>
          {currentStep} / {totalSteps}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-white transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function AuthWizardLayout({
  mode,
  sidebarTitle,
  sidebarSubtitle,
  steps,
  currentStep,
  totalSteps,
  progress,
  footer,
  children,
  nav,
}: AuthWizardLayoutProps) {
  const { darkMode, toggleTheme } = useStoredTheme()
  const { t } = useTranslations()

  return (
    <div className="auth-wizard-root h-dvh max-h-dvh overflow-hidden bg-[#F8FAFC] text-[#1E293B] dark:bg-zinc-950 dark:text-zinc-100">
      <div className="grid h-full lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
        <aside className="relative hidden h-full overflow-hidden bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6366F1] lg:flex lg:flex-col">
          <div className="pointer-events-none absolute inset-0 opacity-30">
            <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-indigo-300/20 blur-3xl" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.12) 1px, transparent 0)",
                backgroundSize: "28px 28px",
              }}
            />
          </div>

          <div className="relative flex h-full flex-col overflow-hidden p-8 xl:p-10">
            <Link href="/" className="mb-5 inline-flex shrink-0 items-center gap-3 group">
              <div className="rounded-2xl bg-white/15 p-2.5 ring-1 ring-white/20 backdrop-blur-sm transition-transform group-hover:rotate-6">
                <NavIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-black tracking-tight text-white xl:text-2xl">
                Vector<span className="text-violet-200">+</span>
              </span>
            </Link>

            <div className="mb-4 inline-flex w-fit shrink-0 items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-violet-100 backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {mode === "register"
                ? t("register.wizard.badge")
                : t("auth.wizard.badge")}
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
              <div className="shrink-0">
                <h1 className="mb-2 text-3xl font-black leading-[1.05] tracking-tight text-white xl:text-4xl">
                  {sidebarTitle}
                </h1>
                <p className="mb-5 max-w-sm text-sm font-semibold leading-snug text-violet-100/90 xl:text-base">
                  {sidebarSubtitle}
                </p>

                <div className="space-y-2.5 rounded-[1.5rem] border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-xs font-black uppercase tracking-widest text-violet-200/80">
                    {t("auth.wizard.featureLabel")}
                  </p>
                  <ul className="space-y-2 text-sm font-semibold text-white/90">
                    <li className="flex items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                      {t("auth.wizard.feature1")}
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                      {t("auth.wizard.feature2")}
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300" />
                      {t("auth.wizard.feature3")}
                    </li>
                  </ul>
                </div>
              </div>

              {(steps?.length || (currentStep && totalSteps)) && (
                <div className="mt-auto shrink-0 pt-8">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-violet-200/80">
                    {mode === "register"
                      ? t("register.wizard.stepsLabel")
                      : t("auth.wizard.stepsLabel")}
                  </p>
                  <StepIndicator
                    steps={steps}
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    progress={progress}
                  />
                </div>
              )}
            </div>
          </div>
        </aside>

        <div className="relative flex h-full min-h-0 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 overflow-hidden dark:hidden">
            <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-violet-100/50 blur-[100px]" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-indigo-100/40 blur-[90px]" />
          </div>

          <header className="relative z-10 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200/70 bg-white/70 px-5 py-3 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/70 sm:px-8">
            <Link href="/" className="flex items-center gap-2.5 lg:hidden">
              <div className="rounded-xl bg-[#8B5CF6] p-2 shadow-md shadow-violet-300/30">
                <NavIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black">
                Vector<span className="text-[#8B5CF6]">+</span>
              </span>
            </Link>

            {mode === "register" && currentStep && totalSteps && (
              <div className="flex flex-1 items-center justify-center gap-2 lg:hidden">
                {Array.from({ length: totalSteps }).map((_, i) => {
                  const stepNum = i + 1
                  const active = stepNum === currentStep
                  const done = stepNum < currentStep
                  return (
                    <div
                      key={stepNum}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        active
                          ? "w-8 bg-[#8B5CF6]"
                          : done
                            ? "w-2 bg-violet-300 dark:bg-violet-700"
                            : "w-2 bg-slate-200 dark:bg-zinc-700"
                      }`}
                    />
                  )
                })}
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <LanguageSwitcher />
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  darkMode ? t("theme.lightAria") : t("theme.darkAria")
                }
                className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                {darkMode ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </header>

          <main className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overscroll-contain px-5 py-6 sm:px-8 lg:px-10 lg:py-8 xl:px-12">
            <div className="mx-auto my-auto w-full max-w-2xl">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none sm:rounded-[2rem] sm:p-6 lg:p-7">
                <div className="max-h-[min(720px,calc(100dvh-12rem))] overflow-y-auto overscroll-contain">
                  {children}
                </div>
                {nav && <div className="mt-5 border-t border-slate-100 pt-4 dark:border-zinc-800">{nav}</div>}
              </div>

              {footer && (
                <div className="mt-3 py-1 text-center text-sm font-semibold text-slate-500 dark:text-zinc-400">
                  {footer}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export function WizardStepHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-4">
      {eyebrow && (
        <span className="mb-2 inline-flex rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#8B5CF6] dark:border-violet-900/50 dark:bg-violet-950/40">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-black tracking-tight text-[#1E293B] dark:text-zinc-50 sm:text-[1.75rem] xl:text-3xl">
        {title}
      </h2>
      <p className="mt-1.5 max-w-xl text-sm font-semibold leading-snug text-slate-500 dark:text-zinc-400">
        {subtitle}
      </p>
    </div>
  )
}

export function WizardNav({
  onBack,
  onNext,
  backLabel,
  nextLabel,
  canNext,
  showBack = true,
}: {
  onBack: () => void
  onNext: () => void
  backLabel: string
  nextLabel: string
  canNext: boolean
  showBack?: boolean
}) {
  return (
    <div className="flex gap-3 sm:gap-4">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-black uppercase tracking-widest text-slate-600 transition hover:bg-slate-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 lg:px-6 lg:py-3"
        >
          {backLabel}
        </button>
      ) : (
        <div className="hidden sm:block sm:w-[100px]" />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-5 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-violet-300/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-400/30 disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none dark:shadow-violet-950/40 lg:px-6 lg:py-3"
      >
        {nextLabel}
      </button>
    </div>
  )
}

export function WizardFieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
      {children}
    </span>
  )
}

export function WizardInput({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base font-medium text-[#1E293B] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-500 dark:focus:bg-zinc-950 dark:focus:ring-violet-950/40 ${className}`}
    />
  )
}

export function WizardSelect({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base font-medium text-[#1E293B] outline-none transition focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:focus:border-violet-500 dark:focus:bg-zinc-950 dark:focus:ring-violet-950/40 ${className}`}
    >
      {children}
    </select>
  )
}

export function WizardTextarea({
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-base font-medium text-[#1E293B] outline-none transition placeholder:text-slate-400 focus:border-[#8B5CF6] focus:bg-white focus:ring-4 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:border-violet-500 dark:focus:bg-zinc-950 dark:focus:ring-violet-950/40 ${className}`}
    />
  )
}

export function WizardChoice({
  selected,
  onClick,
  children,
  className = "",
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative w-full overflow-hidden rounded-2xl border px-4 py-4 text-left text-lg font-bold transition-all sm:px-5 sm:py-4 sm:text-xl lg:py-3.5 lg:text-lg xl:py-4 xl:text-xl ${
        selected
          ? "border-[#8B5CF6] bg-violet-50 text-[#7C3AED] dark:border-violet-500 dark:bg-violet-950/30 dark:text-violet-200"
          : "border-slate-200 bg-white text-slate-700 hover:border-violet-200 hover:bg-violet-50/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-violet-800 dark:hover:bg-violet-950/20"
      } ${className}`}
    >
      {selected && (
        <span className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-[#8B5CF6] text-xs text-white">
          ✓
        </span>
      )}
      {children}
    </button>
  )
}

export function WizardRoleCard({
  selected,
  onClick,
  icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-start gap-4 overflow-hidden rounded-[1.5rem] border-2 p-5 text-left transition-all lg:p-5 xl:p-6 ${
        selected
          ? "border-[#8B5CF6] bg-violet-50 dark:border-violet-500 dark:bg-violet-950/30"
          : "border-slate-200 bg-white hover:border-violet-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-violet-800"
      }`}
    >
      <div
        className={`rounded-[1.1rem] p-3 transition-transform group-hover:scale-105 lg:p-3.5 ${
          selected
            ? "bg-[#8B5CF6] text-white"
            : "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 pr-8">
        <span className="block text-lg font-black sm:text-xl lg:text-xl">{title}</span>
        <span className="mt-1.5 block text-sm font-semibold leading-snug text-slate-500 dark:text-zinc-400 lg:text-sm">
          {description}
        </span>
      </div>
      {selected && (
        <span className="absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-[#8B5CF6] text-sm text-white">
          ✓
        </span>
      )}
    </button>
  )
}

export function WizardTag({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-black transition-all ${
        selected
          ? "bg-[#8B5CF6] text-white shadow-md shadow-violet-300/30 dark:shadow-violet-950/40"
          : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-[#8B5CF6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-800"
      }`}
    >
      {children}
    </button>
  )
}

