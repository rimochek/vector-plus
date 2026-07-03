"use client"

import Link from "next/link"
import { useMemo, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  AuthWizardLayout,
  WizardFieldLabel,
  WizardInput,
  WizardStepHeader,
  type WizardStepItem,
} from "@/app/components/auth-wizard-layout"
import {
  GoogleAuthDivider,
  GoogleSignInButton,
} from "@/app/components/auth/google-sign-in-button"
import { ArrowRight, GraduationCap, Lock, Mail, UserRound } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { getApiUrl } from "@/lib/api"
import { getDefaultRouteForUser, saveAuthSession, AUTH_FETCH_INIT } from "@/lib/auth-client"
import { readReturnToParam } from "@/lib/guest-auth"
import { useToast } from "@/lib/toast-context"

type LoginRole = "student" | "tutor"

export default function LoginPage() {
  const { t } = useTranslations()
  const toast = useToast()
  const [role, setRole] = useState<LoginRole>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showEmailForm, setShowEmailForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("session") === "expired") {
      toast.warning(t("auth.sessionExpired"))
      window.history.replaceState({}, "", "/login")
    }
  }, [t, toast])

  const loginSteps = useMemo(
    (): WizardStepItem[] => [
      {
        id: "signin",
        label: t("auth.wizard.stepSignIn"),
        status: "current",
      },
      {
        id: "explore",
        label: t("auth.wizard.stepExplore"),
        status: "upcoming",
      },
      {
        id: "learn",
        label: t("auth.wizard.stepLearn"),
        status: "upcoming",
      },
    ],
    [t],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ;(async () => {
      try {
        const res = await fetch(`${getApiUrl()}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
          ...AUTH_FETCH_INIT,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const message = err.message as string | undefined
          if (message?.includes("not registered as a tutor")) {
            toast.error(t("auth.loginRoleMismatchTutor"))
            return
          }
          if (message?.includes("not registered as a student")) {
            toast.error(t("auth.loginRoleMismatchStudent"))
            return
          }
          toast.error(message || t("auth.signInTitle"))
          return
        }

        const data = await res.json()
        if (data.access_token && data.user) {
          saveAuthSession(data.access_token, data.user)
        }
        router.push(readReturnToParam() ?? getDefaultRouteForUser(data.user))
      } catch {
        toast.error(t("toast.networkError"))
      }
    })()
  }

  return (
    <AuthWizardLayout
      mode="login"
      sidebarTitle={t("auth.wizard.sidebarTitle")}
      sidebarSubtitle={t("auth.wizard.sidebarSubtitle")}
      steps={loginSteps}
      footer={
        <>
          {t("auth.noAccount")}{" "}
          <Link
            href="/signup"
            className="font-black text-[var(--primary-from)] hover:underline"
          >
            {t("auth.createOne")}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <WizardStepHeader
          eyebrow={t("auth.wizard.badge")}
          title={t("auth.welcomeBack")}
          subtitle="Continue with Google or use your email."
        />

        <GoogleSignInButton
          onError={(message) => toast.error(message)}
          redirectAfterSuccess
        />

        <GoogleAuthDivider />

        {!showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[var(--text-primary)] hover:bg-slate-50 dark:border-[var(--border)] dark:bg-[var(--surface)]"
          >
            Continue with email
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
          <label className="block">
            <WizardFieldLabel>{t("auth.email")}</WizardFieldLabel>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 dark:text-[var(--text-muted)]" />
              <WizardInput
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                className="pl-12"
              />
            </div>
          </label>

          <label className="block">
            <WizardFieldLabel>{t("auth.password")}</WizardFieldLabel>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 dark:text-[var(--text-muted)]" />
              <WizardInput
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                className="pl-12"
              />
            </div>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <label className="flex cursor-pointer items-center gap-2 font-bold text-slate-600 dark:text-[var(--text-muted)]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-[var(--primary-from)] focus:ring-[var(--primary-from)] dark:border-zinc-600"
            />
            {t("auth.rememberMe")}
          </label>
          <button
            type="button"
            className="font-bold text-[var(--primary-from)] hover:underline"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>

        <p className="mt-5 text-xs font-semibold text-[var(--text-muted)]">
          {role === "student" ? t("auth.loginAsStudent") : t("auth.loginAsTutor")}
        </p>

        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() =>
              setRole((current) => (current === "student" ? "tutor" : "student"))
            }
            aria-label={
              role === "student"
                ? t("auth.loginAsTutor")
                : t("auth.loginAsStudent")
            }
            title={
              role === "student"
                ? t("auth.loginAsTutor")
                : t("auth.loginAsStudent")
            }
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-xs font-black uppercase tracking-wider text-slate-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-[var(--primary-from)] dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-zinc-300 dark:hover:border-violet-800 dark:hover:bg-violet-950/40 dark:hover:text-violet-300"
          >
            {role === "student" ? (
              <>
                <GraduationCap className="h-4 w-4 shrink-0" />
                {t("auth.roleSwitchTutor")}
              </>
            ) : (
              <>
                <UserRound className="h-4 w-4 shrink-0" />
                {t("auth.roleSwitchStudent")}
              </>
            )}
          </button>
          <button
            type="submit"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[var(--primary-from)] to-[var(--primary-to)] px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-violet-300/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-400/30 dark:shadow-violet-950/40"
          >
            {t("auth.signIn")}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
          </form>
        )}

        <p className="text-xs text-[var(--text-muted)]">
          We only use your Google account to create and secure your Tutora account.
        </p>
      </div>
    </AuthWizardLayout>
  )
}
