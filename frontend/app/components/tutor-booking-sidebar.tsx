"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  CheckCircle2,
  Heart,
  Loader2,
  MessageSquare,
  Shield,
  Sparkles,
  Video,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type ApiTutor, type AvailabilitySlot } from "@/lib/api-client"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import { cn } from "@/lib/utils"
import { isLoggedIn, getStoredUser } from "@/lib/auth-client"
import { studentSignupPath } from "@/lib/guest-auth"
import { useToast } from "@/lib/toast-context"
import { Button } from "@/app/components/ui/button"

type TutorBookingSidebarProps = {
  tutor: ApiTutor
  favorited: boolean
  favoriteLoading: boolean
  onToggleFavorite: () => void
  className?: string
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatTimeLabel(iso: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function formatDayPill(day: Date, locale: string) {
  const weekday = day
    .toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { weekday: "short" })
    .replace(".", "")
  const monthDay = day.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  })
  return { weekday, monthDay }
}

function formatNextAvailable(day: Date, locale: string) {
  const today = startOfDay(new Date())
  const target = startOfDay(day)
  const label =
    target.getTime() === today.getTime()
      ? locale === "ru"
        ? "Сегодня"
        : "Today"
      : day.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
  return label
}

export function TutorBookingSidebar({
  tutor,
  favorited,
  favoriteLoading,
  onToggleFavorite,
  className,
}: TutorBookingSidebarProps) {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const router = useRouter()
  const user = getStoredUser()
  const isStudent = (user?.role ?? user?.roles?.[0]) === "student"

  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayKey, setSelectedDayKey] = useState<number | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [messaging, setMessaging] = useState(false)

  const hourlyRate = formatTenge(tutorHourlyRateTenge(tutor.defaultHourlyRateCents))

  const { displayDays, slotsByDay } = useMemo(() => {
    const byDay = new Map<number, AvailabilitySlot[]>()

    for (const slot of slots) {
      const key = startOfDay(new Date(slot.startsAt)).getTime()
      const list = byDay.get(key) ?? []
      list.push(slot)
      byDay.set(key, list)
    }

    for (const [key, daySlots] of byDay) {
      daySlots.sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      )
      byDay.set(key, daySlots)
    }

    const days = [...byDay.keys()]
      .sort((a, b) => a - b)
      .map((key) => new Date(key))

    return { displayDays: days.slice(0, 7), slotsByDay: byDay }
  }, [slots])

  useEffect(() => {
    setLoading(true)
    api.tutors
      .slots(tutor.id)
      .then((data) => {
        setSlots(data)
        if (data.length > 0) {
          const firstDay = startOfDay(new Date(data[0].startsAt)).getTime()
          setSelectedDayKey(firstDay)
          setSelectedSlotId(data[0].id)
        }
      })
      .catch(() => toast.error(t("booking.loadError")))
      .finally(() => setLoading(false))
  }, [tutor.id, t, toast])

  const selectedDaySlots =
    selectedDayKey != null ? (slotsByDay.get(selectedDayKey) ?? []) : []

  const handleBook = async () => {
    if (!isLoggedIn()) {
      router.push(studentSignupPath(`/tutors/${tutor.id}`))
      return
    }
    if (!isStudent || !selectedSlotId) return

    setSubmitting(true)
    try {
      await api.bookings.create(selectedSlotId)
      toast.success(t("booking.requestSent"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleMessage = async () => {
    if (!isLoggedIn()) {
      router.push(studentSignupPath(`/tutors/${tutor.id}?action=message`))
      return
    }
    if (!isStudent) return

    setMessaging(true)
    try {
      await api.chat.createConversation(tutor.id)
      router.push("/dashboard?tab=chats")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("tutorProfile.messageError"))
    } finally {
      setMessaging(false)
    }
  }

  const nextAvailableDay = displayDays[0]

  return (
    <aside className={cn("min-w-0 w-full max-w-full lg:sticky lg:top-24 lg:self-start", className)}>
      <div className="min-w-0 overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)]">
        <div className="flex min-w-0 items-start justify-between gap-2 border-b border-[var(--border)] px-4 py-4 sm:gap-3 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
              {hourlyRate}
              <span className="ml-1 text-sm font-semibold text-[var(--text-muted)] sm:text-base">
                {t("tutorProfile.perLesson")}
              </span>
            </p>
          </div>
          {isStudent && (
            <button
              type="button"
              disabled={favoriteLoading}
              onClick={onToggleFavorite}
              aria-label={t("tutorProfile.save")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs font-semibold transition sm:px-3 sm:text-sm ${
                favorited
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
              }`}
            >
              <Heart className={`h-4 w-4 ${favorited ? "fill-current" : ""}`} />
              {t("tutorProfile.save")}
            </button>
          )}
        </div>

        <div className="min-w-0 space-y-5 p-4 sm:p-6">
          {nextAvailableDay && !loading && slots.length > 0 && (
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
              <Calendar className="h-4 w-4 text-[var(--primary)]" />
              {t("tutorProfile.nextAvailable", {
                date: formatNextAvailable(nextAvailableDay, locale),
              })}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-[var(--primary)]" />
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              {t("booking.noSlots")}
            </p>
          ) : (
            <>
              <div className="min-w-0">
                <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  {t("tutorProfile.selectDate")}
                </p>
                <div className="min-w-0 overflow-hidden">
                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {displayDays.map((day) => {
                    const key = startOfDay(day).getTime()
                    const { weekday, monthDay } = formatDayPill(day, locale)
                    const active = selectedDayKey === key

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setSelectedDayKey(key)
                          const daySlots = slotsByDay.get(key) ?? []
                          setSelectedSlotId(daySlots[0]?.id ?? null)
                        }}
                        className={`min-w-[5.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-center transition ${
                          active
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm"
                            : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                        }`}
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                          {weekday}
                        </p>
                        <p className="text-sm font-bold">{monthDay}</p>
                      </button>
                    )
                  })}
                  </div>
                </div>
              </div>

              <div className="min-w-0">
                <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                  {t("tutorProfile.selectTime")}
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {selectedDaySlots.map((slot) => {
                    const active = selectedSlotId === slot.id
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          active
                            ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
                        }`}
                      >
                        {formatTimeLabel(slot.startsAt, locale)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {isStudent ? (
            <div className="space-y-3 pt-1">
              <Button
                className="w-full py-3.5"
                disabled={!selectedSlotId || submitting || slots.length === 0}
                onClick={handleBook}
              >
                {submitting ? t("booking.submitting") : t("tutorProfile.bookLesson")}
              </Button>
              <Button
                variant="secondary"
                className="w-full gap-2 py-3.5"
                disabled={messaging}
                onClick={handleMessage}
              >
                <MessageSquare className="h-4 w-4" />
                {messaging ? t("tutorProfile.messaging") : t("tutorProfile.messageTutor")}
              </Button>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-[var(--border)] px-4 py-4 text-center text-sm text-[var(--text-muted)]">
              {t("tutorProfile.studentOnlyBook")}
            </p>
          )}

          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            {t("payment.directWithTutor")}
          </p>

          <div className="space-y-3 border-t border-[var(--border)] pt-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
              <Shield className="h-4 w-4 text-[var(--primary)]" />
              {t("tutorProfile.satisfactionGuarantee")}
            </div>
            <ul className="space-y-2.5 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <Video className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                {t("tutorProfile.featureOnline")}
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                {t("tutorProfile.featurePersonalized")}
              </li>
              <li className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                {t("tutorProfile.featureFlexible")}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
                {t("tutorProfile.featureSecure")}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </aside>
  )
}
