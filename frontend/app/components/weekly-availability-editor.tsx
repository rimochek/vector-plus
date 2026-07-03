"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { api } from "@/lib/api-client"
import { useToast } from "@/lib/toast-context"
import { normalizeTimeString, resolveAvailabilityTimeZone } from "@/lib/time-utils"

/** Monday-first display order; values are JS Date.getDay(). */
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const

type DayOfWeek = (typeof DAY_ORDER)[number]

type LocalSlot = {
  localId: string
  startTime: string
  endTime: string
}

type WeekSchedule = Record<DayOfWeek, LocalSlot[]>

function emptySchedule(): WeekSchedule {
  return { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] }
}

function newSlot(start = "09:00", end = "17:00"): LocalSlot {
  return {
    localId: crypto.randomUUID(),
    startTime: start,
    endTime: end,
  }
}

function dayLabelKey(day: DayOfWeek): MessageId {
  const keys: Record<DayOfWeek, MessageId> = {
    0: "avail.day.sun",
    1: "avail.day.mon",
    2: "avail.day.tue",
    3: "avail.day.wed",
    4: "avail.day.thu",
    5: "avail.day.fri",
    6: "avail.day.sat",
  }
  return keys[day]
}

function formatTime12(value: string): string {
  const [hStr, mStr] = value.split(":")
  const h = Number(hStr)
  const m = Number(mStr)
  if (Number.isNaN(h) || Number.isNaN(m)) return value
  const period = h >= 12 ? "pm" : "am"
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${m.toString().padStart(2, "0")}${period}`
}

function validateDaySlots(slots: LocalSlot[]): string | null {
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))
  for (const slot of sorted) {
    if (slot.endTime <= slot.startTime) {
      return "invalidRange"
    }
  }
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].startTime < sorted[i - 1].endTime) {
      return "overlap"
    }
  }
  return null
}

export function WeeklyAvailabilityEditor({
  onDirtyChange,
}: {
  onDirtyChange?: (dirty: boolean) => void
}) {
  const { t } = useTranslations()
  const toast = useToast()
  const [schedule, setSchedule] = useState<WeekSchedule>(emptySchedule)
  const [timezone, setTimezone] = useState(() => resolveAvailabilityTimeZone())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [copySourceDay, setCopySourceDay] = useState<DayOfWeek | null>(null)
  const [copyTargets, setCopyTargets] = useState<Set<DayOfWeek>>(new Set())
  const popoverRef = useRef<HTMLDivElement>(null)

  const markDirty = () => setIsDirty(true)

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isDirty])

  const loadSchedule = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.availability.getWeeklySchedule()
      setTimezone(resolveAvailabilityTimeZone(data.timezone))
      const next = emptySchedule()
      for (const day of data.schedule) {
        const d = day.dayOfWeek as DayOfWeek
        next[d] = day.slots.map((slot) => ({
          localId: crypto.randomUUID(),
          startTime: normalizeTimeString(slot.startTime),
          endTime: normalizeTimeString(slot.endTime),
        }))
      }
      setSchedule(next)
      setIsDirty(false)
    } catch {
      toast.error(t("avail.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t, toast])

  useEffect(() => {
    loadSchedule()
  }, [loadSchedule])

  useEffect(() => {
    if (copySourceDay == null) return

    const handleClick = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setCopySourceDay(null)
        setCopyTargets(new Set())
      }
    }

    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [copySourceDay])

  const updateDay = (day: DayOfWeek, updater: (slots: LocalSlot[]) => LocalSlot[]) => {
    setSchedule((prev) => ({ ...prev, [day]: updater(prev[day]) }))
    markDirty()
  }

  const addSlot = (day: DayOfWeek) => {
    updateDay(day, (slots) => [...slots, newSlot()])
  }

  const removeSlot = (day: DayOfWeek, localId: string) => {
    updateDay(day, (slots) => slots.filter((s) => s.localId !== localId))
  }

  const patchSlot = (
    day: DayOfWeek,
    localId: string,
    patch: Partial<Pick<LocalSlot, "startTime" | "endTime">>,
  ) => {
    updateDay(day, (slots) =>
      slots.map((s) => (s.localId === localId ? { ...s, ...patch } : s)),
    )
  }

  const openCopy = (day: DayOfWeek) => {
    setCopySourceDay(day)
    setCopyTargets(new Set())
  }

  const toggleCopyTarget = (day: DayOfWeek) => {
    setCopyTargets((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  const applyCopy = () => {
    if (copySourceDay == null) return
    const sourceSlots = schedule[copySourceDay].map((s) => ({
      ...s,
      localId: crypto.randomUUID(),
    }))
    setSchedule((prev) => {
      const next = { ...prev }
      for (const day of copyTargets) {
        next[day] = sourceSlots.map((s) => ({
          ...s,
          localId: crypto.randomUUID(),
        }))
      }
      return next
    })
    setCopySourceDay(null)
    setCopyTargets(new Set())
    markDirty()
  }

  const handleSave = async () => {
    for (const day of DAY_ORDER) {
      const issue = validateDaySlots(schedule[day])
      if (issue === "invalidRange") {
        toast.error(t("avail.invalidRange"))
        return
      }
      if (issue === "overlap") {
        toast.error(t("avail.overlap"))
        return
      }
    }

    setSaving(true)
    try {
      await api.availability.saveWeeklySchedule({
        timezone,
        weeksAhead: 8,
        schedule: DAY_ORDER.map((dayOfWeek) => ({
          dayOfWeek,
          slots: schedule[dayOfWeek].map(({ startTime, endTime }) => ({
            startTime,
            endTime,
          })),
        })),
      })
      setIsDirty(false)
      toast.success(t("avail.saved"))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("avail.saveError"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-from)]" />
      </div>
    )
  }

  return (
    <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-[var(--border)] dark:bg-[var(--bg)] sm:p-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            {t("avail.weeklyTitle")}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[var(--text-muted)]">
            {t("avail.weeklySubtitle")}
          </p>
        </div>
        <p className="text-xs font-semibold text-slate-400">
          {t("avail.timezone")}: {timezone}
        </p>
      </div>

      <div className="space-y-0 divide-y divide-slate-100 dark:divide-zinc-800">
        {DAY_ORDER.map((day) => (
          <div
            key={day}
            className="grid grid-cols-1 gap-4 py-5 sm:grid-cols-[4.5rem_1fr_auto] sm:items-start sm:gap-6"
          >
            <p className="pt-2 text-sm font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              {t(dayLabelKey(day))}
            </p>

            <div className="min-w-0 space-y-3">
              {schedule[day].length === 0 ? (
                <p className="py-2 text-sm font-semibold text-[var(--text-muted)]">
                  {t("avail.unavailable")}
                </p>
              ) : (
                schedule[day].map((slot) => (
                  <div
                    key={slot.localId}
                    className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                  >
                    <label className="sr-only" htmlFor={`${day}-${slot.localId}-start`}>
                      {t("avail.startTime")}
                    </label>
                    <input
                      id={`${day}-${slot.localId}-start`}
                      type="time"
                      value={slot.startTime}
                      onChange={(e) =>
                        patchSlot(day, slot.localId, { startTime: e.target.value })
                      }
                      className="w-full min-w-[7.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-from)] dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text-primary)] sm:w-auto"
                    />
                    <span className="hidden text-slate-300 sm:inline">–</span>
                    <span className="text-xs font-semibold text-slate-400 sm:hidden">
                      {formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}
                    </span>
                    <label className="sr-only" htmlFor={`${day}-${slot.localId}-end`}>
                      {t("avail.endTime")}
                    </label>
                    <input
                      id={`${day}-${slot.localId}-end`}
                      type="time"
                      value={slot.endTime}
                      onChange={(e) =>
                        patchSlot(day, slot.localId, { endTime: e.target.value })
                      }
                      className="w-full min-w-[7.5rem] rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-[var(--text-primary)] outline-none focus:border-[var(--primary-from)] dark:border-[var(--border)] dark:bg-[var(--surface)] dark:text-[var(--text-primary)] sm:w-auto"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(day, slot.localId)}
                      aria-label={t("avail.removeSlot")}
                      className="rounded-xl p-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="relative flex items-center gap-1 sm:justify-end">
              <button
                type="button"
                onClick={() => addSlot(day)}
                aria-label={t("avail.addSlot")}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-[var(--primary-from)] dark:border-[var(--border)] dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openCopy(day)}
                aria-label={t("avail.copyHours")}
                className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:border-violet-200 hover:bg-violet-50 hover:text-[var(--primary-from)] dark:border-[var(--border)] dark:hover:border-violet-800 dark:hover:bg-violet-950/30"
              >
                <Copy className="h-4 w-4" />
              </button>

              {copySourceDay === day && (
                <div
                  ref={popoverRef}
                  className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl dark:border-[var(--border)] dark:bg-[var(--surface)]"
                >
                  <p className="mb-3 text-sm font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                    {t("avail.copyTo")}
                  </p>
                  <div className="mb-4 max-h-48 space-y-2 overflow-y-auto">
                    {DAY_ORDER.filter((d) => d !== day).map((targetDay) => (
                      <label
                        key={targetDay}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-[var(--chip)]"
                      >
                        <input
                          type="checkbox"
                          checked={copyTargets.has(targetDay)}
                          onChange={() => toggleCopyTarget(targetDay)}
                          className="h-4 w-4 rounded border-slate-300 text-[var(--primary-from)] focus:ring-[var(--primary-from)]"
                        />
                        <span className="text-sm font-semibold text-slate-600 dark:text-zinc-300">
                          {t(dayLabelKey(targetDay))}
                        </span>
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={copyTargets.size === 0}
                    onClick={applyCopy}
                    className="w-full rounded-xl bg-black py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                  >
                    {t("avail.applyCopy")}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6 dark:border-[var(--border)] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-400">
          {isDirty ? t("avail.unsavedHint") : t("avail.saved")}
        </p>
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary-from)] px-8 py-3.5 text-sm font-black uppercase tracking-widest text-white transition hover:bg-violet-600 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("avail.saving")}
            </>
          ) : (
            <>
              {!isDirty && <Check className="h-4 w-4" />}
              {t("avail.save")}
            </>
          )}
        </button>
      </div>
    </section>
  )
}
