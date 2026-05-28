"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal, Star, CheckCircle, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { BudgetRangeSlider } from "@/app/components/budget-range-slider"
import {
  LEARNING_TOPIC_IDS,
  TIME_SLOT_IDS,
  TUTORS_PRICE_PRESET,
  type LearningTopicId,
  type TimeSlotId,
  type TutorSortOption,
} from "@/app/components/tutors-data"
import { getStoredUser, isLoggedIn, refreshCurrentUser, type StoredUser } from "@/lib/auth-client"
import { api, type ApiTutor } from "@/lib/api-client"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import {
  getStudentTutorFilterPrefs,
  type StudentTutorFilterPrefs,
} from "@/lib/student-preferences"

const SUBJECTS = [
  "All",
  "Mathematics",
  "Computer Science",
  "Languages",
  "Physics",
] as const

function topicLabelId(id: LearningTopicId): MessageId {
  if (id === "programming") return "find.topic.programming"
  return `register.tag.${id}` as MessageId
}

function timeLabelId(id: TimeSlotId): MessageId {
  return `find.time.${id}` as MessageId
}

const DEFAULT_FILTER_PREFS: StudentTutorFilterPrefs = {
  priceMin: TUTORS_PRICE_PRESET.defaultMin,
  priceMax: TUTORS_PRICE_PRESET.defaultMax,
  topics: [],
  searchHint: "",
}

export const FindTutors = () => {
  const { t } = useTranslations()
  const router = useRouter()
  const savedPrefsRef = useRef(DEFAULT_FILTER_PREFS)
  const [apiTutors, setApiTutors] = useState<ApiTutor[]>([])
  const [tutorsLoading, setTutorsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState<string>("All")
  const [selectedTopics, setSelectedTopics] = useState<LearningTopicId[]>([])
  const [selectedTimes, setSelectedTimes] = useState<TimeSlotId[]>([])
  const [priceMin, setPriceMin] = useState<number>(TUTORS_PRICE_PRESET.defaultMin)
  const [priceMax, setPriceMax] = useState<number>(TUTORS_PRICE_PRESET.defaultMax)
  const [sort, setSort] = useState<TutorSortOption>("recommendation")

  useEffect(() => {
    const user = getStoredUser()
    api.tutors
      .list()
      .then((tutors) => {
        const selfUserId = user?.id
        setApiTutors(
          selfUserId
            ? tutors.filter((tutor) => tutor.userId !== selfUserId)
            : tutors,
        )
      })
      .catch(() => setApiTutors([]))
      .finally(() => setTutorsLoading(false))
  }, [])

  useEffect(() => {
    const loadPreferences = async () => {
      let user: StoredUser | null = getStoredUser()

      if (localStorage.getItem("token")) {
        user = (await refreshCurrentUser()) ?? getStoredUser()
      }

      const prefs = getStudentTutorFilterPrefs(user, DEFAULT_FILTER_PREFS)
      const clampedPrefs = {
        ...prefs,
        priceMin: Math.max(
          TUTORS_PRICE_PRESET.min,
          Math.min(prefs.priceMin, TUTORS_PRICE_PRESET.max),
        ),
        priceMax: Math.max(
          TUTORS_PRICE_PRESET.min,
          Math.min(prefs.priceMax, TUTORS_PRICE_PRESET.max),
        ),
      }
      if (clampedPrefs.priceMax < clampedPrefs.priceMin) {
        clampedPrefs.priceMax = clampedPrefs.priceMin + TUTORS_PRICE_PRESET.step
      }
      savedPrefsRef.current = clampedPrefs
      setPriceMin(clampedPrefs.priceMin)
      setPriceMax(clampedPrefs.priceMax)
      if (prefs.topics.length > 0) setSelectedTopics(prefs.topics)
      if (prefs.searchHint) setSearch(prefs.searchHint)
    }

    loadPreferences()
  }, [])

  const toggleTopic = (id: LearningTopicId) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleTime = (id: TimeSlotId) => {
    setSelectedTimes((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const clearFilters = () => {
    const prefs = savedPrefsRef.current
    setSearch(prefs.searchHint)
    setSubject("All")
    setSelectedTopics(prefs.topics)
    setSelectedTimes([])
    setPriceMin(prefs.priceMin)
    setPriceMax(prefs.priceMax)
    setSort("recommendation")
  }

  const filteredTutors = useMemo(() => {
    const query = search.trim().toLowerCase()

    const filtered = apiTutors.filter((tutor) => {
      const haystack = [
        tutor.displayName,
        tutor.subject,
        tutor.bio,
        tutor.city ?? "",
        tutor.country ?? "",
      ]
        .join(" ")
        .toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesSubject = subject === "All" || tutor.subject === subject
      const tutorPrice = tutorHourlyRateTenge(tutor.defaultHourlyRateCents)
      const matchesPrice = tutorPrice >= priceMin && tutorPrice <= priceMax

      return matchesSearch && matchesSubject && matchesPrice
    })

    const sorted = [...filtered]
    switch (sort) {
      case "price_asc":
        sorted.sort(
          (a, b) =>
            tutorHourlyRateTenge(a.defaultHourlyRateCents) -
            tutorHourlyRateTenge(b.defaultHourlyRateCents),
        )
        break
      case "price_desc":
        sorted.sort(
          (a, b) =>
            tutorHourlyRateTenge(b.defaultHourlyRateCents) -
            tutorHourlyRateTenge(a.defaultHourlyRateCents),
        )
        break
      case "popularity":
        sorted.sort((a, b) => b.lessonsCompleted - a.lessonsCompleted)
        break
      case "reviews":
        sorted.sort((a, b) => b.reviews - a.reviews)
        break
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case "recommendation":
      default:
        sorted.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
        break
    }

    return sorted
  }, [apiTutors, search, subject, priceMin, priceMax, sort])

  const subjectLabel = (value: string) => {
    const map: Record<string, MessageId> = {
      All: "find.allDisciplines",
      Mathematics: "find.math",
      "Computer Science": "find.cs",
      Languages: "find.languages",
      Physics: "find.physics",
    }
    return t(map[value] ?? "find.allDisciplines")
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mb-8 min-w-0 max-w-2xl sm:mb-10">
        <h2 className="mb-3 break-words text-3xl font-black tracking-tight text-[#1E293B] dark:text-zinc-50 sm:mb-4 sm:text-4xl lg:text-5xl">
          {t("find.title")}
        </h2>
        <p className="text-base font-semibold text-slate-400 dark:text-zinc-500 sm:text-lg">
          {t("find.subtitle")}
        </p>
      </div>

      <div className="mb-8">
        <div className="group relative">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-[#8B5CF6] dark:text-zinc-600" />
          <input
            type="text"
            placeholder={t("find.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[2rem] border-2 border-slate-100 bg-white py-5 pl-14 pr-6 text-base font-medium text-[#1E293B] shadow-sm outline-none transition-all placeholder:text-slate-400 focus:border-[#8B5CF6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-10 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <aside className="h-fit min-w-0 max-w-full space-y-6 overflow-hidden rounded-[2rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6 lg:sticky lg:top-24">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
              <h3 className="text-xs font-black uppercase tracking-widest text-[#1E293B] dark:text-zinc-100 sm:text-sm">
                {t("find.filtersTitle")}
              </h3>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              className="shrink-0 text-xs font-bold text-[#8B5CF6] hover:underline"
            >
              {t("find.clearFilters")}
            </button>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              {t("find.allDisciplines")}
            </p>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-[#1E293B] outline-none focus:border-[#8B5CF6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {SUBJECTS.map((value) => (
                <option key={value} value={value}>
                  {subjectLabel(value)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              {t("find.learnLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {LEARNING_TOPIC_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTopic(id)}
                  className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                    selectedTopics.includes(id)
                      ? "bg-[#8B5CF6] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {t(topicLabelId(id))}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              {t("find.priceRangeLabel")}
            </p>
            <BudgetRangeSlider
              compact
              min={TUTORS_PRICE_PRESET.min}
              max={TUTORS_PRICE_PRESET.max}
              step={TUTORS_PRICE_PRESET.step}
              valueMin={priceMin}
              valueMax={priceMax}
              onChange={(min, max) => {
                setPriceMin(min)
                setPriceMax(max)
              }}
              formatValue={(value) => formatTenge(value)}
              minLabel={t("find.priceMinLabel")}
              maxLabel={t("find.priceMaxLabel")}
            />
          </div>

          <div>
            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-slate-400 dark:text-zinc-500">
              {t("find.availabilityLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOT_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTime(id)}
                  className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-wider transition ${
                    selectedTimes.includes(id)
                      ? "bg-[#8B5CF6] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-violet-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  }`}
                >
                  {t(timeLabelId(id))}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm font-bold text-slate-500 dark:text-zinc-400">
              {t("find.resultsCount", { count: filteredTutors.length })}
            </p>
            <label className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
              <span className="shrink-0 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
                {t("find.sortLabel")}
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TutorSortOption)}
                className="w-full min-w-0 cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-[#1E293B] outline-none focus:border-[#8B5CF6] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 sm:w-auto"
              >
                <option value="recommendation">
                  {t("find.sort.recommendation")}
                </option>
                <option value="price_asc">{t("find.sort.priceAsc")}</option>
                <option value="price_desc">{t("find.sort.priceDesc")}</option>
                <option value="popularity">{t("find.sort.popularity")}</option>
                <option value="reviews">{t("find.sort.reviews")}</option>
                <option value="rating">{t("find.sort.rating")}</option>
              </select>
            </label>
          </div>

          {tutorsLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
            </div>
          ) : filteredTutors.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="font-semibold text-slate-500 dark:text-zinc-400">
                {t("find.noResults")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filteredTutors.map((tutor) => (
                <article
                  key={tutor.id}
                  className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white transition-all duration-300 hover:border-violet-200 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-violet-900 dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:flex-row"
                >
                  <Link
                    href={`/tutors/${tutor.id}`}
                    className="absolute inset-0 z-0 rounded-[2rem]"
                    aria-label={tutor.displayName}
                  />

                  <div className="pointer-events-none relative flex h-52 w-full shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] sm:h-auto sm:w-56 md:w-64">
                    <span className="text-5xl font-black text-white/90">
                      {tutor.displayName.charAt(0)}
                    </span>
                    <div className="absolute left-5 top-5 flex items-center gap-2 rounded-2xl border border-slate-100/80 bg-white px-4 py-2 text-sm font-black text-[#1E293B] shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                      <Star className="h-4 w-4 fill-[#8B5CF6] text-[#8B5CF6]" />
                      {tutor.rating.toFixed(1)}
                    </div>
                  </div>

                  <div className="pointer-events-none relative flex min-w-0 flex-1 flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-7">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <h3 className="text-2xl font-black leading-none text-[#1E293B] transition group-hover:text-[#8B5CF6] dark:text-zinc-100">
                          {tutor.displayName}
                        </h3>
                        {tutor.verified && (
                          <CheckCircle className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
                        )}
                      </div>
                      <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-[#8B5CF6]">
                        {tutor.subject}
                      </p>
                      <p className="mb-4 text-xs font-semibold text-slate-400 dark:text-zinc-500">
                        {t("find.reviews", { count: tutor.reviews })}
                      </p>

                      <p className="line-clamp-2 text-sm font-semibold leading-relaxed text-slate-400 dark:text-zinc-500">
                        {tutor.bio}
                      </p>
                    </div>

                    <div className="relative z-10 flex shrink-0 flex-col items-stretch gap-4 sm:w-44 sm:items-end">
                      <div className="text-left sm:text-right">
                        <p className="text-3xl font-black text-[#1E293B] dark:text-zinc-100">
                          {formatTenge(tutorHourlyRateTenge(tutor.defaultHourlyRateCents))}
                          <span className="ml-1 text-sm font-bold text-slate-400 dark:text-zinc-500">
                            {t("find.perHour")}
                          </span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isLoggedIn()) {
                            router.push("/login")
                            return
                          }
                          router.push(`/tutors/${tutor.id}`)
                        }}
                        className="pointer-events-auto rounded-[1.25rem] bg-[#F1F5F9] px-6 py-4 text-sm font-black text-[#1E293B] shadow-sm transition-all hover:bg-[#8B5CF6] hover:text-white active:scale-95 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-[#8B5CF6]"
                      >
                        {t("find.bookSession")}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
