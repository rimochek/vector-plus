"use client"

import { useEffect, useMemo, useState } from "react"
import { X, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type AvailabilitySlot, type ApiTutor } from "@/lib/api-client"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import { useToast } from "@/lib/toast-context"

type BookingModalProps = {
  tutor: ApiTutor
  open: boolean
  onClose: () => void
  onBooked?: () => void
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function formatSlotTime(iso: string): string {
  const date = new Date(iso)
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")
  return `${hours}:${minutes}`
}

function formatDayHeader(date: Date, locale: string): { weekday: string; dayNum: string } {
  const weekday = date
    .toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", { weekday: "short" })
    .replace(".", "")
    .slice(0, 3)
    .toUpperCase()
  return { weekday, dayNum: String(date.getDate()) }
}

export function BookingModal({ tutor, open, onClose, onBooked }: BookingModalProps) {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const { displayDays, slotsByDay } = useMemo(() => {
    const byDay = new Map<number, AvailabilitySlot[]>()

    for (const slot of slots) {
      const day = startOfDay(new Date(slot.startsAt))
      const key = day.getTime()
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
    if (!open) return
    setLoading(true)
    setSuccess(false)
    setSelectedSlotId(null)
    setMessage("")
    api.tutors
      .slots(tutor.id)
      .then((data) => {
        setSlots(data)
        if (data.length === 0) {
          toast.warning(t("booking.noSlots"))
        }
      })
      .catch(() => toast.error(t("booking.loadError")))
      .finally(() => setLoading(false))
  }, [open, tutor.id, t, toast])

  if (!open) return null

  const handleBook = async () => {
    if (!selectedSlotId) return
    setSubmitting(true)
    try {
      await api.bookings.create(selectedSlotId, message || undefined)
      setSuccess(true)
      toast.success(t("booking.requestSent"))
      onBooked?.()
      setTimeout(onClose, 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label={t("booking.close")}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-2xl dark:border-[var(--border)] dark:bg-[var(--bg)]">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-[var(--border)] sm:px-8">
          <div>
            <h3 className="text-2xl font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              {t("booking.calendarTitle")}
            </h3>
            <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
              {tutor.displayName} · {formatTenge(tutorHourlyRateTenge(tutor.defaultHourlyRateCents))}
              {t("find.perHour")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--chip)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {success ? (
            <p className="rounded-2xl bg-violet-50 p-8 text-center font-bold text-[var(--primary-from)] dark:bg-violet-950/40">
              {t("booking.requestSent")}
            </p>
          ) : loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-from)]" />
            </div>
          ) : slots.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center font-semibold text-slate-400 dark:border-[var(--border)]">
              {t("booking.noSlots")}
            </p>
          ) : (
            <>
              <p className="mb-4 text-sm font-semibold text-[var(--text-muted)]">
                {t("booking.selectSlot")}
              </p>
              <div className="overflow-x-auto pb-2">
                <div
                  className="inline-grid min-w-full gap-2 sm:gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${displayDays.length}, minmax(4.5rem, 1fr))`,
                  }}
                >
                  {displayDays.map((day) => {
                    const { weekday, dayNum } = formatDayHeader(day, locale)
                    const daySlots = slotsByDay.get(startOfDay(day).getTime()) ?? []

                    return (
                      <div key={day.toISOString()} className="min-w-[4.5rem]">
                        <div className="mb-3 text-center">
                          <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            {weekday}
                          </p>
                          <p className="text-2xl font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                            {dayNum}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {daySlots.map((slot) => {
                            const isSelected = slot.id === selectedSlotId

                            return (
                              <button
                                key={slot.id}
                                type="button"
                                onClick={() => setSelectedSlotId(slot.id)}
                                className={`rounded-md border px-1 py-2 text-center text-[11px] font-bold transition ${
                                  isSelected
                                    ? "border-[var(--primary-from)] bg-[var(--primary-from)] text-white shadow-md shadow-violet-200 dark:shadow-violet-950/40"
                                    : "border-slate-200 bg-white text-[#2563EB] hover:border-[var(--primary-from)] hover:bg-violet-50 dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-blue-400 dark:hover:bg-violet-950/30"
                                }`}
                              >
                                {formatSlotTime(slot.startsAt)}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {!success && !loading && slots.length > 0 && (
          <div className="shrink-0 space-y-4 border-t border-slate-100 px-6 py-5 dark:border-[var(--border)] sm:px-8">
            <label className="block">
              <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                {t("booking.messageLabel")}
              </span>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder={t("booking.messagePlaceholder")}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-[var(--primary-from)] dark:border-[var(--border)] dark:bg-[var(--surface)]"
              />
            </label>
            <button
              type="button"
              disabled={!selectedSlotId || submitting}
              onClick={handleBook}
              className="w-full rounded-2xl bg-[var(--primary-from)] py-4 text-sm font-black uppercase tracking-widest text-white transition hover:bg-violet-600 disabled:opacity-50"
            >
              {submitting ? t("booking.submitting") : t("booking.confirm")}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
