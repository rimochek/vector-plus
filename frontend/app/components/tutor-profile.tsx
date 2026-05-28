"use client"

import { useEffect, useState, type ComponentType } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  Users,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type ApiTutor } from "@/lib/api-client"
import { isLoggedIn, getStoredUser } from "@/lib/auth-client"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import { BookingModal } from "@/app/components/booking-modal"

function ProfileBackButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslations()

  return (
    <button
      type="button"
      onClick={onClick}
      className="group mb-8 inline-flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm backdrop-blur-sm transition hover:border-violet-200 hover:bg-violet-50 hover:text-[#8B5CF6] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 dark:hover:border-violet-900/50 dark:hover:bg-violet-950/30 dark:hover:text-violet-300"
    >
      <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-0.5" />
      {t("tutorProfile.back")}
    </button>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-100 bg-white/90 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/90">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-[#8B5CF6] dark:bg-violet-950/40">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-2xl font-black text-[#1E293B] dark:text-zinc-100">
        {value}
      </p>
      <p className="mt-1 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
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
  const [bookingOpen, setBookingOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const user = getStoredUser()
  const isStudent = (user?.role ?? user?.roles?.[0]) === "student"

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }
    router.push("/tutors")
  }

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
      router.push("/login")
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

  const handleBook = () => {
    if (!isLoggedIn()) {
      router.push("/login")
      return
    }
    if (!isStudent) return
    setBookingOpen(true)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <ProfileBackButton onClick={goBack} />
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
        </div>
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <ProfileBackButton onClick={goBack} />
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="font-semibold text-slate-500">
            {error ?? t("tutorProfile.notFound")}
          </p>
          <Link
            href="/tutors"
            className="mt-6 inline-flex rounded-2xl bg-[#8B5CF6] px-6 py-3 text-sm font-black uppercase tracking-widest text-white"
          >
            {t("favorites.browse")}
          </Link>
        </div>
      </div>
    )
  }

  const location = [tutor.city, tutor.country].filter(Boolean).join(", ")
  const hourlyRate = formatTenge(
    tutorHourlyRateTenge(tutor.defaultHourlyRateCents),
  )

  return (
    <>
      <div className="relative overflow-hidden pb-20 pt-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-violet-100/80 via-violet-50/40 to-transparent dark:from-violet-950/30 dark:via-violet-950/10" />
        <div className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl dark:bg-violet-700/10" />
        <div className="pointer-events-none absolute -left-16 top-24 h-48 w-48 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-800/10" />

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <ProfileBackButton onClick={goBack} />

          <div className="overflow-hidden rounded-[2.5rem] border border-slate-100/80 bg-white/90 shadow-[0_24px_80px_rgba(139,92,246,0.12)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/90 dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="h-32 bg-gradient-to-r from-[#8B5CF6] via-[#7C6CF6] to-[#6366F1] sm:h-40" />

            <div className="relative px-6 pb-8 sm:px-10">
              <div className="-mt-16 flex flex-col gap-6 sm:-mt-20 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-5">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-[2rem] border-4 border-white bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-4xl font-black text-white shadow-xl shadow-violet-300/40 dark:border-zinc-950 dark:shadow-violet-950/40 sm:h-32 sm:w-32 sm:text-5xl">
                    {tutor.displayName.charAt(0)}
                  </div>
                  <div className="min-w-0 pb-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl font-black tracking-tight text-[#1E293B] dark:text-zinc-100 sm:text-4xl">
                        {tutor.displayName}
                      </h1>
                      {tutor.verified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8B5CF6] dark:bg-violet-950/40">
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t("tutorProfile.verified")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-[#8B5CF6]">
                      {tutor.subject}
                    </p>
                    {tutor.headline && (
                      <p className="mt-2 max-w-2xl text-sm font-medium text-slate-500 dark:text-zinc-400">
                        {tutor.headline}
                      </p>
                    )}
                    {location && (
                      <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-slate-400">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {location}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 sm:pb-1">
                  {isStudent && (
                    <>
                      <button
                        type="button"
                        onClick={handleBook}
                        className="inline-flex items-center gap-2 rounded-2xl bg-[#8B5CF6] px-6 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-violet-300/30 transition hover:bg-violet-600 dark:shadow-violet-950/40"
                      >
                        <Sparkles className="h-4 w-4" />
                        {t("find.bookSession")}
                      </button>
                      <button
                        type="button"
                        disabled={favoriteLoading}
                        onClick={toggleFavorite}
                        aria-label={t("tutorProfile.favorite")}
                        className={`inline-flex h-[3.25rem] w-[3.25rem] items-center justify-center rounded-2xl border transition ${
                          favorited
                            ? "border-[#8B5CF6] bg-violet-50 text-[#8B5CF6] dark:bg-violet-950/30"
                            : "border-slate-200 bg-white text-slate-500 hover:border-violet-200 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-900/50"
                        }`}
                      >
                        <Heart
                          className={`h-5 w-5 ${favorited ? "fill-[#8B5CF6]" : ""}`}
                        />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div className="space-y-8">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  icon={Star}
                  label={t("tutorProfile.rating")}
                  value={`${tutor.rating.toFixed(1)} · ${tutor.reviews}`}
                />
                <StatCard
                  icon={Users}
                  label={t("tutorProfile.lessonsCompleted")}
                  value={String(tutor.lessonsCompleted)}
                />
                <StatCard
                  icon={BookOpen}
                  label={t("tutorProfile.experience")}
                  value={
                    tutor.experienceYears != null
                      ? t("tutorProfile.experienceYears", {
                          count: tutor.experienceYears,
                        })
                      : "—"
                  }
                />
              </div>

              <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <h2 className="mb-4 text-lg font-black uppercase tracking-widest text-[#1E293B] dark:text-zinc-100">
                  {t("tutorProfile.about")}
                </h2>
                <p className="text-base font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
                  {tutor.bio}
                </p>
              </section>

              {tutor.education && (
                <section className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-[#8B5CF6] dark:bg-violet-950/40">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-[#1E293B] dark:text-zinc-100">
                      {t("tutorProfile.education")}
                    </h2>
                  </div>
                  <p className="text-base font-medium leading-relaxed text-slate-600 dark:text-zinc-300">
                    {tutor.education}
                  </p>
                </section>
              )}
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="overflow-hidden rounded-[2rem] border border-violet-100 bg-white shadow-lg dark:border-violet-900/30 dark:bg-zinc-950">
                <div className="bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] px-6 py-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                    {t("tutorProfile.sessionRate")}
                  </p>
                  <p className="mt-2 text-4xl font-black text-white">
                    {hourlyRate}
                    <span className="text-lg font-bold text-white/80">
                      {t("find.perHour")}
                    </span>
                  </p>
                </div>
                <div className="space-y-4 p-6">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-zinc-900">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t("tutorProfile.rating")}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-black text-[#1E293B] dark:text-zinc-100">
                      <Star className="h-4 w-4 fill-[#8B5CF6] text-[#8B5CF6]" />
                      {tutor.rating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 dark:bg-zinc-900">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                      {t("tutorProfile.reviewsLabel")}
                    </span>
                    <span className="text-sm font-black text-[#1E293B] dark:text-zinc-100">
                      {tutor.reviews}
                    </span>
                  </div>
                  {isStudent ? (
                    <button
                      type="button"
                      onClick={handleBook}
                      className="w-full rounded-2xl bg-[#8B5CF6] py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-violet-600"
                    >
                      {t("find.bookSession")}
                    </button>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-center text-sm font-semibold text-slate-400 dark:border-zinc-700">
                      {t("tutorProfile.studentOnlyBook")}
                    </p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <BookingModal
        tutor={tutor}
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
      />
    </>
  )
}
