"use client"

import Link from "next/link"
import { Suspense, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { BudgetRangeSlider } from "@/app/components/budget-range-slider"
import {
  AuthWizardLayout,
  WizardFieldLabel,
  WizardInput,
  WizardSelect,
  WizardNav,
  WizardRoleCard,
  WizardStepHeader,
  WizardTag,
  WizardTextarea,
  type WizardStepItem,
} from "@/app/components/auth-wizard-layout"
import { Check, GraduationCap, UserRound, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { getApiUrl } from "@/lib/api"
import { DEFAULT_AUTH_ROUTE, getDefaultRouteForUser, saveAuthSession, AUTH_FETCH_INIT } from "@/lib/auth-client"
import { useToast } from "@/lib/toast-context"
import { formatTenge } from "@/lib/currency"
import {
  CITY_OTHER_ID,
  getCountryLocation,
  resolveLocationLabels,
  TUTOR_LOCATION_COUNTRIES,
  type CountryId,
  type CityId,
} from "@/lib/tutor-locations"

type Role = "student" | "tutor"
type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7
const BUDGET_PRESET = {
  min: 1000,
  max: 15000,
  step: 500,
  defaultMin: 3500,
  defaultMax: 10000,
} as const
const TUTOR_RATE_PRESET = {
  min: 1000,
  max: 15000,
  step: 500,
  default: 5000,
} as const
const EXPERIENCE_PRESET = {
  min: 0,
  max: 40,
  step: 1,
  default: 3,
} as const
const DESCRIPTION_MIN_LENGTH = 200

const TAG_IDS = [
  "sat_act",
  "ielts",
  "nuet",
  "unt",
  "school_prep",
  "math",
  "english",
  "ap_ib",
] as const

type TagId = (typeof TAG_IDS)[number]

const PRESET_TAG_SET = new Set<string>(TAG_IDS)

const AGE_STUDENT_IDS = ["any", "1825", "2635", "3645", "46plus"] as const
const AGE_TUTOR_IDS = [
  "any",
  "preschool",
  "elementary",
  "middle_school",
  "high_school",
  "undergrad",
  "grad",
  "adults",
  "professionals",
] as const

function parseRoleFromQuery(value: string | null): Role | null {
  if (value === "student" || value === "tutor") return value
  return null
}

function RegisterWizard() {
  const { t } = useTranslations()
  const toast = useToast()
  const searchParams = useSearchParams()
  const roleFromQuery = parseRoleFromQuery(searchParams.get("role"))
  const startAtStep2 =
    roleFromQuery !== null && searchParams.get("step") === "2"

  const [phase, setPhase] = useState<Phase>(startAtStep2 ? 2 : 1)
  const [role, setRole] = useState<Role | null>(roleFromQuery)
  const [about, setAbout] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [description, setDescription] = useState("")
  const [education, setEducation] = useState("")
  const [experienceYears, setExperienceYears] = useState<number>(
    EXPERIENCE_PRESET.default,
  )
  const [countryId, setCountryId] = useState<CountryId | null>(null)
  const [cityId, setCityId] = useState<CityId | null>(null)
  const [customCity, setCustomCity] = useState("")
  const [customCountry, setCustomCountry] = useState("")
  const [hourlyRateAmount, setHourlyRateAmount] = useState<number>(
    TUTOR_RATE_PRESET.default,
  )
  const [ageChoices, setAgeChoices] = useState<string[]>([])
  const [budgetMinAmount, setBudgetMinAmount] = useState<number>(
    BUDGET_PRESET.defaultMin,
  )
  const [budgetMaxAmount, setBudgetMaxAmount] = useState<number>(
    BUDGET_PRESET.defaultMax,
  )
  const [done, setDone] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  const tagLabel = (id: TagId) => t(`register.tag.${id}` as MessageId)

  const ageStudentLabel = (id: (typeof AGE_STUDENT_IDS)[number]) =>
    t(`register.ageStudent.${id}` as MessageId)

  const ageTutorLabel = (id: (typeof AGE_TUTOR_IDS)[number]) =>
    t(`register.ageTutor.${id}` as MessageId)

  const locationCountryLabel = (id: CountryId) =>
    t(`register.location.country.${id}` as MessageId)

  const locationCityLabel = (id: CityId) =>
    t(`register.location.city.${id}` as MessageId)

  const selectedCountry = getCountryLocation(countryId)
  const availableCities = selectedCountry?.cities ?? []
  const showCustomCity = cityId === CITY_OTHER_ID
  const descriptionLength = description.trim().length

  const selectRole = (r: Role) => {
    setRole(r)
    setDescription("")
    setEducation("")
    setExperienceYears(EXPERIENCE_PRESET.default)
    setCountryId(null)
    setCityId(null)
    setCustomCity("")
    setCustomCountry("")
    setHourlyRateAmount(TUTOR_RATE_PRESET.default)
    setAgeChoices([])
    setBudgetMinAmount(BUDGET_PRESET.defaultMin)
    setBudgetMaxAmount(BUDGET_PRESET.defaultMax)
  }

  const accountPhase: Phase = role === "tutor" ? 7 : 6

  const isStudentBudgetValid = (): boolean => budgetMaxAmount > budgetMinAmount

  const isTutorProfileValid = (): boolean =>
    description.trim().length >= DESCRIPTION_MIN_LENGTH &&
    education.trim().length >= 2 &&
    experienceYears >= EXPERIENCE_PRESET.min &&
    experienceYears <= EXPERIENCE_PRESET.max

  const isTutorLocationValid = (): boolean => {
    if (!countryId || !cityId) return false
    if (countryId === "other" && customCountry.trim().length < 2) return false
    if (cityId === CITY_OTHER_ID) return customCity.trim().length >= 2
    return true
  }

  const selectCountry = (id: CountryId) => {
    setCountryId(id)
    setCityId(null)
    setCustomCity("")
    setCustomCountry("")
    const loc = getCountryLocation(id)
    if (loc?.cities.length === 1 && loc.cities[0] === CITY_OTHER_ID) {
      setCityId(CITY_OTHER_ID)
    }
  }

  const { displayStep, displayTotal } = useMemo(() => {
    if (!role) return { displayStep: 1, displayTotal: 5 }
    if (role === "student") {
      const map: Partial<Record<Phase, number>> = {
        1: 1,
        2: 2,
        4: 3,
        5: 4,
        6: 5,
      }
      return { displayStep: map[phase] ?? 1, displayTotal: 5 }
    }
    const map: Partial<Record<Phase, number>> = {
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
    }
    return { displayStep: map[phase] ?? 1, displayTotal: 7 }
  }, [phase, role])

  const progress = useMemo(() => {
    if (!role) return (phase / 6) * 100
    if (role === "student") {
      const map: Partial<Record<Phase, number>> = {
        1: 20,
        2: 40,
        4: 60,
        5: 80,
        6: 100,
      }
      return map[phase] ?? 0
    }
    const map: Partial<Record<Phase, number>> = {
      1: 14,
      2: 29,
      3: 43,
      4: 57,
      5: 71,
      6: 86,
      7: 100,
    }
    return map[phase] ?? 0
  }, [phase, role])

  const wizardSteps = useMemo((): WizardStepItem[] => {
    const statusFor = (stepPhase: Phase): WizardStepItem["status"] => {
      if (phase > stepPhase) return "complete"
      if (phase === stepPhase) return "current"
      return "upcoming"
    }

    if (role === "tutor") {
      return [
        {
          id: "role",
          label: t("register.wizard.stepRole"),
          status: statusFor(1),
        },
        {
          id: "goals",
          label: t("register.wizard.stepGoals"),
          status: statusFor(2),
        },
        {
          id: "profile",
          label: t("register.wizard.stepProfile"),
          status: statusFor(3),
        },
        {
          id: "location",
          label: t("register.wizard.stepLocation"),
          status: statusFor(4),
        },
        {
          id: "rate",
          label: t("register.wizard.stepRate"),
          status: statusFor(5),
        },
        {
          id: "age",
          label: t("register.wizard.stepAge"),
          status: statusFor(6),
        },
        {
          id: "account",
          label: t("register.wizard.stepAccount"),
          status: statusFor(7),
        },
      ]
    }

    return [
      {
        id: "role",
        label: t("register.wizard.stepRole"),
        status: statusFor(1),
      },
      {
        id: "goals",
        label: t("register.wizard.stepGoals"),
        status: statusFor(2),
      },
      {
        id: "age",
        label: t("register.wizard.stepAge"),
        status: statusFor(4),
      },
      {
        id: "budget",
        label: t("register.wizard.stepBudget"),
        status: statusFor(5),
      },
      {
        id: "account",
        label: t("register.wizard.stepAccount"),
        status: statusFor(6),
      },
    ]
  }, [phase, role, t])

  const toggleTag = (tagId: string) => {
    setTags((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId],
    )
  }

  const addCustomTag = () => {
    const v = customTag.trim()
    if (!v || tags.includes(v)) return
    setTags((prev) => [...prev, v])
    setCustomTag("")
  }

  const toggleAgeChoice = (id: string) => {
    setAgeChoices((prev) => {
      if (id === "any") {
        return prev.includes("any") ? [] : ["any"]
      }
      const withoutAny = prev.filter((x) => x !== "any")
      if (withoutAny.includes(id)) {
        return withoutAny.filter((x) => x !== id)
      }
      return [...withoutAny, id]
    })
  }

  const hasAgeChoices = (): boolean => ageChoices.length > 0

  const canNext = (): boolean => {
    if (phase === 1) return role !== null
    if (phase === 2) {
      return (
        about.trim().length > 0 ||
        lookingFor.trim().length > 0 ||
        tags.length > 0
      )
    }
    if (phase === 3) return role === "tutor" && isTutorProfileValid()
    if (phase === 4) {
      if (role === "tutor") return isTutorLocationValid()
      return hasAgeChoices()
    }
    if (phase === 5) {
      if (role === "tutor") return true
      return isStudentBudgetValid()
    }
    if (phase === 6) {
      if (role === "tutor") return hasAgeChoices()
      return (
        email.trim().length > 0 &&
        password.trim().length > 0 &&
        firstName.trim().length > 0 &&
        lastName.trim().length > 0
      )
    }
    if (phase === 7) {
      return (
        email.trim().length > 0 &&
        password.trim().length > 0 &&
        firstName.trim().length > 0 &&
        lastName.trim().length > 0
      )
    }
    return false
  }

  const submitSignup = () => {
    ;(async () => {
      try {
        const payload = {
          email,
          password,
          firstName,
          lastName,
          role,
          about,
          lookingFor,
          tags,
          ageChoices,
          ...(role === "student"
            ? {
                budgetMinCents: budgetMinAmount * 100,
                budgetMaxCents: budgetMaxAmount * 100,
                budgetCurrency: "KZT",
              }
            : (() => {
                const { country, city } = resolveLocationLabels(
                  countryId!,
                  cityId!,
                  customCity,
                  customCountry,
                )
                return {
                  description: description.trim(),
                  experienceYears,
                  education: education.trim(),
                  country,
                  city,
                  hourlyRateCents: hourlyRateAmount * 100,
                }
              })()),
        }

        const res = await fetch(`${getApiUrl()}/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          ...AUTH_FETCH_INIT,
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          const message = Array.isArray(err.message)
            ? err.message.join(", ")
            : err.message || "Signup failed"
          toast.error(message)
          return
        }

        const data = await res.json()
        if (data.access_token && data.user) {
          saveAuthSession(data.access_token, data.user)
        }
        setDone(true)
        window.location.href = getDefaultRouteForUser(data.user)
      } catch {
        toast.error(t("toast.networkError"))
      }
    })()
  }

  const goNext = () => {
    if (!canNext()) return
    if (phase === 1) {
      setPhase(2)
      return
    }
    if (phase === 2) {
      setPhase(role === "tutor" ? 3 : 4)
      return
    }
    if (phase === 3) {
      setPhase(4)
      return
    }
    if (phase === 4) {
      setPhase(5)
      return
    }
    if (phase === 5) {
      setPhase(role === "student" ? 6 : 6)
      return
    }
    if (phase === 6) {
      if (role === "tutor") {
        setPhase(7)
        return
      }
      submitSignup()
      return
    }
    if (phase === 7) {
      submitSignup()
    }
  }

  const goBack = () => {
    if (phase === 1) return
    if (phase === 2) {
      setPhase(1)
      return
    }
    if (phase === 3) {
      setPhase(2)
      return
    }
    if (phase === 4) {
      setPhase(role === "tutor" ? 3 : 2)
      return
    }
    if (phase === 5) {
      setPhase(4)
      return
    }
    if (phase === 6) {
      setPhase(role === "student" ? 5 : 5)
      return
    }
    if (phase === 7) {
      setPhase(6)
    }
  }

  if (done && role) {
    return (
      <AuthWizardLayout
        mode="register"
        sidebarTitle={t("register.done.title")}
        sidebarSubtitle={t("register.wizard.sidebarSubtitle")}
        steps={wizardSteps}
        currentStep={displayTotal}
        totalSteps={displayTotal}
        progress={100}
        footer={
          <>
            {t("register.alreadyHave")}{" "}
            <Link
              href="/login"
              className="font-black text-[#8B5CF6] hover:underline"
            >
              {t("register.signInLink")}
            </Link>
          </>
        }
      >
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-emerald-200/50 dark:shadow-emerald-950/30">
            <Check className="h-11 w-11" />
          </div>
          <WizardStepHeader
            eyebrow={t("register.wizard.badge")}
            title={t("register.done.title")}
            subtitle={`${t("register.done.prefix")} ${
              role === "tutor"
                ? t("register.done.roleTutor")
                : t("register.done.roleStudent")
            }. ${t("register.done.note")}`}
          />
          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row">
            <Link
              href={DEFAULT_AUTH_ROUTE}
              className="inline-flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-violet-300/30"
            >
              {t("register.done.home")}
            </Link>
            <Link
              href="/login"
              className="inline-flex flex-1 items-center justify-center rounded-2xl border-2 border-slate-200 px-6 py-4 text-sm font-black uppercase tracking-widest text-[#8B5CF6] dark:border-zinc-700"
            >
              {t("register.done.login")}
            </Link>
          </div>
        </div>
      </AuthWizardLayout>
    )
  }

  const stepEyebrow = t("register.stepOf", {
    current: displayStep,
    total: displayTotal,
  })

  return (
    <AuthWizardLayout
      mode="register"
      sidebarTitle={t("register.wizard.sidebarTitle")}
      sidebarSubtitle={t("register.wizard.sidebarSubtitle")}
      steps={wizardSteps}
      currentStep={displayStep}
      totalSteps={displayTotal}
      progress={progress}
      footer={
        <>
          {t("register.alreadyHave")}{" "}
          <Link
            href="/login"
            className="font-black text-[#8B5CF6] hover:underline"
          >
            {t("register.signInLink")}
          </Link>
        </>
      }
      nav={
        <WizardNav
          onBack={goBack}
          onNext={goNext}
          backLabel={t("register.back")}
          nextLabel={
            phase === accountPhase ? t("register.finish") : t("register.continue")
          }
          canNext={canNext()}
          showBack={phase !== 1}
        />
      }
    >
      <div key={phase} className="wizard-step-enter flex flex-col">
        {phase === 1 && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.role.title")}
              subtitle={t("register.role.subtitle")}
            />
            <div className="grid flex-1 gap-3">
              <WizardRoleCard
                selected={role === "student"}
                onClick={() => selectRole("student")}
                icon={<UserRound className="h-8 w-8" />}
                title={t("register.role.studentTitle")}
                description={t("register.role.studentDesc")}
              />
              <WizardRoleCard
                selected={role === "tutor"}
                onClick={() => selectRole("tutor")}
                icon={<GraduationCap className="h-8 w-8" />}
                title={t("register.role.tutorTitle")}
                description={t("register.role.tutorDesc")}
              />
            </div>
          </>
        )}

        {phase === 2 && role === "student" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step2.title")}
              subtitle={t("register.step2.subtitle")}
            />
            <label className="mb-5 block">
              <WizardFieldLabel>
                {t("register.step2.lookingLabel")}
              </WizardFieldLabel>
              <WizardInput
                type="text"
                value={lookingFor}
                onChange={(e) => setLookingFor(e.target.value)}
                placeholder={t("register.step2.lookingPlaceholder")}
              />
            </label>
            <WizardFieldLabel>
              {t("register.step2.tagsHintStudent")}
            </WizardFieldLabel>
            <div className="mb-5 flex flex-wrap gap-2.5">
              {TAG_IDS.map((id) => (
                <WizardTag
                  key={id}
                  selected={tags.includes(id)}
                  onClick={() => toggleTag(id)}
                >
                  {tagLabel(id)}
                </WizardTag>
              ))}
            </div>
            <div className="flex gap-3">
              <WizardInput
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomTag()
                  }
                }}
                placeholder={t("register.step2.customPlaceholder")}
                className="flex-1 py-3.5"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-2xl bg-[#1E293B] px-6 py-3.5 text-sm font-black uppercase text-white dark:bg-zinc-100 dark:text-zinc-950"
              >
                {t("register.step2.add")}
              </button>
            </div>
            {tags.filter((x) => !PRESET_TAG_SET.has(x)).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags
                  .filter((x) => !PRESET_TAG_SET.has(x))
                  .map((x) => (
                    <span
                      key={x}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 py-1.5 pl-4 pr-2 text-sm font-bold text-[#8B5CF6] dark:bg-violet-950/40"
                    >
                      {x}
                      <button
                        type="button"
                        onClick={() => toggleTag(x)}
                        className="rounded-full p-1 hover:bg-violet-200/50 dark:hover:bg-violet-900/50"
                        aria-label={t("register.removeTag")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </>
        )}

        {phase === 2 && role === "tutor" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step2.title")}
              subtitle={t("register.step2.subtitle")}
            />
            <label className="mb-6 block">
              <WizardFieldLabel>
                {t("register.step2.introLabel")}
              </WizardFieldLabel>
              <WizardTextarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                placeholder={t("register.step2.introPlaceholder")}
              />
            </label>
            <WizardFieldLabel>
              {t("register.step2.tagsHintTutor")}
            </WizardFieldLabel>
            <div className="mb-5 flex flex-wrap gap-2.5">
              {TAG_IDS.map((id) => (
                <WizardTag
                  key={id}
                  selected={tags.includes(id)}
                  onClick={() => toggleTag(id)}
                >
                  {tagLabel(id)}
                </WizardTag>
              ))}
            </div>
            <div className="flex gap-3">
              <WizardInput
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustomTag()
                  }
                }}
                placeholder={t("register.step2.customPlaceholder")}
                className="flex-1 py-3.5"
              />
              <button
                type="button"
                onClick={addCustomTag}
                className="rounded-2xl bg-[#1E293B] px-6 py-3.5 text-sm font-black uppercase text-white dark:bg-zinc-100 dark:text-zinc-950"
              >
                {t("register.step2.add")}
              </button>
            </div>
            {tags.filter((x) => !PRESET_TAG_SET.has(x)).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags
                  .filter((x) => !PRESET_TAG_SET.has(x))
                  .map((x) => (
                    <span
                      key={x}
                      className="inline-flex items-center gap-1 rounded-full bg-violet-100 py-1.5 pl-4 pr-2 text-sm font-bold text-[#8B5CF6] dark:bg-violet-950/40"
                    >
                      {x}
                      <button
                        type="button"
                        onClick={() => toggleTag(x)}
                        className="rounded-full p-1 hover:bg-violet-200/50 dark:hover:bg-violet-900/50"
                        aria-label={t("register.removeTag")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </>
        )}

        {phase === 3 && role === "tutor" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step3.tutorTitle")}
              subtitle={t("register.step3.tutorSubtitle")}
            />
            <label className="mb-5 block">
              <div className="mb-2 flex items-end justify-between gap-3">
                <WizardFieldLabel>
                  {t("register.step3.descriptionLabel")}
                </WizardFieldLabel>
                <span
                  className={`text-xs font-bold tabular-nums ${
                    descriptionLength >= DESCRIPTION_MIN_LENGTH
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-zinc-500"
                  }`}
                >
                  {descriptionLength}/{DESCRIPTION_MIN_LENGTH}
                </span>
              </div>
              <p className="mb-2 text-sm font-semibold text-slate-500 dark:text-zinc-400">
                {t("register.step3.descriptionHint")}
              </p>
              <WizardTextarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                placeholder={t("register.step3.descriptionPlaceholder")}
              />
            </label>
            <label className="mb-5 block">
              <WizardFieldLabel>
                {t("register.step3.educationLabel")}
              </WizardFieldLabel>
              <WizardInput
                type="text"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder={t("register.step3.educationPlaceholder")}
              />
            </label>
            <div className="block sm:max-w-md">
              <WizardFieldLabel>
                {t("register.step3.experienceLabel")}
              </WizardFieldLabel>
              <input
                type="range"
                min={EXPERIENCE_PRESET.min}
                max={EXPERIENCE_PRESET.max}
                step={EXPERIENCE_PRESET.step}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-violet-100 accent-[#8B5CF6] dark:bg-violet-950/40"
              />
              <div className="mt-2 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <span>
                  {EXPERIENCE_PRESET.min}{" "}
                  {t("register.step3.experienceYearsUnit")}
                </span>
                <span>
                  {EXPERIENCE_PRESET.max}{" "}
                  {t("register.step3.experienceYearsUnit")}
                </span>
              </div>
              <p className="mt-3 text-center text-2xl font-black text-[#1E293B] dark:text-zinc-100">
                {experienceYears}{" "}
                <span className="text-base font-bold text-[#8B5CF6]">
                  {t("register.step3.experienceYearsUnit")}
                </span>
              </p>
            </div>
          </>
        )}

        {phase === 4 && role === "tutor" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step4.tutorLocationTitle")}
              subtitle={t("register.step4.tutorLocationSubtitle")}
            />
            <label className="mb-5 block">
              <WizardFieldLabel>{t("register.step4.countryLabel")}</WizardFieldLabel>
              <WizardSelect
                value={countryId ?? ""}
                onChange={(e) => {
                  const value = e.target.value as CountryId | ""
                  if (!value) {
                    setCountryId(null)
                    setCityId(null)
                    setCustomCity("")
                    setCustomCountry("")
                    return
                  }
                  selectCountry(value)
                }}
              >
                <option value="" disabled>
                  {t("register.step4.countryPlaceholder")}
                </option>
                {TUTOR_LOCATION_COUNTRIES.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {locationCountryLabel(loc.id)}
                  </option>
                ))}
              </WizardSelect>
            </label>

            {countryId === "other" && (
              <label className="mb-5 block">
                <WizardFieldLabel>
                  {t("register.step4.customCountryLabel")}
                </WizardFieldLabel>
                <WizardInput
                  type="text"
                  value={customCountry}
                  onChange={(e) => setCustomCountry(e.target.value)}
                  placeholder={t("register.step4.customCountryPlaceholder")}
                />
              </label>
            )}

            <label className="block">
              <WizardFieldLabel>{t("register.step4.cityLabel")}</WizardFieldLabel>
              <WizardSelect
                value={cityId ?? ""}
                disabled={!countryId}
                onChange={(e) => {
                  const value = e.target.value as CityId | ""
                  if (!value) {
                    setCityId(null)
                    setCustomCity("")
                    return
                  }
                  setCityId(value)
                  if (value !== CITY_OTHER_ID) setCustomCity("")
                }}
              >
                <option value="" disabled>
                  {countryId
                    ? t("register.step4.cityPlaceholder")
                    : t("register.step4.selectCountryFirst")}
                </option>
                {availableCities.map((id) => (
                  <option key={id} value={id}>
                    {locationCityLabel(id)}
                  </option>
                ))}
              </WizardSelect>
            </label>

            {showCustomCity && (
              <label className="mt-5 block">
                <WizardFieldLabel>
                  {t("register.step4.customCityLabel")}
                </WizardFieldLabel>
                <WizardInput
                  type="text"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  placeholder={t("register.step4.customCityPlaceholder")}
                />
              </label>
            )}
          </>
        )}

        {phase === 4 && role === "student" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step4.studentTitle")}
              subtitle={t("register.step4.studentSubtitle")}
            />
            <WizardFieldLabel>
              {t("register.step4.studentMultiHint")}
            </WizardFieldLabel>
            <div className="flex flex-wrap gap-2.5">
              {AGE_STUDENT_IDS.map((id) => (
                <WizardTag
                  key={id}
                  selected={ageChoices.includes(id)}
                  onClick={() => toggleAgeChoice(id)}
                >
                  {ageStudentLabel(id)}
                </WizardTag>
              ))}
            </div>
          </>
        )}

        {phase === 5 && role === "tutor" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step5.tutorRateTitle")}
              subtitle={t("register.step5.tutorRateSubtitle")}
            />
            <div className="flex flex-1 flex-col justify-center">
              <input
                type="range"
                min={TUTOR_RATE_PRESET.min}
                max={TUTOR_RATE_PRESET.max}
                step={TUTOR_RATE_PRESET.step}
                value={hourlyRateAmount}
                onChange={(e) => setHourlyRateAmount(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-violet-100 accent-[#8B5CF6] dark:bg-violet-950/40"
              />
              <div className="mt-4 flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                <span>{formatTenge(TUTOR_RATE_PRESET.min)}</span>
                <span>{formatTenge(TUTOR_RATE_PRESET.max)}</span>
              </div>
              <div className="mt-4 rounded-[1.25rem] border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 text-center dark:border-violet-900/40 dark:from-violet-950/20 dark:to-indigo-950/10">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                  {t("register.wizard.stepRate")}
                </p>
                <p className="mt-1.5 text-2xl font-black text-[#1E293B] dark:text-zinc-100">
                  {formatTenge(hourlyRateAmount)}
                  <span className="text-[#8B5CF6]">
                    {t("register.step5.budgetPerHour")}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        {phase === 5 && role === "student" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step5.title")}
              subtitle={t("register.step5.subtitle")}
            />
            <BudgetRangeSlider
              min={BUDGET_PRESET.min}
              max={BUDGET_PRESET.max}
              step={BUDGET_PRESET.step}
              valueMin={budgetMinAmount}
              valueMax={budgetMaxAmount}
              onChange={(min, max) => {
                setBudgetMinAmount(min)
                setBudgetMaxAmount(max)
              }}
              formatValue={(value) =>
                `${formatTenge(value)}${t("register.step5.budgetPerHour")}`
              }
              minLabel={t("register.step5.budgetMinLabel")}
              maxLabel={t("register.step5.budgetMaxLabel")}
            />
            <div className="mt-4 rounded-[1.25rem] border border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4 text-center dark:border-violet-900/40 dark:from-violet-950/20 dark:to-indigo-950/10 lg:mt-3">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                {t("register.wizard.stepBudget")}
              </p>
              <p className="mt-1.5 text-xl font-black text-[#1E293B] dark:text-zinc-100 sm:text-2xl lg:text-xl xl:text-2xl">
                {formatTenge(budgetMinAmount)}
                <span className="mx-3 text-slate-300 dark:text-zinc-600">
                  —
                </span>
                {formatTenge(budgetMaxAmount)}
                <span className="text-[#8B5CF6]">
                  {t("register.step5.budgetPerHour")}
                </span>
              </p>
            </div>
          </>
        )}

        {phase === 6 && role === "tutor" && (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step4.tutorTitle")}
              subtitle={t("register.step4.tutorSubtitle")}
            />
            <WizardFieldLabel>
              {t("register.step4.tutorMultiHint")}
            </WizardFieldLabel>
            <div className="flex flex-wrap gap-2.5">
              {AGE_TUTOR_IDS.map((id) => (
                <WizardTag
                  key={id}
                  selected={ageChoices.includes(id)}
                  onClick={() => toggleAgeChoice(id)}
                >
                  {ageTutorLabel(id)}
                </WizardTag>
              ))}
            </div>
          </>
        )}

        {(phase === 6 && role === "student") || (phase === 7 && role === "tutor") ? (
          <>
            <WizardStepHeader
              eyebrow={stepEyebrow}
              title={t("register.step6.title")}
              subtitle={t("register.step6.subtitle")}
            />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-1">
                <WizardFieldLabel>{t("auth.firstName")}</WizardFieldLabel>
                <WizardInput
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t("auth.firstNamePlaceholder")}
                />
              </label>
              <label className="block sm:col-span-1">
                <WizardFieldLabel>{t("auth.lastName")}</WizardFieldLabel>
                <WizardInput
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t("auth.lastNamePlaceholder")}
                />
              </label>
              <label className="block sm:col-span-2">
                <WizardFieldLabel>{t("auth.email")}</WizardFieldLabel>
                <WizardInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                />
              </label>
              <label className="block sm:col-span-2">
                <WizardFieldLabel>{t("auth.password")}</WizardFieldLabel>
                <WizardInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </label>
            </div>
          </>
        ) : null}
      </div>
    </AuthWizardLayout>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterWizard />
    </Suspense>
  )
}
