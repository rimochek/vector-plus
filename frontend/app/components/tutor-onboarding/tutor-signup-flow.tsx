"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Upload } from "lucide-react"
import { PasswordField, SaveStatus, type SaveStatusState } from "@/app/components/auth/password-field"
import { StepNavigation } from "@/app/components/onboarding/animated-step"
import { CompactInterstitial } from "@/app/components/onboarding/compact-interstitial"
import { FormErrorBanner } from "@/app/components/onboarding/friendly-error"
import { FormField, TextAreaField } from "@/app/components/onboarding/form-field"
import { OptionCard } from "@/app/components/onboarding/option-card"
import { RegistrationFlowShell } from "@/app/components/onboarding/registration-flow-shell"
import { StepHeader } from "@/app/components/onboarding/step-header"
import {
  GoogleAuthDivider,
  GoogleSignInButton,
} from "@/app/components/auth/google-sign-in-button"
import { TelegramSignInButton } from "@/app/components/auth/telegram-sign-in-button"
import {
  TutorProfileBuildPreview,
} from "@/app/components/onboarding/product-mini-preview"
import {
  EXAM_IDS,
  LANGUAGE_IDS,
  topicLabelId,
  type LearningTopicId,
} from "@/app/components/tutors-data"
import { resolveLocationLabels, type CountryId, type CityId } from "@/lib/tutor-locations"
import {
  CountryCityPicker,
  isLocationComplete,
} from "@/app/components/onboarding/country-city-picker"
import { useTranslations } from "@/lib/i18n/locale-context"
import { formatTenge } from "@/lib/currency"
import {
  lessonFormatsFromChoice,
  normalizeLessonFormats,
} from "@/lib/tutor-lesson-formats"
import { api, type ApiTutor } from "@/lib/api-client"
import { getDefaultRouteForUser, isLoggedIn } from "@/lib/auth-client"
import {
  signupMinimal,
  submitTutorApplication,
  updateTutorProfile,
  uploadTutorAvatar,
} from "@/lib/onboarding/onboarding-api"
import {
  AVAILABILITY_BROAD,
  EXPERIENCE_OPTIONS,
  EXAM_TOPIC_IDS,
  TUTOR_PROGRESS_STAGES,
} from "@/lib/onboarding/registration-copy"
import { saveSignupRole, saveTutorStep, loadTutorStep } from "@/lib/onboarding/signup-session"
import type { StepDirection } from "@/app/components/onboarding/animated-step"
import {
  tutorAccountSchema,
  tutorReviewSchema,
  type TutorAccountValues,
  type TutorReviewValues,
} from "@/lib/validation/tutor-onboarding"

const TUTOR_STEPS = [
  "account",
  "welcome",
  "name",
  "location",
  "photo",
  "teaching-tip",
  "subject",
  "subject-detail",
  "experience",
  "education",
  "headline",
  "about",
  "price",
  "format",
  "availability",
  "review",
] as const

export type TutorStep = (typeof TUTOR_STEPS)[number]

export { TUTOR_STEPS }

function progressForStep(step: TutorStep): number {
  const map: Record<TutorStep, number> = {
    account: 1,
    welcome: 1,
    name: 2,
    location: 2,
    photo: 2,
    "teaching-tip": 3,
    subject: 3,
    "subject-detail": 3,
    experience: 3,
    education: 3,
    headline: 4,
    about: 4,
    price: 4,
    format: 4,
    availability: 4,
    review: 5,
  }
  return map[step]
}

function backMap(step: TutorStep): TutorStep | null {
  const order: TutorStep[] = [...TUTOR_STEPS]
  const idx = order.indexOf(step)
  if (idx <= 0) return null
  const prev = order[idx - 1]
  if (step === "subject-detail") return "subject"
  if (step === "education") return "experience"
  if (step === "about") return "headline"
  if (step === "format") return "price"
  if (step === "availability") return "format"
  if (step === "review") return "availability"
  return prev
}

type TutorDraft = {
  fullName: string
  countryId: CountryId | ""
  cityId: CityId | ""
  customCountry: string
  customCity: string
  city: string
  tags: string[]
  subjectDetail: string
  experienceOptionId: string
  experienceYears: number
  education: string
  headline: string
  bio: string
  hourlyRateAmount: number
  lessonFormats: ("online" | "offline")[]
  availability: string[]
}

const defaultDraft: TutorDraft = {
  fullName: "",
  countryId: "",
  cityId: "",
  customCountry: "",
  customCity: "",
  city: "",
  tags: [],
  subjectDetail: "",
  experienceOptionId: "",
  experienceYears: 0,
  education: "",
  headline: "",
  bio: "",
  hourlyRateAmount: 0,
  lessonFormats: [],
  availability: [],
}

type Props = {
  initialStep?: TutorStep
}

export function TutorSignupFlow({ initialStep = "account" }: Props) {
  const router = useRouter()
  const { t } = useTranslations()
  const [step, setStep] = useState<TutorStep>(() => {
    const saved = loadTutorStep()
    if (saved === "verification") return "review"
    if (saved && TUTOR_STEPS.includes(saved as TutorStep)) {
      return saved as TutorStep
    }
    return initialStep
  })
  const [direction, setDirection] = useState<StepDirection>("forward")
  const [draft, setDraft] = useState<TutorDraft>(defaultDraft)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatusState>("idle")
  const [profile, setProfile] = useState<ApiTutor | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const advanceTimer = useRef<number | null>(null)

  const accountForm = useForm<TutorAccountValues>({
    resolver: zodResolver(tutorAccountSchema),
    defaultValues: { email: "", password: "", acceptTerms: false },
  })

  const reviewForm = useForm<TutorReviewValues>({
    resolver: zodResolver(tutorReviewSchema),
    defaultValues: {
      confirmAccurate: false,
      acceptTerms: false,
      understandVerification: false,
    },
  })

  const topicOptions = useMemo(
    () => [...LANGUAGE_IDS, ...EXAM_IDS, "math", "programming"] as string[],
    [],
  )

  const primarySubject = draft.tags.find((tag) => EXAM_TOPIC_IDS.has(tag))
  const needsSubjectDetail = Boolean(primarySubject) && draft.tags.filter((tag) => EXAM_TOPIC_IDS.has(tag)).length === 1

  const toggleSubject = (topicId: string) => {
    setDraft((current) => ({
      ...current,
      tags: current.tags.includes(topicId)
        ? current.tags.filter((tag) => tag !== topicId)
        : [...current.tags, topicId],
    }))
  }

  const go = useCallback((next: TutorStep, dir: StepDirection = "forward") => {
    setDirection(dir)
    setStep(next)
    setError(null)
    saveTutorStep(next)
  }, [])

  const scheduleAdvance = (next: TutorStep) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    advanceTimer.current = window.setTimeout(() => go(next), 280)
  }

  const persistProfile = useCallback(
    async (payload: Parameters<typeof updateTutorProfile>[0]) => {
      setSaveStatus("saving")
      try {
        const updated = await updateTutorProfile(payload)
        setProfile(updated)
        setSaveStatus("saved")
        return updated
      } catch (persistError) {
        setSaveStatus("error")
        throw persistError
      }
    },
    [],
  )

  useEffect(() => {
    saveSignupRole("tutor")
    return () => {
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current)
    }
  }, [])

  useEffect(() => {
    if (step === "account" || !isLoggedIn()) return
    void api.tutors.ownProfile().then((data) => {
      setProfile(data)
      setPhotoPreview(data.avatarUrl)
      const parts = data.displayName.split(" ")
      setDraft((current) => ({
        ...current,
        fullName: data.displayName,
        city: data.city ?? current.city,
        tags: data.tags ?? current.tags,
        experienceYears: data.experienceYears ?? current.experienceYears,
        education: data.education ?? current.education,
        headline: data.headline ?? current.headline,
        bio: data.bio ?? current.bio,
        hourlyRateAmount: Math.round(data.defaultHourlyRateCents / 100) || current.hourlyRateAmount,
        lessonFormats: normalizeLessonFormats(data.lessonFormats ?? current.lessonFormats),
      }))
    }).catch(() => undefined)
  }, [step])

  const saveAvailability = async (slots: string[]) => {
    const schedule = slots.flatMap((slot) => {
      if (slot === "weekday_morning") {
        return [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          slots: [{ startTime: "09:00", endTime: "12:00" }],
        }))
      }
      if (slot === "weekday_afternoon") {
        return [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          slots: [{ startTime: "12:00", endTime: "17:00" }],
        }))
      }
      if (slot === "weekday_evening") {
        return [1, 2, 3, 4, 5].map((day) => ({
          dayOfWeek: day,
          slots: [{ startTime: "17:00", endTime: "21:00" }],
        }))
      }
      if (slot === "weekends") {
        return [0, 6].map((day) => ({
          dayOfWeek: day,
          slots: [{ startTime: "10:00", endTime: "18:00" }],
        }))
      }
      return []
    })

    const merged = new Map<number, { startTime: string; endTime: string }[]>()
    for (const entry of schedule) {
      const existing = merged.get(entry.dayOfWeek) ?? []
      merged.set(entry.dayOfWeek, [...existing, ...entry.slots])
    }

    await api.availability.saveWeeklySchedule({
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      schedule: [...merged.entries()].map(([dayOfWeek, slots]) => ({
        dayOfWeek,
        slots,
      })),
    })
  }

  const createAccount = accountForm.handleSubmit(async (values) => {
    setLoading(true)
    setError(null)
    try {
      const result = await signupMinimal({
        email: values.email,
        password: values.password,
        firstName: values.email.split("@")[0] || "User",
        lastName: "User",
        role: "tutor",
      })
      if (result.existingAccount) {
        router.push(getDefaultRouteForUser(result.user))
        return
      }
      go("welcome")
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  })

  const submitReview = reviewForm.handleSubmit(async () => {
    setLoading(true)
    setError(null)
    try {
      await submitTutorApplication()
      saveTutorStep("account")
      router.push("/signup/tutor/success")
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Submission failed")
    } finally {
      setLoading(false)
    }
  })

  const handlePhotoUpload = async (file: File) => {
    setUploadProgress(0)
    setError(null)
    try {
      const updated = await uploadTutorAvatar(file, setUploadProgress)
      setProfile(updated)
      setPhotoPreview(updated.avatarUrl)
      go("teaching-tip")
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed")
    } finally {
      setUploadProgress(null)
    }
  }

  const shellBack = step === "account" ? undefined : () => {
    const target = backMap(step)
    if (target) go(target, "back")
  }

  return (
    <RegistrationFlowShell
      stepKey={step}
      direction={direction}
      onBack={shellBack}
      progressCurrent={step === "account" ? undefined : progressForStep(step)}
      progressTotal={TUTOR_PROGRESS_STAGES.length}
      progressStageLabel={TUTOR_PROGRESS_STAGES[progressForStep(step) - 1]}
      previewKey={step}
      preview={<TutorProfileBuildPreview />}
      showSaveExit={step !== "account"}
      onSaveExit={() => router.push(getDefaultRouteForUser(null))}
      saveStatus={step !== "account" ? saveStatus : undefined}
    >
      {step === "account" ? (
        <div className="space-y-6">
          <StepHeader
            title="Let's create your tutor account"
            description="You'll be able to save your progress."
          />
          <FormErrorBanner message={error} />
          <GoogleSignInButton
            intendedRole="TUTOR"
            redirectAfterSuccess={false}
            onSuccess={(data) => {
              if (data.existingAccount) {
                router.push(getDefaultRouteForUser(data.user))
                return
              }
              go("welcome")
            }}
            onError={(message) => setError(message)}
          />
          <GoogleAuthDivider />
          <TelegramSignInButton
            intendedRole="TUTOR"
            redirectAfterSuccess={false}
            onSuccess={(data) => data.existingAccount ? router.push(getDefaultRouteForUser(data.user)) : go("welcome")}
            onError={(message) => setError(message)}
          />
          <form className="hidden" onSubmit={createAccount} aria-hidden="true">
            <FormField
              label="Email"
              inputProps={{
                ...accountForm.register("email"),
                id: "tutor-email",
                type: "email",
                autoComplete: "email",
              }}
              error={accountForm.formState.errors.email?.message}
            />
            <PasswordField
              id="tutor-password"
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
          title="Let's build your tutor profile"
          description="We'll guide you through a few simple steps."
          benefits={[
            "Show students what you teach",
            "Set your price and format",
            "Finish the rest in your dashboard",
          ]}
          primaryLabel="Build my profile"
          onPrimary={() => go("name")}
          onBack={() => go("account", "back")}
        />
      ) : null}

      {step === "name" ? (
        <div className="space-y-5">
          <StepHeader title="What should students call you?" />
          <FormField
            label="Full name"
            inputProps={{
              id: "tutor-name",
              value: draft.fullName,
              onChange: (e) => setDraft((d) => ({ ...d, fullName: e.target.value })),
            }}
          />
          <StepNavigation
            onBack={() => go("welcome", "back")}
            onContinue={async () => {
              if (!draft.fullName.trim()) {
                setError("Enter your name")
                return
              }
              setLoading(true)
              try {
                await persistProfile({ displayName: draft.fullName.trim() })
                go("location")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            continueLabel={loading ? "Saving…" : "Continue"}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "location" ? (
        <div className="space-y-5">
          <StepHeader
            title={t("register.step4.tutorLocationTitle")}
            description={t("register.step4.tutorLocationSubtitle")}
          />
          <CountryCityPicker
            countryId={draft.countryId}
            cityId={draft.cityId}
            customCountry={draft.customCountry}
            customCity={draft.customCity}
            onCountryChange={(countryId) =>
              setDraft((d) => ({ ...d, countryId, cityId: "", customCity: "" }))
            }
            onCityChange={(cityId) => setDraft((d) => ({ ...d, cityId }))}
            onCustomCountryChange={(customCountry) =>
              setDraft((d) => ({ ...d, customCountry }))
            }
            onCustomCityChange={(customCity) => setDraft((d) => ({ ...d, customCity }))}
          />
          <StepNavigation
            onBack={() => go("name", "back")}
            onContinue={async () => {
              if (
                !isLocationComplete(
                  draft.countryId,
                  draft.cityId,
                  draft.customCountry,
                  draft.customCity,
                )
              ) {
                return
              }
              const labels = resolveLocationLabels(
                draft.countryId as CountryId,
                draft.cityId,
                draft.customCity,
                draft.customCountry,
              )
              setLoading(true)
              try {
                await persistProfile({
                  country: labels.country,
                  city: labels.city,
                })
                setDraft((d) => ({ ...d, city: labels.city }))
                go("photo")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            loading={loading}
            continueLabel={loading ? "Saving…" : "Continue"}
            continueDisabled={
              !isLocationComplete(
                draft.countryId,
                draft.cityId,
                draft.customCountry,
                draft.customCity,
              )
            }
          />
        </div>
      ) : null}

      {step === "photo" ? (
        <div className="space-y-5">
          <StepHeader
            title="Add a friendly photo"
            description="A clear photo helps students feel more comfortable."
          />
          <FormErrorBanner message={error} />
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-[var(--border)]">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Profile preview"
                className="mx-auto mb-4 h-36 w-36 rounded-2xl object-cover"
              />
            ) : (
              <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center rounded-2xl bg-violet-50 text-[var(--primary-from)] dark:bg-violet-950/30">
                <Upload className="h-10 w-10" />
              </div>
            )}
            <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-[var(--radius-button)] bg-[var(--primary-from)] px-5 py-3 text-sm font-semibold text-white">
              {uploadProgress != null ? `Uploading… ${uploadProgress}%` : "Upload photo"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handlePhotoUpload(file)
                }}
              />
            </label>
            <ul className="mt-4 space-y-1 text-xs text-[var(--text-muted)]">
              <li>Face clearly visible</li>
              <li>Good lighting</li>
              <li>No text or contact details</li>
            </ul>
          </div>
          <StepNavigation
            onBack={() => go("location", "back")}
            onContinue={() => profile?.avatarUrl && go("teaching-tip")}
            continueDisabled={!profile?.avatarUrl}
          />
        </div>
      ) : null}

      {step === "teaching-tip" ? (
        <CompactInterstitial
          title="Students choose people, not just subjects"
          description="Your photo and introduction help students trust your profile."
          benefits={[
            "Show what you teach clearly",
            "Share your experience",
            "Set a price that fits you",
          ]}
          primaryLabel="Continue"
          onPrimary={() => go("subject")}
          onBack={() => go("photo", "back")}
        />
      ) : null}

      {step === "subject" ? (
        <div className="space-y-5">
          <StepHeader
            title="What do you teach?"
            description="Select all that apply."
          />
          <div className="space-y-2">
            {topicOptions.map((topicId) => (
              <OptionCard
                key={topicId}
                selected={draft.tags.includes(topicId)}
                onClick={() => toggleSubject(topicId)}
              >
                {t(topicLabelId(topicId as LearningTopicId))}
              </OptionCard>
            ))}
          </div>
          <FormErrorBanner message={error} />
          <StepNavigation
            onBack={() => go("teaching-tip", "back")}
            onContinue={async () => {
              if (draft.tags.length === 0) {
                setError("Choose at least one subject")
                return
              }
              setLoading(true)
              setError(null)
              try {
                await persistProfile({ tags: draft.tags })
                go(needsSubjectDetail ? "subject-detail" : "experience")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            continueDisabled={draft.tags.length === 0}
            continueLabel={loading ? "Saving…" : "Continue"}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "subject-detail" ? (
        <div className="space-y-5">
          <StepHeader
            title={
              primarySubject === "ielts"
                ? "What result have you achieved?"
                : "Which levels do you teach?"
            }
          />
          <FormField
            label="Your answer"
            inputProps={{
              id: "subject-detail",
              value: draft.subjectDetail,
              onChange: (e) =>
                setDraft((d) => ({ ...d, subjectDetail: e.target.value })),
              placeholder:
                primarySubject === "ielts" ? "e.g. IELTS 8.0" : "e.g. Grades 9–11",
            }}
          />
          <StepNavigation
            onBack={() => go("subject", "back")}
            onContinue={async () => {
              setLoading(true)
              try {
                const credentials = draft.subjectDetail.trim()
                  ? [{ label: primarySubject ?? "Subject", value: draft.subjectDetail.trim() }]
                  : []
                await persistProfile({
                  tags: draft.tags,
                  credentials,
                })
                go("experience")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "experience" ? (
        <div className="space-y-5">
          <StepHeader title="How long have you been teaching?" />
          <div className="space-y-2">
            {EXPERIENCE_OPTIONS.map((option) => (
              <OptionCard
                key={option.id}
                selected={draft.experienceOptionId === option.id}
                onClick={() => {
                  const already = draft.experienceOptionId === option.id
                  setDraft((d) => ({
                    ...d,
                    experienceOptionId: option.id,
                    experienceYears: option.years,
                  }))
                  if (!already) scheduleAdvance("education")
                }}
              >
                {option.label}
              </OptionCard>
            ))}
          </div>
          <StepNavigation
            onBack={() => go(needsSubjectDetail ? "subject-detail" : "subject", "back")}
            onContinue={() => draft.experienceOptionId && go("education")}
            continueDisabled={!draft.experienceOptionId}
          />
        </div>
      ) : null}

      {step === "education" ? (
        <div className="space-y-5">
          <StepHeader
            title="Where do you study or work?"
            description="A short answer is enough."
          />
          <FormField
            label="School, university, or role"
            inputProps={{
              id: "tutor-education",
              value: draft.education,
              onChange: (e) => setDraft((d) => ({ ...d, education: e.target.value })),
            }}
          />
          <StepNavigation
            onBack={() => go("experience", "back")}
            onContinue={async () => {
              setLoading(true)
              try {
                await persistProfile({
                  experienceYears: draft.experienceYears,
                  ...(draft.education.trim()
                    ? { education: draft.education.trim() }
                    : {}),
                })
                go("headline")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            secondaryAction={
              <button
                type="button"
                className="text-sm font-semibold text-[var(--text-secondary)] hover:underline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    await persistProfile({
                      experienceYears: draft.experienceYears,
                    })
                    go("headline")
                  } finally {
                    setLoading(false)
                  }
                }}
              >
                Skip for now
              </button>
            }
            loading={loading}
          />
        </div>
      ) : null}

      {step === "headline" ? (
        <div className="space-y-5">
          <StepHeader
            title="How would you introduce yourself?"
            description="Write one sentence students will see first."
          />
          <FormField
            label="Headline"
            hint={`${draft.headline.length}/120 · at least 10 characters`}
            inputProps={{
              id: "tutor-headline",
              value: draft.headline,
              onChange: (e) => setDraft((d) => ({ ...d, headline: e.target.value })),
              maxLength: 120,
            }}
          />
          <StepNavigation
            onBack={() => go("education", "back")}
            onContinue={() => {
              if (draft.headline.trim().length < 10) {
                setError("Write at least one short sentence")
                return
              }
              go("about")
            }}
          />
        </div>
      ) : null}

      {step === "about" ? (
        <div className="space-y-5">
          <StepHeader
            title="Tell students how you can help"
            description="A few friendly sentences are enough."
          />
          <TextAreaField
            label="About you"
            hint={`${draft.bio.length} characters · at least 50 for submission`}
            textareaProps={{
              id: "tutor-about",
              rows: 6,
              value: draft.bio,
              onChange: (e) => setDraft((d) => ({ ...d, bio: e.target.value })),
            }}
          />
          <StepNavigation
            onBack={() => go("headline", "back")}
            onContinue={async () => {
              if (draft.bio.trim().length < 50) {
                setError("A few more words will help students understand your style")
                return
              }
              setLoading(true)
              try {
                await persistProfile({
                  headline: draft.headline.trim(),
                  bio: draft.bio.trim(),
                })
                go("price")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "price" ? (
        <div className="space-y-5">
          <StepHeader title="What do you charge per hour?" />
          <FormField
            label="Hourly rate (₸)"
            inputProps={{
              id: "tutor-price",
              type: "number",
              min: 1000,
              step: 500,
              value: draft.hourlyRateAmount || "",
              placeholder: "6000",
              onChange: (e) =>
                setDraft((d) => ({
                  ...d,
                  hourlyRateAmount: Number(e.target.value) || 0,
                })),
            }}
          />
          <StepNavigation
            onBack={() => go("about", "back")}
            onContinue={async () => {
              if (draft.hourlyRateAmount < 1000) {
                setError("Enter your hourly rate")
                return
              }
              setLoading(true)
              try {
                await persistProfile({
                  defaultHourlyRateCents: draft.hourlyRateAmount * 100,
                })
                go("format")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "format" ? (
        <div className="space-y-5">
          <StepHeader title="How do you teach?" />
          <div className="space-y-2">
            {[
              ["online", "Online"],
              ["offline", "In person"],
              ["both", "Both"],
            ].map(([value, label]) => {
              const selected =
                value === "both"
                  ? draft.lessonFormats.length === 2
                  : draft.lessonFormats.includes(value as "online" | "offline") &&
                    draft.lessonFormats.length === 1
              return (
                <OptionCard
                  key={value}
                  selected={selected}
                  onClick={async () => {
                    const formats = lessonFormatsFromChoice(
                      value as "online" | "offline" | "both",
                    )
                    setDraft((d) => ({ ...d, lessonFormats: [...formats] }))
                    setLoading(true)
                    try {
                      await persistProfile({ lessonFormats: [...formats] })
                      scheduleAdvance("availability")
                    } catch {
                      setError("Could not save")
                    } finally {
                      setLoading(false)
                    }
                  }}
                >
                  {label}
                </OptionCard>
              )
            })}
          </div>
          <StepNavigation
            onBack={() => go("price", "back")}
            onContinue={async () => {
              if (draft.lessonFormats.length === 0) {
                setError("Choose at least one option")
                return
              }
              setLoading(true)
              try {
                await persistProfile({ lessonFormats: [...draft.lessonFormats] })
                go("availability")
              } catch {
                setError("Could not save")
              } finally {
                setLoading(false)
              }
            }}
            continueDisabled={draft.lessonFormats.length === 0}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "availability" ? (
        <div className="space-y-5">
          <StepHeader title="When are you usually available?" />
          <div className="grid gap-2 sm:grid-cols-2">
            {AVAILABILITY_BROAD.map((slot) => (
              <OptionCard
                key={slot.id}
                compact
                selected={draft.availability.includes(slot.id)}
                onClick={() => {
                  setDraft((d) => ({
                    ...d,
                    availability: d.availability.includes(slot.id)
                      ? d.availability.filter((item) => item !== slot.id)
                      : [...d.availability, slot.id],
                  }))
                }}
              >
                {slot.label}
              </OptionCard>
            ))}
          </div>
          <StepNavigation
            onBack={() => go("format", "back")}
            onContinue={async () => {
              if (draft.availability.length === 0) {
                setError("Choose at least one option")
                return
              }
              setLoading(true)
              try {
                await saveAvailability(draft.availability)
                go("review")
              } catch {
                setError("Could not save availability")
              } finally {
                setLoading(false)
              }
            }}
            loading={loading}
          />
        </div>
      ) : null}

      {step === "review" ? (
        <div className="space-y-5">
          <StepHeader
            title="Here's how students will see you"
            description="Check everything looks right before submitting."
          />
          <FormErrorBanner message={error} />
          <div className="rounded-2xl border border-slate-200 p-5 dark:border-[var(--border)]">
            <div className="flex items-start gap-4">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoPreview} alt="" className="h-16 w-16 rounded-2xl object-cover" />
              ) : null}
              <div>
                <p className="text-lg font-black">{draft.fullName || profile?.displayName}</p>
                {draft.tags.length > 0 ? (
                  <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">
                    {draft.tags
                      .map((tag) => t(topicLabelId(tag as LearningTopicId)))
                      .join(" · ")}
                  </p>
                ) : null}
                <p className="text-sm font-semibold text-[var(--primary-from)]">{draft.headline}</p>
                <p className="mt-2 line-clamp-4 text-sm text-[var(--text-secondary)]">{draft.bio}</p>
                <p className="mt-2 text-sm font-semibold">
                  {formatTenge(draft.hourlyRateAmount)}/hr
                </p>
              </div>
            </div>
          </div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" {...reviewForm.register("confirmAccurate")} />
            <span>My information is accurate.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" {...reviewForm.register("acceptTerms")} />
            <span>I accept the Terms and Privacy Policy.</span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" {...reviewForm.register("understandVerification")} />
            <span>I understand my profile may require review before publication.</span>
          </label>
          <StepNavigation
            onBack={() => go("availability", "back")}
            onContinue={() => void submitReview()}
            continueLabel={loading ? "Submitting…" : "Submit for review"}
            loading={loading}
            secondaryAction={
              <button
                type="button"
                className="text-sm font-semibold text-[var(--text-secondary)] hover:underline"
                onClick={() => router.push("/tutor-dashboard")}
              >
                Save and finish later
              </button>
            }
          />
        </div>
      ) : null}
    </RegistrationFlowShell>
  )
}
