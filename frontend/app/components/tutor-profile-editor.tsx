"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Check, ExternalLink, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type ApiTutor } from "@/lib/api-client"
import { formatTenge } from "@/lib/currency"
import { useToast } from "@/lib/toast-context"
import { listVerificationDocuments } from "@/lib/onboarding/onboarding-api"
import type { VerificationDocumentSummary } from "@/lib/uploads/upload-verification"
import {
  EXAM_IDS,
  LANGUAGE_IDS,
  LEARNING_TOPIC_IDS,
  LEGACY_TOPIC_IDS,
  topicLabelId,
  type LearningTopicId,
} from "@/app/components/tutors-data"
import { ProfileAvatarField } from "@/app/components/profile-avatar-field"
import { VerificationDocumentsSection } from "@/app/components/verification-documents-section"
import {
  choiceFromLessonFormats,
  lessonFormatsFromChoice,
  normalizeLessonFormats,
  type LessonFormatChoice,
  type TutorLessonFormat,
} from "@/lib/tutor-lesson-formats"
import { Chip } from "@/app/components/ui/chip"
import { Button, ButtonLink } from "@/app/components/ui/button"
import { FormField, Input, Textarea } from "@/app/components/ui/form-field"
import {
  CountryCityPicker,
  isLocationComplete,
} from "@/app/components/onboarding/country-city-picker"
import {
  resolveLocationLabels,
  resolveLocationSelection,
  type CityId,
  type CountryId,
} from "@/lib/tutor-locations"

const HOURLY_RATE = {
  min: 1000,
  max: 15000,
  step: 500,
} as const

const EXPERIENCE = {
  min: 0,
  max: 40,
} as const

const BIO_MIN_LENGTH = 50

const PRESET_TAG_SET = new Set<string>([
  ...LEARNING_TOPIC_IDS,
  ...LEGACY_TOPIC_IDS,
])

function LargeCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}) {
  return (
    <label
      className={`flex items-start gap-4 rounded-2xl border p-4 transition duration-150 ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      } ${
        checked
          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
          : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 transition ${
          checked
            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
            : "border-[var(--border-strong)] bg-[var(--surface)] text-transparent"
        }`}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-[var(--text-primary)]">
          {label}
        </span>
        {description ? (
          <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">
            {description}
          </span>
        ) : null}
      </span>
    </label>
  )
}

type ProfileFormSnapshot = {
  displayName: string
  headline: string
  bio: string
  hourlyRate: number
  experienceYears: number
  education: string
  countryId: CountryId | ""
  cityId: CityId | ""
  customCountry: string
  customCity: string
  tags: string[]
  lessonFormats: TutorLessonFormat[]
  telegramUsername: string
  phone: string
  showTelegramPublicly: boolean
  showPhonePublicly: boolean
  acceptsDirectRequests: boolean
}

const serializeProfileForm = (values: ProfileFormSnapshot) =>
  JSON.stringify(values)

export function TutorProfileEditor({
  tutorProfileId,
  onSaved,
  onDirtyChange,
}: {
  tutorProfileId?: string
  onSaved?: () => void
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { t } = useTranslations()
  const toast = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [headline, setHeadline] = useState("")
  const [bio, setBio] = useState("")
  const [hourlyRate, setHourlyRate] = useState<number>(HOURLY_RATE.min)
  const [experienceYears, setExperienceYears] = useState(0)
  const [education, setEducation] = useState("")
  const [countryId, setCountryId] = useState<CountryId | "">("")
  const [cityId, setCityId] = useState<CityId | "">("")
  const [customCountry, setCustomCountry] = useState("")
  const [customCity, setCustomCity] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [lessonFormats, setLessonFormats] = useState<TutorLessonFormat[]>(["online"])
  const [customTag, setCustomTag] = useState("")
  const [verificationDocuments, setVerificationDocuments] = useState<
    VerificationDocumentSummary[]
  >([])
  const [telegramUsername, setTelegramUsername] = useState("")
  const [phone, setPhone] = useState("")
  const [showTelegramPublicly, setShowTelegramPublicly] = useState(false)
  const [showPhonePublicly, setShowPhonePublicly] = useState(false)
  const [acceptsDirectRequests, setAcceptsDirectRequests] = useState(true)
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null)

  const currentSnapshot = useMemo(
    () =>
      serializeProfileForm({
        displayName,
        headline,
        bio,
        hourlyRate,
        experienceYears,
        education,
        countryId,
        cityId,
        customCountry,
        customCity,
        tags,
        lessonFormats,
        telegramUsername,
        phone,
        showTelegramPublicly,
        showPhonePublicly,
        acceptsDirectRequests,
      }),
    [
      acceptsDirectRequests,
      bio,
      cityId,
      countryId,
      customCity,
      customCountry,
      displayName,
      education,
      experienceYears,
      headline,
      hourlyRate,
      lessonFormats,
      phone,
      showPhonePublicly,
      showTelegramPublicly,
      tags,
      telegramUsername,
    ],
  )
  const dirty = savedSnapshot !== null && savedSnapshot !== currentSnapshot

  useEffect(() => {
    api.tutors
      .ownProfile()
      .then((profile: ApiTutor) => {
        const location = resolveLocationSelection(profile.country, profile.city)
        const normalizedLessonFormats = normalizeLessonFormats(profile.lessonFormats)
        const snapshot = serializeProfileForm({
          displayName: profile.displayName,
          headline: profile.headline ?? "",
          bio: profile.bio,
          hourlyRate: Math.round(profile.defaultHourlyRateCents / 100),
          experienceYears: profile.experienceYears ?? 0,
          education: profile.education ?? "",
          ...location,
          tags: profile.tags ?? [],
          lessonFormats: normalizedLessonFormats,
          telegramUsername: profile.telegramUsername ?? "",
          phone: profile.phone ?? "",
          showTelegramPublicly: profile.showTelegramPublicly ?? false,
          showPhonePublicly: profile.showPhonePublicly ?? false,
          acceptsDirectRequests: profile.acceptsDirectRequests ?? true,
        })
        setDisplayName(profile.displayName)
        setHeadline(profile.headline ?? "")
        setBio(profile.bio)
        setHourlyRate(Math.round(profile.defaultHourlyRateCents / 100))
        setExperienceYears(profile.experienceYears ?? 0)
        setEducation(profile.education ?? "")
        setCountryId(location.countryId)
        setCityId(location.cityId)
        setCustomCountry(location.customCountry)
        setCustomCity(location.customCity)
        setAvatarUrl(profile.avatarUrl ?? "")
        setTags(profile.tags ?? [])
        setLessonFormats(normalizedLessonFormats)
        setTelegramUsername(profile.telegramUsername ?? "")
        setPhone(profile.phone ?? "")
        setShowTelegramPublicly(profile.showTelegramPublicly ?? false)
        setShowPhonePublicly(profile.showPhonePublicly ?? false)
        setAcceptsDirectRequests(profile.acceptsDirectRequests ?? true)
        setSavedSnapshot(snapshot)
      })
      .catch(() => toast.error(t("tutorDash.profileEdit.loadError")))
      .finally(() => setLoading(false))

    void listVerificationDocuments()
      .then(setVerificationDocuments)
      .catch(() => undefined)
  }, [t, toast])

  useEffect(() => {
    onDirtyChange?.(dirty)
  }, [dirty, onDirtyChange])

  useEffect(
    () => () => {
      onDirtyChange?.(false)
    },
    [onDirtyChange],
  )

  useEffect(() => {
    if (!dirty) return

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    const blockLinkNavigation = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>("a[href]")
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return
      }

      const nextUrl = new URL(anchor.href, window.location.href)
      const currentUrl = new URL(window.location.href)
      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      toast.warning(t("toast.unsavedChanges"))
    }

    window.addEventListener("beforeunload", warnBeforeUnload)
    document.addEventListener("click", blockLinkNavigation, true)
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload)
      document.removeEventListener("click", blockLinkNavigation, true)
    }
  }, [dirty, t, toast])

  const toggleTag = (id: string) => {
    setTags((prev) =>
      prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id],
    )
  }

  const addCustomTag = () => {
    const value = customTag.trim()
    if (!value || tags.includes(value)) return
    setTags((prev) => [...prev, value])
    setCustomTag("")
  }

  const selectLessonFormat = (choice: LessonFormatChoice) => {
    setLessonFormats(lessonFormatsFromChoice(choice))
  }

  const handleSave = async () => {
    if (bio.trim().length < BIO_MIN_LENGTH) {
      toast.error(t("tutorDash.profileEdit.bioTooShort"))
      return
    }
    if (lessonFormats.length === 0) {
      toast.error(t("tutorDash.profileEdit.lessonFormatRequired"))
      return
    }
    if (
      !isLocationComplete(
        countryId,
        cityId,
        customCountry,
        customCity,
      )
    ) {
      toast.error(t("tutorDash.profileEdit.locationRequired"))
      return
    }

    const location = resolveLocationLabels(
      countryId as CountryId,
      cityId,
      customCity,
      customCountry,
    )
    const hasTelegram = Boolean(telegramUsername.trim())
    const hasPhone = Boolean(phone.trim())
    const preferredContactMethod =
      showTelegramPublicly && hasTelegram && showPhonePublicly && hasPhone
        ? "BOTH"
        : showTelegramPublicly && hasTelegram
          ? "TELEGRAM"
          : showPhonePublicly && hasPhone
            ? "PHONE"
            : hasTelegram && hasPhone
              ? "BOTH"
              : hasTelegram
                ? "TELEGRAM"
                : "PHONE"

    setSaving(true)
    try {
      await api.tutors.updateProfile({
        displayName: displayName.trim(),
        headline: headline.trim(),
        bio: bio.trim(),
        defaultHourlyRateCents: hourlyRate * 100,
        experienceYears,
        education: education.trim(),
        country: location.country,
        city: location.city,
        tags,
        lessonFormats,
        telegramUsername: telegramUsername.trim() || undefined,
        phone: phone.trim() || undefined,
        preferredContactMethod,
        showTelegramPublicly,
        showPhonePublicly,
        acceptsDirectRequests,
      })
      setSavedSnapshot(currentSnapshot)
      toast.success(t("tutorDash.profileEdit.saved"))
      onSaved?.()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("tutorDash.profileEdit.saveError"),
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {t("tutorDash.profileEdit.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {t("tutorDash.profileEdit.subtitle")}
          </p>
        </div>
        {tutorProfileId && (
          <ButtonLink
            href={`/tutors/${tutorProfileId}`}
            variant="secondary"
            className="gap-2"
          >
            {t("tutorDash.previewProfile")}
            <ExternalLink className="h-4 w-4" />
          </ButtonLink>
        )}
      </div>

      <ProfileAvatarField
        avatarUrl={avatarUrl}
        onAvatarChange={setAvatarUrl}
        onUploadSuccess={() => {
          toast.success(t("tutorDash.profileEdit.avatarUploaded"))
          onSaved?.()
        }}
        onRemoveSuccess={() => {
          toast.success(t("tutorDash.profileEdit.avatarRemoved"))
          onSaved?.()
        }}
        onUploadError={(message) => toast.error(message)}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField label={t("tutorDash.profileEdit.displayName")}>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </FormField>

        <FormField label={t("tutorDash.profileEdit.headline")}>
          <Input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            placeholder={t("tutorDash.profileEdit.headlinePlaceholder")}
          />
        </FormField>
      </div>

      <FormField
        label={t("tutorDash.profileEdit.bio")}
        error={
          bio.trim().length > 0 && bio.trim().length < BIO_MIN_LENGTH
            ? t("tutorDash.profileEdit.bioTooShort")
            : undefined
        }
      >
        <Textarea
          rows={6}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
        />
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          {t("tutorDash.profileEdit.bioHint")}
        </p>
      </FormField>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormField label={t("tutorDash.profileEdit.hourlyRate")}>
          <div className="space-y-3 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
            <div className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
              <span>{formatTenge(HOURLY_RATE.min)}</span>
              <span className="text-[var(--primary)]">{formatTenge(hourlyRate)}</span>
              <span>{formatTenge(HOURLY_RATE.max)}</span>
            </div>
            <input
              type="range"
              min={HOURLY_RATE.min}
              max={HOURLY_RATE.max}
              step={HOURLY_RATE.step}
              value={hourlyRate}
              onChange={(event) => setHourlyRate(Number(event.target.value))}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        </FormField>

        <FormField label={t("tutorDash.profileEdit.experience")}>
          <Input
            type="number"
            min={EXPERIENCE.min}
            max={EXPERIENCE.max}
            value={experienceYears}
            onChange={(event) => setExperienceYears(Number(event.target.value))}
          />
        </FormField>
      </div>

      <FormField label={t("tutorDash.profileEdit.education")}>
        <Textarea
          rows={3}
          value={education}
          onChange={(event) => setEducation(event.target.value)}
        />
      </FormField>

      <div className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
        <CountryCityPicker
          countryId={countryId}
          cityId={cityId}
          customCountry={customCountry}
          customCity={customCity}
          onCountryChange={setCountryId}
          onCityChange={setCityId}
          onCustomCountryChange={setCustomCountry}
          onCustomCityChange={setCustomCity}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          {t("tutorDash.profileEdit.lessonFormat")}
        </p>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          {t("tutorDash.profileEdit.lessonFormatHint")}
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["online", "find.format.online"],
              ["offline", "find.format.inPerson"],
              ["both", "find.format.hybrid"],
            ] as const
          ).map(([choice, labelId]) => {
            const selected =
              choice === "both"
                ? lessonFormats.length === 2
                : lessonFormats.includes(choice) && lessonFormats.length === 1
            return (
              <Chip
                key={choice}
                selected={selected}
                onClick={() => selectLessonFormat(choice)}
              >
                {t(labelId)}
              </Chip>
            )
          })}
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-[var(--border)] p-5">
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          {t("lead.contactTutor")}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("lead.contactHint")}</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label={t("lead.field.telegram")}>
            <Input
              value={telegramUsername}
              onChange={(event) => {
                setTelegramUsername(event.target.value)
                if (!event.target.value.trim()) setShowTelegramPublicly(false)
              }}
              placeholder="@username"
            />
          </FormField>
          <FormField label={t("lead.field.phone")}>
            <Input
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value)
                if (!event.target.value.trim()) setShowPhonePublicly(false)
              }}
              placeholder="+77000000000"
            />
          </FormField>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <LargeCheckbox
            checked={showTelegramPublicly}
            onChange={setShowTelegramPublicly}
            disabled={!telegramUsername.trim()}
            label={t("lead.openTelegram")}
            description={t("tutorDash.profileEdit.showTelegramHint")}
          />
          <LargeCheckbox
            checked={showPhonePublicly}
            onChange={setShowPhonePublicly}
            disabled={!phone.trim()}
            label={t("lead.call")}
            description={t("tutorDash.profileEdit.showPhoneHint")}
          />
          <div className="lg:col-span-2">
            <LargeCheckbox
              checked={acceptsDirectRequests}
              onChange={setAcceptsDirectRequests}
              label={t("lead.leaveRequest")}
              description={t("tutorDash.profileEdit.directRequestsHint")}
            />
          </div>
        </div>
      </div>

      <div id="teaching-subjects">
        <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
          {t("tutorDash.profileEdit.tags")}
        </p>
        <p className="mb-4 text-xs text-[var(--text-muted)]">
          {t("tutorDash.profileEdit.tagsHint")}
        </p>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t("find.languagesLabel")}
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {LANGUAGE_IDS.map((id) => (
            <Chip
              key={id}
              selected={tags.includes(id)}
              onClick={() => toggleTag(id)}
            >
              {t(topicLabelId(id))}
            </Chip>
          ))}
        </div>

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t("find.examsLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAM_IDS.map((id) => (
            <Chip
              key={id}
              selected={tags.includes(id)}
              onClick={() => toggleTag(id)}
            >
              {t(topicLabelId(id))}
            </Chip>
          ))}
          {tags
            .filter((tag) => !LEARNING_TOPIC_IDS.includes(tag as LearningTopicId))
            .map((tag) => (
              <Chip key={tag} selected onClick={() => toggleTag(tag)}>
                {PRESET_TAG_SET.has(tag) ? t(topicLabelId(tag)) : tag}
              </Chip>
            ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Input
            value={customTag}
            onChange={(event) => setCustomTag(event.target.value)}
            placeholder={t("tutorDash.profileEdit.customTag")}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                addCustomTag()
              }
            }}
          />
          <Button type="button" variant="secondary" onClick={addCustomTag}>
            {t("tutorDash.profileEdit.addTag")}
          </Button>
        </div>
      </div>

      <VerificationDocumentsSection
        documents={verificationDocuments}
        onDocumentsChange={setVerificationDocuments}
        onUploadSuccess={() => toast.success(t("tutorDash.verification.uploaded"))}
        onDeleteSuccess={() => toast.success(t("tutorDash.verification.deleted"))}
        onUploadError={(message) => toast.error(message)}
        onEditSubjects={() => {
          document
            .getElementById("teaching-subjects")
            ?.scrollIntoView({ behavior: "smooth", block: "start" })
        }}
        teachingTagsKey={tags.join(",")}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--border)] pt-6">
        <Button disabled={saving} onClick={handleSave}>
          {saving ? t("tutorDash.profileEdit.saving") : t("tutorDash.profileEdit.save")}
        </Button>
        {tutorProfileId && (
          <Link
            href={`/tutors/${tutorProfileId}`}
            className="text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            {t("tutorDash.previewProfile")}
          </Link>
        )}
      </div>
    </div>
  )
}
