"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PasswordField } from "@/app/components/auth/password-field"
import { StepNavigation } from "@/app/components/onboarding/animated-step"
import { CompactInterstitial } from "@/app/components/onboarding/compact-interstitial"
import { FormErrorBanner } from "@/app/components/onboarding/friendly-error"
import { FormField } from "@/app/components/onboarding/form-field"
import { OptionCard } from "@/app/components/onboarding/option-card"
import { RegistrationFlowShell } from "@/app/components/onboarding/registration-flow-shell"
import { StepHeader } from "@/app/components/onboarding/step-header"
import {
  GoogleAuthDivider,
  GoogleSignInButton,
} from "@/app/components/auth/google-sign-in-button"
import {
  ProgressCelebration,
  StudentSearchPreview,
} from "@/app/components/onboarding/product-mini-preview"
import {
  EXAM_IDS,
  LANGUAGE_IDS,
  topicLabelId,
  type LearningTopicId,
} from "@/app/components/tutors-data"
import { useTranslations } from "@/lib/i18n/locale-context"
import { hourlyAmountToBudgetCents } from "@/lib/hourly-budget"
import {
  signupMinimal,
  updateStudentProfile,
} from "@/lib/onboarding/onboarding-api"
import {
  BUDGET_PRESETS,
  STUDENT_GOALS,
  STUDENT_PROGRESS_STAGES,
} from "@/lib/onboarding/registration-copy"
import {
  budgetFromPreset,
  splitFullName,
} from "@/lib/onboarding/registration-utils"
import {
  clearStudentDraft,
  loadStudentDraft,
  saveSignupRole,
  saveStudentDraft,
} from "@/lib/onboarding/signup-session"
import type { StepDirection } from "@/app/components/onboarding/animated-step"
import {
  studentAccountSchema,
  type StudentAccountValues,
} from "@/lib/validation/student-registration"
import { readReturnToParam } from "@/lib/guest-auth"

type StudentStep =
  | "account"
  | "welcome"
  | "subject"
  | "goal"
  | "format"
  | "budget"
  | "city"
  | "complete"

function progressForStep(step: StudentStep): number {
  const map: Record<StudentStep, number> = {
    account: 1,
    welcome: 1,
    subject: 2,
    goal: 3,
    format: 4,
    budget: 4,
    city: 4,
    complete: 5,
  }
  return map[step]
}

function backTarget(step: StudentStep): StudentStep | null {
  const map: Record<StudentStep, StudentStep | null> = {
    account: null,
    welcome: "account",
    subject: "welcome",
    goal: "subject",
    format: "goal",
    budget: "format",
    city: "budget",
    complete: "budget",
  }
  return map[step]
}

export function StudentSignupFlow() {
  const router = useRouter()
  const { t } = useTranslations()
  const [step, setStep] = useState<StudentStep>("account")
  const [direction, setDirection] = useState<StepDirection>("forward")
  const [draft, setDraft] = useState(loadStudentDraft() ?? {})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const advanceTimer = useRef<number | null>(null)

  const accountForm = useForm<StudentAccountValues>({
    resolver: zodResolver(studentAccountSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  })

  useEffect(() => {
    saveSignupRole("student")
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  const topicOptions = useMemo(
    () =>
      [
        "math",
        "english",
        "ielts",
        "sat_act",
        "programming",
        ...LANGUAGE_IDS.filter((id) => !["english"].includes(id)),
        ...EXAM_IDS.filter((id) => !["ielts", "sat_act"].includes(id)),
      ] as string[],
    [],
  )

  const go = (next: StudentStep, dir: StepDirection = "forward") => {
    setDirection(dir)
    setStep(next)
    setSubmitError(null)
  }

  const scheduleAdvance = (next: StudentStep) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => go(next), 280)
  }

  const patchDraft = (patch: Partial<typeof draft>) => {
    const next = { ...draft, ...patch }
    setDraft(next)
    saveStudentDraft(next)
  }

  const createAccount = accountForm.handleSubmit(async (values) => {
    setLoading(true)
    setSubmitError(null)
    try {
      const { firstName, lastName } = splitFullName(values.fullName)
      await signupMinimal({
        email: values.email,
        password: values.password,
        firstName,
        lastName,
        role: "student",
      })
      go("welcome")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  })

  const finish = async () => {
    setLoading(true)
    setSubmitError(null)
    try {
      const budget = draft.budgetPresetId
        ? budgetFromPreset(draft.budgetPresetId)
        : { min: null, max: null }
      const budgetMinCents =
        budget.min != null ? hourlyAmountToBudgetCents(budget.min) : undefined
      const budgetMaxCents =
        budget.max != null ? hourlyAmountToBudgetCents(budget.max) : undefined

      await updateStudentProfile({
        ...(draft.topicId ? { tags: [draft.topicId] } : {}),
        ...(draft.lookingFor ? { lookingFor: draft.lookingFor } : {}),
        ...(draft.lessonFormat
          ? { preferredLessonFormat: draft.lessonFormat }
          : {}),
        ...(budgetMinCents !== undefined && budgetMaxCents !== undefined
          ? {
              budgetMinCents,
              budgetMaxCents,
              budgetCurrency: "KZT",
            }
          : {}),
        ...(draft.city ? { city: draft.city } : {}),
        onboardingCompleted: true,
      })

      clearStudentDraft()
      router.push(readReturnToParam() ?? "/tutors")
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Could not save")
    } finally {
      setLoading(false)
    }
  }

  const needsCity =
    draft.lessonFormat === "offline" || draft.lessonFormat === "either"

  const summaryItems = [
    draft.topicId
      ? t(topicLabelId(draft.topicId as LearningTopicId))
      : "Subject",
    draft.lookingFor ?? "Goal",
    draft.lessonFormat === "online"
      ? "Online"
      : draft.lessonFormat === "offline"
        ? "In person"
        : draft.lessonFormat === "either"
          ? "Either works"
          : "Flexible",
    draft.budgetPresetId
      ? BUDGET_PRESETS.find((p) => p.id === draft.budgetPresetId)?.label ??
        "Budget"
      : "Budget",
  ]

  const shellBack =
    step === "account"
      ? undefined
      : () => {
          const target = backTarget(step)
          if (!target) return
          if (step === "city") {
            go("budget", "back")
            return
          }
          go(target, "back")
        }

  return (
    <RegistrationFlowShell
      stepKey={step}
      direction={direction}
      onBack={shellBack}
      progressCurrent={progressForStep(step)}
      progressTotal={STUDENT_PROGRESS_STAGES.length}
      progressStageLabel={STUDENT_PROGRESS_STAGES[progressForStep(step) - 1]}
      previewKey={step}
      preview={<StudentSearchPreview />}
    >
      {step === "account" ? (
        <div className="space-y-6">
          <StepHeader
            title="Let's create your account"
            description="It only takes a moment."
          />
          <FormErrorBanner message={submitError} />
          <GoogleSignInButton
            intendedRole="STUDENT"
            redirectAfterSuccess={false}
            onSuccess={() => go("welcome")}
            onError={(message) => setSubmitError(message)}
          />
          <GoogleAuthDivider />
          <form className="space-y-4" onSubmit={createAccount}>
            <FormField
              label="Name"
              inputProps={{
                ...accountForm.register("fullName"),
                id: "student-name",
                autoComplete: "name",
              }}
              error={accountForm.formState.errors.fullName?.message}
            />
            <FormField
              label="Email"
              inputProps={{
                ...accountForm.register("email"),
                id: "student-email",
                type: "email",
                autoComplete: "email",
              }}
              error={accountForm.formState.errors.email?.message}
            />
            <PasswordField
              id="student-password"
              label="Password"
              value={accountForm.watch("password")}
              onChange={(value) =>
                accountForm.setValue("password", value, { shouldValidate: true })
              }
              error={accountForm.formState.errors.password?.message}
            />
            <label className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" className="mt-1" {...accountForm.register("acceptTerms")} />
              <span>I agree to the Terms and Privacy Policy.</span>
            </label>
            {accountForm.formState.errors.acceptTerms ? (
              <p className="text-sm text-red-600">
                {accountForm.formState.errors.acceptTerms.message}
              </p>
            ) : null}
            <StepNavigation
              onContinue={() => void createAccount()}
              continueLabel={loading ? "Creating your account…" : "Continue"}
              loading={loading}
            />
          </form>
        </div>
      ) : null}

      {step === "welcome" ? (
        <CompactInterstitial
          title="Nice to meet you"
          description="Answer a few quick questions and we'll help you find the right tutors."
          benefits={[
            "See tutors matched to your goal",
            "Compare price and availability",
            "Change your preferences anytime",
          ]}
          preview={<StudentSearchPreview />}
          primaryLabel="Let's go"
          secondaryLabel="Skip for now"
          onPrimary={() => go("subject")}
          onSecondary={() => void finish()}
          onBack={() => go("account", "back")}
        />
      ) : null}

      {step === "subject" ? (
        <div className="space-y-5">
          <StepHeader
            title="What do you want to learn?"
            description="Choose the option that fits you best."
          />
          <div className="space-y-2">
            {topicOptions.slice(0, 8).map((topicId) => (
              <OptionCard
                key={topicId}
                selected={draft.topicId === topicId}
                onClick={() => {
                  const already = draft.topicId === topicId
                  patchDraft({ topicId })
                  if (!already) scheduleAdvance("goal")
                }}
              >
                {t(topicLabelId(topicId as LearningTopicId))}
              </OptionCard>
            ))}
          </div>
          <StepNavigation
            onBack={() => go("welcome", "back")}
            onContinue={() => (draft.topicId ? go("goal") : undefined)}
            continueDisabled={!draft.topicId}
          />
        </div>
      ) : null}

      {step === "goal" ? (
        <div className="space-y-5">
          <StepHeader title="What are you working toward?" />
          <div className="space-y-2">
            {STUDENT_GOALS.map((goal) => (
              <OptionCard
                key={goal}
                selected={draft.lookingFor === goal}
                onClick={() => {
                  const already = draft.lookingFor === goal
                  patchDraft({ lookingFor: goal })
                  if (!already) scheduleAdvance("format")
                }}
              >
                {goal}
              </OptionCard>
            ))}
          </div>
          <StepNavigation
            onBack={() => go("subject", "back")}
            onContinue={() => (draft.lookingFor ? go("format") : undefined)}
            continueDisabled={!draft.lookingFor}
          />
        </div>
      ) : null}

      {step === "format" ? (
        <div className="space-y-5">
          <StepHeader
            title="How would you like to learn?"
            description="Pick what works best for you."
          />
          <div className="space-y-2">
            {[
              ["online", "Online"],
              ["offline", "In person"],
              ["either", "Either works"],
            ].map(([value, label]) => (
              <OptionCard
                key={value}
                selected={draft.lessonFormat === value}
                onClick={() => {
                  const already = draft.lessonFormat === value
                  patchDraft({
                    lessonFormat: value as typeof draft.lessonFormat,
                  })
                  if (!already) scheduleAdvance("budget")
                }}
              >
                {label}
              </OptionCard>
            ))}
          </div>
          <StepNavigation
            onBack={() => go("goal", "back")}
            onContinue={() => (draft.lessonFormat ? go("budget") : undefined)}
            continueDisabled={!draft.lessonFormat}
          />
        </div>
      ) : null}

      {step === "budget" ? (
        <div className="space-y-5">
          <StepHeader title="What budget feels comfortable?" />
          <div className="space-y-2">
            {BUDGET_PRESETS.map((preset) => (
              <OptionCard
                key={preset.id}
                selected={draft.budgetPresetId === preset.id}
                onClick={() => {
                  const already = draft.budgetPresetId === preset.id
                  patchDraft({ budgetPresetId: preset.id })
                  if (!already) {
                    const next =
                      draft.lessonFormat === "offline" ||
                      draft.lessonFormat === "either"
                        ? "city"
                        : "complete"
                    scheduleAdvance(next)
                  }
                }}
              >
                {preset.label}
              </OptionCard>
            ))}
          </div>
          <StepNavigation
            onBack={() => go("format", "back")}
            onContinue={() => {
              if (!draft.budgetPresetId) return
              go(needsCity ? "city" : "complete")
            }}
            continueDisabled={!draft.budgetPresetId}
          />
        </div>
      ) : null}

      {step === "city" ? (
        <div className="space-y-5">
          <StepHeader
            title="Which city are you in?"
            description="We'll use this for in-person tutors nearby."
          />
          <FormField
            label="City"
            inputProps={{
              id: "student-city",
              value: draft.city ?? "",
              onChange: (event) => patchDraft({ city: event.target.value }),
            }}
          />
          <StepNavigation
            onBack={() => go("budget", "back")}
            onContinue={() => go("complete")}
            continueDisabled={!draft.city?.trim()}
          />
        </div>
      ) : null}

      {step === "complete" ? (
        <div className="space-y-6">
          <StepHeader
            title="We found a good place to start"
            description="You can change these preferences anytime."
          />
          <ProgressCelebration
            items={summaryItems.map((label) => ({ label, done: true }))}
          />
          <FormErrorBanner message={submitError} />
          <StepNavigation
            onBack={() => go(needsCity ? "city" : "budget", "back")}
            onContinue={() => void finish()}
            continueLabel={loading ? "Saving…" : "Show me tutors"}
            loading={loading}
          />
        </div>
      ) : null}
    </RegistrationFlowShell>
  )
}
