"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type AvailabilitySlot } from "@/lib/api-client"

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

type TutorAvailabilitySlotsProps = {
  tutorId: string
  selectedSlotId?: string | null
  onSelectSlot?: (slot: AvailabilitySlot | null) => void
}

export function TutorAvailabilitySlots({
  tutorId,
  selectedSlotId,
  onSelectSlot,
}: TutorAvailabilitySlotsProps) {
  const { t, locale } = useTranslations()
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDayKey, setSelectedDayKey] = useState<number | null>(null)
  const [internalSlotId, setInternalSlotId] = useState<string | null>(selectedSlotId ?? null)

  const activeSlotId = selectedSlotId ?? internalSlotId

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

  const selectedDaySlots =
    selectedDayKey != null ? (slotsByDay.get(selectedDayKey) ?? []) : []

  useEffect(() => {
    setLoading(true)
    api.tutors
      .slots(tutorId)
      .then((data) => {
        setSlots(data)
        if (data.length > 0) {
          const firstDay = startOfDay(new Date(data[0].startsAt)).getTime()
          setSelectedDayKey(firstDay)
          const initial = selectedSlotId ?? data[0].id
          setInternalSlotId(initial)
          onSelectSlot?.(data.find((slot) => slot.id === initial) ?? data[0])
        } else {
          onSelectSlot?.(null)
        }
      })
      .catch(() => {
        setSlots([])
        onSelectSlot?.(null)
      })
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorId])

  useEffect(() => {
    if (selectedSlotId != null) {
      setInternalSlotId(selectedSlotId)
      const slot = slots.find((item) => item.id === selectedSlotId)
      if (slot) {
        setSelectedDayKey(startOfDay(new Date(slot.startsAt)).getTime())
      }
    }
  }, [selectedSlotId, slots])

  const selectSlot = (slot: AvailabilitySlot) => {
    setInternalSlotId(slot.id)
    setSelectedDayKey(startOfDay(new Date(slot.startsAt)).getTime())
    onSelectSlot?.(slot)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-4 py-8 text-center">
        <Calendar className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-muted)]">{t("booking.noSlots")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          {t("tutorProfile.selectDate")}
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                  if (daySlots[0]) selectSlot(daySlots[0])
                }}
                className={`min-w-[5.5rem] shrink-0 rounded-xl border px-3 py-2.5 text-center transition ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                <p className="text-[11px] font-semibold uppercase opacity-80">{weekday}</p>
                <p className="text-sm font-bold">{monthDay}</p>
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
          {t("tutorProfile.selectTime")}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {selectedDaySlots.map((slot) => {
            const active = activeSlotId === slot.id
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => selectSlot(slot)}
                className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {formatTimeLabel(slot.startsAt, locale)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
