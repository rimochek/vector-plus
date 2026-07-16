"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, GraduationCap, ShieldCheck, UserRound } from "lucide-react"
import { AuthWizardLayout, WizardStepHeader, type WizardStepItem } from "@/app/components/auth-wizard-layout"
import { GoogleSignInButton, GoogleAuthDivider } from "@/app/components/auth/google-sign-in-button"
import { TelegramSignInButton } from "@/app/components/auth/telegram-sign-in-button"
import { getDefaultRouteForUser } from "@/lib/auth-client"
import { saveSignupRole, saveStudentStep, saveTutorStep } from "@/lib/onboarding/signup-session"
import { useToast } from "@/lib/toast-context"
import { useRouter } from "next/navigation"

type LoginRole = "STUDENT" | "TUTOR"

function rolePath(role: LoginRole) {
  return role === "TUTOR" ? "/signup/tutor" : "/signup/student"
}

export default function LoginPage() {
  const router = useRouter()
  const toast = useToast()
  const [role, setRole] = useState<LoginRole | null>(null)
  const [step, setStep] = useState<"role" | "provider">("role")

  const wizardSteps: WizardStepItem[] = [
    { id: "role", label: "Choose your role", status: step === "role" ? "current" : "complete" },
    { id: "provider", label: "Continue securely", status: step === "provider" ? "current" : "upcoming" },
    { id: "complete", label: "Open Tutora", status: "upcoming" },
  ]

  const chooseRole = (nextRole: LoginRole) => {
    setRole(nextRole)
    saveSignupRole(nextRole === "TUTOR" ? "tutor" : "student")
    setStep("provider")
  }

  const handleAuthenticated = (data: {
    existingAccount?: boolean
    user: Parameters<typeof getDefaultRouteForUser>[0]
  }) => {
    if (data.existingAccount) {
      router.push(getDefaultRouteForUser(data.user))
      return
    }

    if (role === "TUTOR") saveTutorStep("welcome")
    else saveStudentStep("welcome")
    router.push(rolePath(role ?? "STUDENT"))
  }

  return (
    <AuthWizardLayout
      mode="login"
      sidebarTitle="Welcome to Tutora"
      sidebarSubtitle="One account for lessons, schedules, conversations, and teaching."
      steps={wizardSteps}
      footer={
        <>
          New to Tutora?{" "}
          <Link href="/signup" className="font-bold text-[var(--primary-from)]">
            Create an account
          </Link>
        </>
      }
    >
      {step === "role" ? (
        <div className="space-y-5">
          <WizardStepHeader
            eyebrow="Step 1 of 2"
            title="How will you use Tutora?"
            subtitle="Choose a role first. If your account already exists, its saved role will stay unchanged."
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => chooseRole("STUDENT")}
              className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--primary-from)] hover:shadow-lg"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary-from)]">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="block font-bold text-[var(--text-primary)]">I want to learn</span>
              <span className="mt-1 block text-sm text-[var(--text-muted)]">Find tutors and book lessons.</span>
            </button>
            <button
              type="button"
              onClick={() => chooseRole("TUTOR")}
              className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 text-left transition hover:-translate-y-0.5 hover:border-[var(--primary-from)] hover:shadow-lg"
            >
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary-from)]">
                <UserRound className="h-5 w-5" />
              </span>
              <span className="block font-bold text-[var(--text-primary)]">I want to teach</span>
              <span className="mt-1 block text-sm text-[var(--text-muted)]">Build your tutor profile.</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setStep("role")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--primary-from)]"
          >
            <ArrowLeft className="h-4 w-4" /> Change role
          </button>
          <WizardStepHeader
            eyebrow="Step 2 of 2"
            title={`Continue as ${role === "TUTOR" ? "a tutor" : "a student"}`}
            subtitle="Choose Google or Telegram. New users will continue to registration automatically."
          />
          <GoogleSignInButton
            intendedRole={role ?? undefined}
            redirectAfterSuccess={false}
            onSuccess={handleAuthenticated}
            onError={(message) => toast.error(message)}
          />
          <GoogleAuthDivider />
          <TelegramSignInButton
            intendedRole={role ?? undefined}
            redirectAfterSuccess={false}
            onSuccess={handleAuthenticated}
            onError={(message) => toast.error(message)}
          />
          <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>No passwords. Authentication is protected by Google or Telegram.</p>
          </div>
        </div>
      )}
    </AuthWizardLayout>
  )
}
