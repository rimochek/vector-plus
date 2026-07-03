"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Award,
  BookOpen,
  CheckCircle,
  Globe,
  GraduationCap,
  Loader2,
  Monitor,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { api, type ApiTutor } from "@/lib/api-client"
import { isLoggedIn, getStoredUser } from "@/lib/auth-client"
import { studentSignupPath } from "@/lib/guest-auth"
import { TutorBookingSidebar } from "@/app/components/tutor-booking-sidebar"
import { Container } from "@/app/components/ui/container"
import { Badge } from "@/app/components/ui/badge"
import { LEARNING_TOPIC_IDS, LEGACY_TOPIC_IDS, topicLabelId } from "@/app/components/tutors-data"
import {
  choiceFromLessonFormats,
  normalizeLessonFormats,
  type TutorLessonFormat,
} from "@/lib/tutor-lesson-formats"

type ProfileTab = "about" | "subjects" | "reviews" | "availability" | "education"

function tagLabelId(id: string): MessageId | null {
  if (
    LEARNING_TOPIC_IDS.includes(id as (typeof LEARNING_TOPIC_IDS)[number]) ||
    LEGACY_TOPIC_IDS.includes(id as (typeof LEGACY_TOPIC_IDS)[number])
  ) {
    return topicLabelId(id)
  }
  return null
}

function lessonFormatLabel(
  formats: TutorLessonFormat[],
  t: (id: MessageId) => string,
): string {
  const choice = choiceFromLessonFormats(formats)
  if (choice === "both") return t("find.format.hybrid")
  if (choice === "offline") return t("find.format.inPerson")
  return t("find.format.online")
}

function splitBio(bio: string) {
  const quoteMatch = bio.match(/"([^"]+)"/)
  if (quoteMatch) {
    const body = bio.replace(quoteMatch[0], "").replace(/\s+/g, " ").trim()
    return {
      body: body.length > 0 ? body : bio.trim(),
      highlight: quoteMatch[1].trim(),
    }
  }

  return { body: bio.trim(), highlight: null as string | null }
}

function reviewDistribution(rating: number, total: number) {
  if (total <= 0) return [0, 0, 0, 0, 0]
  const weights = [5, 4, 3, 2, 1].map((stars) => {
    const distance = Math.abs(stars - rating)
    return Math.max(0.05, 1.4 - distance * 0.45)
  })
  const sum = weights.reduce((acc, value) => acc + value, 0)
  return weights.map((weight) => Math.round((weight / sum) * total))
}

function MetricCard({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Star
  value: string
  label: string
}) {
  return (
    <div className="flex min-h-[7rem] flex-col items-center rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-3 text-center shadow-[var(--shadow-sm)] sm:min-h-[8.75rem] sm:p-4">
      <div className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)] sm:mb-3 sm:h-10 sm:w-10">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
      </div>
      <p className="text-xl font-extrabold leading-none text-[var(--text-primary)] sm:text-2xl">{value}</p>
      <p className="mt-2 line-clamp-2 min-h-[2rem] text-xs font-medium leading-snug text-[var(--text-muted)]">
        {label}
      </p>
    </div>
  )
}

export function TutorProfile() {
  const { t } = useTranslations()
  const params = useParams()
  const router = useRouter()
  const tutorId = params.id as string
  const [tutor, setTutor] = useState<ApiTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [favorited, setFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<ProfileTab>("about")

  const user = getStoredUser()
  const isStudent = (user?.role ?? user?.roles?.[0]) === "student"

  useEffect(() => {
    api.tutors
      .get(tutorId)
      .then(setTutor)
      .catch(() => setError(t("tutorProfile.notFound")))
      .finally(() => setLoading(false))
  }, [tutorId, t])

  useEffect(() => {
    if (!isLoggedIn() || !isStudent) return
    api.favorites
      .check(tutorId)
      .then((r) => setFavorited(r.favorited))
      .catch(() => {})
  }, [tutorId, isStudent])

  const toggleFavorite = async () => {
    if (!isLoggedIn()) {
      router.push(studentSignupPath(`/tutors/${tutorId}`))
      return
    }
    if (!isStudent) return
    setFavoriteLoading(true)
    try {
      if (favorited) {
        await api.favorites.remove(tutorId)
        setFavorited(false)
      } else {
        await api.favorites.add(tutorId)
        setFavorited(true)
      }
    } finally {
      setFavoriteLoading(false)
    }
  }

  const tabs = useMemo(
    () =>
      [
        { id: "about" as const, label: t("tutorProfile.tab.about") },
        { id: "subjects" as const, label: t("tutorProfile.tab.subjects") },
        {
          id: "reviews" as const,
          label: `${t("tutorProfile.tab.reviews")}${tutor ? ` (${tutor.reviews})` : ""}`,
        },
        { id: "availability" as const, label: t("tutorProfile.tab.availability") },
        { id: "education" as const, label: t("tutorProfile.tab.education") },
      ] satisfies { id: ProfileTab; label: string }[],
    [t, tutor],
  )

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <Container size="content" className="py-12">
        <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
          <p className="font-semibold text-[var(--text-muted)]">
            {error ?? t("tutorProfile.notFound")}
          </p>
          <Link
            href="/tutors"
            className="mt-6 inline-flex rounded-[var(--radius-button)] bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white"
          >
            {t("favorites.browse")}
          </Link>
        </div>
      </Container>
    )
  }

  const location = [tutor.city, tutor.country].filter(Boolean).join(", ")
  const subjectTags =
    tutor.tags && tutor.tags.length > 0
      ? tutor.tags
      : tutor.subjects?.map((subject) => subject.name) ?? [tutor.subject]
  const { body: bioBody, highlight } = splitBio(tutor.bio)
  const satisfaction = tutor.rating > 0 ? Math.round((tutor.rating / 5) * 100) : null
  const distribution = reviewDistribution(tutor.rating, tutor.reviews)
  const firstName = tutor.displayName.split(" ")[0] ?? tutor.displayName
  const lessonFormats = normalizeLessonFormats(tutor.lessonFormats)
  const formatLabel = lessonFormatLabel(lessonFormats, t)
  const FormatIcon =
    choiceFromLessonFormats(lessonFormats) === "offline" ? MapPin : Monitor

  return (
    <div className="overflow-x-clip bg-[var(--background)] pb-10 pt-4 sm:pb-16 sm:pt-6">
      <Container size="content" className="min-w-0">
        <div className="grid min-w-0 w-full gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start xl:gap-8">
          <TutorBookingSidebar
            className="order-1 min-w-0 w-full xl:order-2"
            tutor={tutor}
            favorited={favorited}
            favoriteLoading={favoriteLoading}
            onToggleFavorite={toggleFavorite}
          />

          <div className="order-2 min-w-0 w-full space-y-4 sm:space-y-6 xl:order-1">
            <section className="relative overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-6 lg:p-8">
              <div className="pointer-events-none absolute -right-10 -top-10 hidden h-56 w-56 rounded-full bg-[var(--primary-soft)] blur-3xl sm:block" />
              <div className="pointer-events-none absolute right-24 top-8 hidden h-32 w-32 rounded-full bg-violet-200/40 blur-2xl dark:bg-violet-900/20 sm:block" />

              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                <div className="relative mx-auto shrink-0 pb-3 sm:mx-0">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--surface)] bg-gradient-to-br from-[var(--primary)] to-[var(--primary-to)] text-3xl font-bold text-white shadow-[var(--shadow-md)] sm:h-28 sm:w-28 sm:text-4xl lg:h-32 lg:w-32">
                    {tutor.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tutor.avatarUrl}
                        alt={tutor.displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      tutor.displayName.charAt(0)
                    )}
                  </div>
                  <span className="absolute -bottom-1 left-1/2 max-w-[min(100%,12rem)] -translate-x-1/2 truncate rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-[10px] font-semibold text-[var(--success)] shadow-sm">
                    <span className="inline-flex max-w-full items-center gap-1">
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" />
                      <span className="truncate">{formatLabel}</span>
                    </span>
                  </span>
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="break-words text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
                        {tutor.displayName}
                      </h1>
                      {tutor.verified && (
                        <Badge tone="primary" className="gap-1">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("tutorProfile.verified")}
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-[var(--text-secondary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <Star className="h-4 w-4 shrink-0 fill-[var(--warning)] text-[var(--warning)]" />
                        {t("tutorProfile.reviewsCount", {
                          rating: tutor.rating.toFixed(1),
                          count: tutor.reviews,
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                        {t("tutorProfile.lessonsTaught", { count: tutor.lessonsCompleted })}
                      </span>
                    </div>
                  </div>

                  {tutor.headline && (
                    <p className="max-w-2xl text-base leading-relaxed text-[var(--text-secondary)]">
                      {tutor.headline}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--text-muted)]">
                    <span className="inline-flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-[var(--primary)]" />
                      {tutor.subject}
                    </span>
                    {location && (
                      <span className="inline-flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[var(--primary)]" />
                        {location}
                      </span>
                    )}
                    <span className="inline-flex min-w-0 max-w-full items-center gap-2">
                      <FormatIcon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                      <span className="truncate">
                        {formatLabel} • {t("tutorProfile.oneOnOne")}
                      </span>
                    </span>
                  </div>

                  <div className="border-t border-[var(--border)] pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {t("tutorProfile.subjectsLabel")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {subjectTags.map((tag) => {
                        const labelId = tagLabelId(tag)
                        return (
                          <span
                            key={tag}
                            className="rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                          >
                            {labelId ? t(labelId) : tag}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
              <nav
                className="-mx-px flex gap-1 overflow-x-auto border-b border-[var(--border)] px-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 sm:px-6 [&::-webkit-scrollbar]:hidden"
                role="tablist"
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 border-b-2 px-1 py-3 text-xs font-semibold transition sm:py-4 sm:text-sm ${
                      activeTab === tab.id
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              <div key={activeTab} className="tutora-tab-panel p-4 sm:p-6 lg:p-8">
                {activeTab === "about" && (
                  <div className="space-y-10">
                    <section className="space-y-4 border-b border-[var(--border)] pb-10">
                      <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {t("tutorProfile.aboutTitle", { name: firstName })}
                      </h2>
                      <p className="max-w-3xl break-words text-base leading-7 text-[var(--text-secondary)]">
                        {bioBody}
                      </p>
                      {highlight && (
                        <blockquote className="flex gap-3 rounded-[var(--radius-card)] border border-[var(--warning-soft)] bg-[var(--warning-soft)]/40 px-4 py-4">
                          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[var(--warning)]" />
                          <p className="text-sm font-medium italic leading-relaxed text-[var(--text-primary)]">
                            {highlight}
                          </p>
                        </blockquote>
                      )}
                    </section>

                    <section className="space-y-4 border-b border-[var(--border)] pb-10">
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                      <MetricCard
                        icon={Award}
                        value={
                          tutor.experienceYears != null
                            ? `${tutor.experienceYears}+`
                            : "—"
                        }
                        label={t("tutorProfile.yearsExperience")}
                      />
                      <MetricCard
                        icon={BookOpen}
                        value={`${tutor.lessonsCompleted}+`}
                        label={t("tutorProfile.lessonsCompleted")}
                      />
                      <MetricCard
                        icon={Users}
                        value={`${Math.max(tutor.reviews, Math.round(tutor.lessonsCompleted * 0.35))}+`}
                        label={t("tutorProfile.happyStudents")}
                      />
                      <MetricCard
                        icon={Star}
                        value={satisfaction != null ? `${satisfaction}%` : "—"}
                        label={t("tutorProfile.satisfactionRate")}
                      />
                      </div>
                    </section>

                    {subjectTags.length > 0 && (
                      <section className="space-y-3 border-b border-[var(--border)] pb-10">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {t("tutorProfile.specializations")}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {subjectTags.map((tag) => {
                            const labelId = tagLabelId(tag)
                            return (
                              <span
                                key={tag}
                                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                              >
                                {labelId ? t(labelId) : tag}
                              </span>
                            )
                          })}
                        </div>
                      </section>
                    )}

                    <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
                      <div className="min-w-0 space-y-4">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">
                          {t("tutorProfile.recentReviews")}
                        </h3>
                        <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                          {t("tutorProfile.noReviewsYet")}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface-secondary)] p-5 xl:max-w-[280px] xl:justify-self-end">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                          {t("tutorProfile.reviewsOverview")}
                        </h3>
                        <div className="mt-4 flex items-end gap-2">
                          <span className="text-4xl font-extrabold text-[var(--text-primary)]">
                            {tutor.rating.toFixed(1)}
                          </span>
                          <div className="mb-1 flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                className={`h-4 w-4 ${
                                  index < Math.round(tutor.rating)
                                    ? "fill-[var(--warning)] text-[var(--warning)]"
                                    : "text-[var(--border-strong)]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="mt-5 space-y-2">
                          {[5, 4, 3, 2, 1].map((stars, index) => {
                            const count = distribution[4 - index] ?? 0
                            const width =
                              tutor.reviews > 0 ? Math.max(4, (count / tutor.reviews) * 100) : 0
                            return (
                              <div key={stars} className="flex items-center gap-2 text-xs">
                                <span className="w-3 text-[var(--text-muted)]">{stars}</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                                  <div
                                    className="h-full rounded-full bg-[var(--primary)]"
                                    style={{ width: `${width}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {activeTab === "subjects" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {t("tutorProfile.tab.subjects")}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {subjectTags.map((tag) => {
                        const labelId = tagLabelId(tag)
                        return (
                          <Badge key={tag} tone="muted" className="px-4 py-2 text-sm">
                            {labelId ? t(labelId) : tag}
                          </Badge>
                        )
                      })}
                    </div>
                    {tutor.subjects && tutor.subjects.length > 0 && (
                      <ul className="space-y-3 pt-2">
                        {tutor.subjects.map((subject) => (
                          <li
                            key={subject.id}
                            className="flex items-center justify-between rounded-[var(--radius-card)] border border-[var(--border)] px-4 py-3"
                          >
                            <span className="font-semibold text-[var(--text-primary)]">
                              {subject.name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === "reviews" && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">
                          {t("tutorProfile.tab.reviews")}
                        </h2>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">
                          {t("tutorProfile.reviewsCount", {
                            rating: tutor.rating.toFixed(1),
                            count: tutor.reviews,
                          })}
                        </p>
                      </div>
                    </div>
                    <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                      {t("tutorProfile.noReviewsYet")}
                    </p>
                  </div>
                )}

                {activeTab === "availability" && (
                  <div className="space-y-3">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {t("tutorProfile.tab.availability")}
                    </h2>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                      {t("tutorProfile.availabilityHint")}
                    </p>
                  </div>
                )}

                {activeTab === "education" && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {t("tutorProfile.tab.education")}
                    </h2>
                    {tutor.education ? (
                      <p className="whitespace-pre-line text-base leading-relaxed text-[var(--text-secondary)]">
                        {tutor.education}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">
                        {t("tutorProfile.educationEmpty")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </Container>
    </div>
  )
}
