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
import { TelegramSignInButton } from "@/app/components/auth/telegram-sign-in-button"
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
import {
  CountryCityPicker,
  isLocationComplete,
} from "@/app/components/onboarding/country-city-picker"
import { resolveLocationLabels } from "@/lib/tutor-locations"
import {
  formatStudentLookingFor,
  getStudentGoalOptions,
  resolveStudentTopicId,
  shouldSkipGoalStep,
  needsTargetScore,
} from "@/lib/onboarding/student-goal-options"
import { useTranslations } from "@/lib/i18n/locale-context"
import { hourlyAmountToBudgetCents } from "@/lib/hourly-budget"
import {
  signupMinimal,
  updateStudentProfile,
} from "@/lib/onboarding/onboarding-api"
import {
  BUDGET_PRESETS,
  STUDENT_PROGRESS_STAGES,
} from "@/lib/onboarding/registration-copy"
import {
  budgetFromPreset,
  splitFullName,
} from "@/lib/onboarding/registration-utils"
import {
  clearStudentDraft,
  clearStudentStep,
  loadStudentStep,
  saveSignupRole,
  saveStudentDraft,
  saveStudentStep,
  type StudentOnboardingDraft,
} from "@/lib/onboarding/signup-session"
import type { StepDirection } from "@/app/components/onboarding/animated-step"
import {
  studentAccountSchema,
  type StudentAccountValues,
} from "@/lib/validation/student-registration"
import { readReturnToParam } from "@/lib/guest-auth"
import { getDefaultRouteForUser } from "@/lib/auth-client"

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

function backTarget(step: StudentStep, draft: StudentOnboardingDraft): StudentStep | null {
  const map: Record<StudentStep, StudentStep | null> = {
    account: null,
    welcome: "account",
    subject: "welcome",
    goal: "subject",
    format: shouldSkipGoalStep(draft.topicId, draft.customTopic) ? "subject" : "goal",
    budget: "format",
    city: "budget",
    complete: "budget",
  }
  return map[step]
}

export function StudentSignupFlow() {
  const router = useRouter()
  const { t } = useTranslations()
  const [step, setStep] = useState<StudentStep>(() => {
    const saved = loadStudentStep()
    return saved && ["account", "welcome", "subject", "goal", "format", "budget", "city", "complete"].includes(saved)
      ? (saved as StudentStep)
      : "account"
  })
  const [direction, setDirection] = useState<StepDirection>("forward")
  const [draft, setDraft] = useState<StudentOnboardingDraft>({})
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

  const topicGroups = useMemo(
    () =>
      [
        {
          title: "Exams & tests",
          topics: [
            "ielts",
            "sat_act",
            "nuet",
            "unt",
            "nis",
            "nspm",
            "bil",
            "ap",
            "ib",
          ] as string[],
        },
        {
          title: "Languages",
          topics: [...LANGUAGE_IDS],
        },
        {
          title: "School subjects",
          topics: ["math", "programming"],
        },
      ] as const,
    [],
  )

  const resolvedTopic = resolveStudentTopicId(draft.topicId, draft.customTopic)
  const goalOptions = useMemo(
    () => getStudentGoalOptions(draft.topicId, draft.customTopic),
    [draft.topicId, draft.customTopic],
  )
  const selectedGoal = goalOptions.find((goal) => goal.id === draft.goalId)
  const showTargetScore = needsTargetScore(draft.topicId, draft.customTopic) &&
    selectedGoal?.asksForScore

  const nextAfterSubject = (): StudentStep => {
    if (shouldSkipGoalStep(draft.topicId, draft.customTopic)) return "format"
    return "goal"
  }

  const go = (next: StudentStep, dir: StepDirection = "forward") => {
    setDirection(dir)
    setStep(next)
    setSubmitError(null)
    saveStudentStep(next)
  }

  const scheduleAdvance = (next: StudentStep) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => go(next), 280)
  }

  const patchDraft = (patch: Partial<typeof draft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch }
      saveStudentDraft(next)
      return next
    })
  }

  const createAccount = accountForm.handleSubmit(async (values) => {
    setLoading(true)
    setSubmitError(null)
    try {
      const { firstName, lastName } = splitFullName(values.fullName)
      const result = await signupMinimal({
        email: values.email,
        password: values.password,
        firstName,
        lastName,
        role: "student",
      })
      if (result.existingAccount) {
        router.push(getDefaultRouteForUser(result.user))
        return
      }
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

      let city = draft.city
      if (draft.countryId && draft.cityId) {
        const labels = resolveLocationLabels(
          draft.countryId,
          draft.cityId,
          draft.customCity ?? "",
          draft.customCountry ?? "",
        )
        city = `${labels.city}, ${labels.country}`
      }

      await updateStudentProfile({
        ...(resolvedTopic ? { tags: [resolvedTopic] } : {}),
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
        ...(city ? { city } : {}),
        onboardingCompleted: true,
      })

      clearStudentDraft()
      clearStudentStep()
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
    resolvedTopic
      ? EXAM_IDS.includes(resolvedTopic as (typeof EXAM_IDS)[number]) ||
        LANGUAGE_IDS.includes(resolvedTopic as (typeof LANGUAGE_IDS)[number]) ||
        ["math", "programming"].includes(resolvedTopic)
        ? t(topicLabelId(resolvedTopic as LearningTopicId))
        : resolvedTopic
      : "Subject",
    draft.lookingFor ?? (shouldSkipGoalStep(draft.topicId, draft.customTopic) ? "—" : "Goal"),
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
          const target = backTarget(step, draft)
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
            onSuccess={(data) => {
              if (data.existingAccount) {
                router.push(getDefaultRouteForUser(data.user))
                return
              }
              go("welcome")
            }}
            onError={(message) => setSubmitError(message)}
          />
          <GoogleAuthDivider />
          <TelegramSignInButton
            intendedRole="STUDENT"
            redirectAfterSuccess={false}
            onSuccess={(data) => data.existingAccount ? router.push(getDefaultRouteForUser(data.user)) : go("welcome")}
            onError={(message) => setSubmitError(message)}
          />
          <form className="hidden" onSubmit={createAccount} aria-hidden="true">
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
            description="Choose a category or enter your own subject."
          />
          {topicGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {group.title}
              </p>
              <div className="space-y-2">
                {group.topics.map((topicId) => (
                  <OptionCard
                    key={topicId}
                    selected={draft.topicId === topicId && !draft.customTopic}
                    onClick={() => {
                      const already = draft.topicId === topicId && !draft.customTopic
                      patchDraft({ topicId, customTopic: undefined })
                      if (!already) scheduleAdvance(nextAfterSubject())
                    }}
                  >
                    {t(topicLabelId(topicId as LearningTopicId))}
                  </OptionCard>
                ))}
              </div>
            </div>
          ))}
          <FormField
            label="Or type your own"
            inputProps={{
              id: "student-custom-topic",
              value: draft.customTopic ?? "",
              placeholder: "e.g. Biology, Economics, Chess…",
              onChange: (event) =>
                patchDraft({
                  customTopic: event.target.value,
                  topicId: event.target.value.trim() ? undefined : draft.topicId,
                }),
            }}
          />
          <StepNavigation
            onBack={() => go("welcome", "back")}
            onContinue={() => (resolvedTopic ? go(nextAfterSubject()) : undefined)}
            continueDisabled={!resolvedTopic}
          />
        </div>
      ) : null}

      {step === "goal" ? (
        <div className="space-y-5">
          <StepHeader title="What are you working toward?" />
          <div className="space-y-2">
            {goalOptions.map((goal) => (
              <OptionCard
                key={goal.id}
                selected={draft.goalId === goal.id}
                onClick={() => {
                  const already = draft.goalId === goal.id
                  patchDraft({
                    goalId: goal.id,
                    lookingFor: formatStudentLookingFor(
                      goal.id,
                      goal.label,
                      draft.targetScore,
                    ),
                  })
                  if (!already && !goal.asksForScore) scheduleAdvance("format")
                }}
              >
                {goal.label}
              </OptionCard>
            ))}
          </div>
          {showTargetScore ? (
            <FormField
              label="Target score"
              inputProps={{
                id: "student-target-score",
                value: draft.targetScore ?? "",
                placeholder: "e.g. IELTS 7.0, SAT 1400, NUET 120",
                onChange: (event) => {
                  const targetScore = event.target.value
                  const goal = goalOptions.find((item) => item.id === draft.goalId)
                  patchDraft({
                    targetScore,
                    lookingFor: goal
                      ? formatStudentLookingFor(goal.id, goal.label, targetScore)
                      : draft.lookingFor,
                  })
                },
              }}
            />
          ) : null}
          <StepNavigation
            onBack={() => go("subject", "back")}
            onContinue={() => {
              if (!draft.goalId) return
              if (showTargetScore && !draft.targetScore?.trim()) return
              go("format")
            }}
            continueDisabled={
              !draft.goalId || (showTargetScore && !draft.targetScore?.trim())
            }
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
            onBack={() =>
              go(shouldSkipGoalStep(draft.topicId, draft.customTopic) ? "subject" : "goal", "back")
            }
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
            title="Where are you based?"
            description="We'll use this for in-person tutors nearby."
          />
          <CountryCityPicker
            countryId={draft.countryId ?? ""}
            cityId={draft.cityId ?? ""}
            customCountry={draft.customCountry ?? ""}
            customCity={draft.customCity ?? ""}
            onCountryChange={(countryId) => patchDraft({ countryId, cityId: undefined })}
            onCityChange={(cityId) => patchDraft({ cityId })}
            onCustomCountryChange={(customCountry) => patchDraft({ customCountry })}
            onCustomCityChange={(customCity) => patchDraft({ customCity })}
          />
          <StepNavigation
            onBack={() => go("budget", "back")}
            onContinue={() => {
              if (
                !isLocationComplete(
                  draft.countryId ?? "",
                  draft.cityId ?? "",
                  draft.customCountry ?? "",
                  draft.customCity ?? "",
                )
              ) {
                return
              }
              go("complete")
            }}
            continueDisabled={
              !isLocationComplete(
                draft.countryId ?? "",
                draft.cityId ?? "",
                draft.customCountry ?? "",
                draft.customCity ?? "",
              )
            }
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
