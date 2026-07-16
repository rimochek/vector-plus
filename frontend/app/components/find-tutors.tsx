"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { BudgetRangeSlider } from "@/app/components/budget-range-slider"
import { TutorCard } from "@/app/components/tutor-card"
import { Container } from "@/app/components/ui/container"
import { StickySidebar } from "@/app/components/ui/sticky-sidebar"
import { Chip } from "@/app/components/ui/chip"
import { Button } from "@/app/components/ui/button"
import { EmptyState } from "@/app/components/ui/empty-state"
import { TutorCardSkeleton } from "@/app/components/ui/skeleton"
import {
  DISCIPLINE_SUBJECTS,
  EXAM_IDS,
  LANGUAGE_IDS,
  TUTORS_PRICE_PRESET,
  disciplineLabelId,
  topicLabelId,
  tutorMatchesTopic,
  type LearningTopicId,
  type TutorSortOption,
} from "@/app/components/tutors-data"
import { getStoredUser, refreshCurrentUser, type StoredUser } from "@/lib/auth-client"
import { api, type ApiTutor } from "@/lib/api-client"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import {
  getStudentTutorFilterPrefs,
  type StudentTutorFilterPrefs,
} from "@/lib/student-preferences"

const TEACHING_FORMAT_IDS = ["online", "inPerson", "hybrid"] as const
type TeachingFormatId = (typeof TEACHING_FORMAT_IDS)[number]

function formatLabelId(id: TeachingFormatId): MessageId {
  return `find.format.${id}` as MessageId
}

const DEFAULT_FILTER_PREFS: StudentTutorFilterPrefs = {
  priceMin: TUTORS_PRICE_PRESET.defaultMin,
  priceMax: TUTORS_PRICE_PRESET.defaultMax,
  topics: [],
  searchHint: "",
}

function FilterPanel({
  subject,
  setSubject,
  selectedTopics,
  toggleTopic,
  selectedFormats,
  toggleFormat,
  priceMin,
  priceMax,
  setPriceMin,
  setPriceMax,
  clearFilters,
  t,
}: {
  subject: string
  setSubject: (v: string) => void
  selectedTopics: LearningTopicId[]
  toggleTopic: (id: LearningTopicId) => void
  selectedFormats: TeachingFormatId[]
  toggleFormat: (id: TeachingFormatId) => void
  priceMin: number
  priceMax: number
  setPriceMin: (v: number) => void
  setPriceMax: (v: number) => void
  clearFilters: () => void
  t: (id: MessageId, params?: Record<string, string | number>) => string
}) {
  return (
    <div className="tutora-card space-y-6 p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-[var(--primary-to)]" />
          <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-primary)]">
            {t("find.filtersTitle")}
          </h3>
        </div>
        <button
          type="button"
          onClick={clearFilters}
          className="text-xs font-semibold text-[var(--primary-to)] hover:underline"
        >
          {t("find.clearFilters")}
        </button>
      </div>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t("find.disciplinesLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {DISCIPLINE_SUBJECTS.map((value) => (
            <Chip
              key={value}
              selected={subject === value}
              onClick={() => setSubject(value)}
            >
              {t(disciplineLabelId(value))}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t("find.languagesLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {LANGUAGE_IDS.map((id) => (
            <Chip
              key={id}
              selected={selectedTopics.includes(id)}
              onClick={() => toggleTopic(id)}
            >
              {t(topicLabelId(id))}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t("find.examsLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {EXAM_IDS.map((id) => (
            <Chip
              key={id}
              selected={selectedTopics.includes(id)}
              onClick={() => toggleTopic(id)}
            >
              {t(topicLabelId(id))}
            </Chip>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
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
      </section>

      {/* Availability-by-time filter hidden for closed beta: weekly rules lack reliable cross-timezone matching. */}

      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {t("find.formatLabel")}
        </p>
        <div className="flex flex-wrap gap-2">
          {TEACHING_FORMAT_IDS.map((id) => (
            <Chip
              key={id}
              selected={selectedFormats.includes(id)}
              onClick={() => toggleFormat(id)}
            >
              {t(formatLabelId(id))}
            </Chip>
          ))}
        </div>
      </section>
    </div>
  )
}

export const FindTutors = () => {
  const { t } = useTranslations()
  const savedPrefsRef = useRef(DEFAULT_FILTER_PREFS)
  const [apiTutors, setApiTutors] = useState<ApiTutor[]>([])
  const [tutorsLoading, setTutorsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [subject, setSubject] = useState<string>("All")
  const [selectedTopics, setSelectedTopics] = useState<LearningTopicId[]>([])
  const [selectedFormats, setSelectedFormats] = useState<TeachingFormatId[]>([])
  const [priceMin, setPriceMin] = useState<number>(TUTORS_PRICE_PRESET.defaultMin)
  const [priceMax, setPriceMax] = useState<number>(TUTORS_PRICE_PRESET.defaultMax)
  const [sort, setSort] = useState<TutorSortOption>("recommendation")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    const user = getStoredUser()
    const formatsQuery =
      selectedFormats.length > 0 ? selectedFormats.join(",") : undefined
    setTutorsLoading(true)
    api.tutors
      .list(formatsQuery)
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
  }, [selectedFormats])

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
    }
    loadPreferences()
  }, [])

  const toggleTopic = (id: LearningTopicId) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleFormat = (id: TeachingFormatId) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const clearFilters = () => {
    const prefs = savedPrefsRef.current
    setSearch("")
    setSubject("All")
    setSelectedTopics(prefs.topics)
    setSelectedFormats([])
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
        tutor.education ?? "",
      ]
        .join(" ")
        .toLowerCase()
      const matchesSearch = !query || haystack.includes(query)
      const matchesSubject = subject === "All" || tutor.subject === subject
      const matchesTopics =
        selectedTopics.length === 0 ||
        selectedTopics.some((topic) => tutorMatchesTopic(tutor.tags, topic))
      const tutorPrice = tutorHourlyRateTenge(tutor.defaultHourlyRateCents)
      const matchesPrice =
        tutorPrice >= priceMin && tutorPrice <= priceMax
      return matchesSearch && matchesSubject && matchesTopics && matchesPrice
    })

    const sorted = [...filtered]
    switch (sort) {
      case "price_asc":
        sorted.sort(
          (a, b) => a.defaultHourlyRateCents - b.defaultHourlyRateCents,
        )
        break
      case "price_desc":
        sorted.sort(
          (a, b) => b.defaultHourlyRateCents - a.defaultHourlyRateCents,
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
      default:
        sorted.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
    }
    return sorted
  }, [apiTutors, search, subject, selectedTopics, priceMin, priceMax, sort])

  const filterProps = {
    subject,
    setSubject,
    selectedTopics,
    toggleTopic,
    selectedFormats,
    toggleFormat,
    priceMin,
    priceMax,
    setPriceMin,
    setPriceMax,
    clearFilters,
    t,
  }

  return (
    <div className="pb-16">
      <Container size="search" className="pt-6 sm:pt-8">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {t("find.title")}
            </h1>
            <p className="max-w-2xl text-base text-[var(--text-muted)]">
              {t("find.subtitle")}
            </p>
          </div>
          <p className="hidden text-sm font-semibold text-[var(--text-muted)] lg:block">
            {t("find.resultsCount", { count: filteredTutors.length })}
          </p>
        </div>
      </Container>

      <div className="sticky top-[72px] z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--bg)]/90">
        <Container size="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder={t("find.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tutora-glass-input h-16 w-full pl-14 pr-5 text-base text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary-to)] focus:ring-2 focus:ring-[var(--glow)]"
            />
          </div>
        </Container>
      </div>

      <Container size="search" className="pt-6">
        <div className="mb-4 flex items-center justify-between lg:hidden">
          <p className="text-sm font-medium text-[var(--text-muted)]">
            {t("find.resultsCount", { count: filteredTutors.length })}
          </p>
          <Button
            variant="secondary"
            className="gap-2 py-2.5"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            {t("find.filtersTitle")}
          </Button>
        </div>

        <div className="flex flex-col items-stretch gap-8 lg:flex-row lg:gap-8">
          <StickySidebar
            mode="classic"
            className="w-full lg:w-[300px]"
            top={72}
            inset={96}
            panelClassName="z-20"
          >
            <FilterPanel {...filterProps} />
          </StickySidebar>

          <div className="min-w-0 flex-1">
            <div className="mb-6 hidden items-center justify-between gap-4 lg:flex">
              <p className="text-sm font-medium text-[var(--text-muted)]">
                {t("find.resultsCount", { count: filteredTutors.length })}
              </p>
              <label className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("find.sortLabel")}
                </span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as TutorSortOption)}
                  className="tutora-glass-input cursor-pointer px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] outline-none"
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
              <div className="flex flex-col gap-5" aria-busy="true">
                {Array.from({ length: 4 }).map((_, i) => (
                  <TutorCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-8 py-12">
                <EmptyState
                  icon={Sparkles}
                  title={t("find.noResultsTitle")}
                  description={t("find.noResults")}
                  action={{ label: t("find.clearFilters"), onClick: clearFilters }}
                />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {filteredTutors.map((tutor) => (
                  <TutorCard key={tutor.id} tutor={tutor} />
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>

      <AnimatePresence>
        {mobileFiltersOpen && (
        <motion.div
          className="fixed inset-0 z-[100] lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label={t("find.closeFilters")}
            onClick={() => setMobileFiltersOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 flex max-h-[88dvh] flex-col rounded-t-[24px] border-t border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 34 }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
              <h3 className="font-bold text-[var(--text-primary)]">
                {t("find.filtersTitle")}
              </h3>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--chip)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto p-4">
              <FilterPanel {...filterProps} />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] p-4">
              <Button variant="secondary" onClick={clearFilters}>
                {t("find.clearFilters")}
              </Button>
              <Button
                variant="primary"
                onClick={() => setMobileFiltersOpen(false)}
              >
                {t("find.applyFilters")}
              </Button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
