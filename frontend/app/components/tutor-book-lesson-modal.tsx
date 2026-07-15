"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, Calendar, Loader2, Send, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { api, type ApiTutor, type AvailabilitySlot } from "@/lib/api-client"
import {
  EXAM_IDS,
  LANGUAGE_IDS,
  LEARNING_TOPIC_IDS,
  LEGACY_TOPIC_IDS,
  topicLabelId,
} from "@/app/components/tutors-data"
import { getStoredUser, isLoggedIn } from "@/lib/auth-client"
import { Button } from "@/app/components/ui/button"
import { Chip } from "@/app/components/ui/chip"

type LeadContactType = "TELEGRAM" | "PHONE"
type Step = "time" | "subject" | "contact"

type TutorBookLessonModalProps = {
  open: boolean
  onClose: () => void
  tutor: ApiTutor
  initialSlotId?: string | null
  existingBookingId?: string | null
  onBooked?: () => void
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

function formatSlotLabel(slot: AvailabilitySlot, locale: string) {
  const start = new Date(slot.startsAt)
  const localeId = locale === "ru" ? "ru-RU" : "en-US"
  const datePart = start.toLocaleDateString(localeId, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const timePart = `${formatTimeLabel(slot.startsAt, locale)} – ${formatTimeLabel(slot.endsAt, locale)}`
  return `${datePart} · ${timePart}`
}

function subjectLabelId(id: string): MessageId | null {
  if (
    LEARNING_TOPIC_IDS.includes(id as (typeof LEARNING_TOPIC_IDS)[number]) ||
    LEGACY_TOPIC_IDS.includes(id as (typeof LEGACY_TOPIC_IDS)[number]) ||
    LANGUAGE_IDS.includes(id as (typeof LANGUAGE_IDS)[number]) ||
    EXAM_IDS.includes(id as (typeof EXAM_IDS)[number])
  ) {
    return topicLabelId(id)
  }
  return null
}

export function TutorBookLessonModal({
  open,
  onClose,
  tutor,
  initialSlotId = null,
  existingBookingId = null,
  onBooked,
}: TutorBookLessonModalProps) {
  const { t, locale } = useTranslations()
  const isReschedule = Boolean(existingBookingId)
  const isStudent =
    isLoggedIn() && (getStoredUser()?.role ?? getStoredUser()?.roles?.[0]) === "student"

  const [step, setStep] = useState<Step>("time")
  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [selectedDayKey, setSelectedDayKey] = useState<number | null>(null)
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [selectedSubject, setSelectedSubject] = useState<string>("")

  const [studentName, setStudentName] = useState("")
  const [contactType, setContactType] = useState<LeadContactType>("TELEGRAM")
  const [contactValue, setContactValue] = useState("")
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const subjectOptions = useMemo(() => {
    const fromTags = tutor.tags?.filter(Boolean) ?? []
    if (fromTags.length > 0) return fromTags
    const fromSubjects = tutor.subjects?.map((s) => s.slug || s.name).filter(Boolean) ?? []
    if (fromSubjects.length > 0) return fromSubjects
    return tutor.subject ? [tutor.subject] : []
  }, [tutor])

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

  const selectedSlot = slots.find((slot) => slot.id === selectedSlotId) ?? null
  const selectedDaySlots =
    selectedDayKey != null ? (slotsByDay.get(selectedDayKey) ?? []) : []

  useEffect(() => {
    if (!open) return
    setStep("time")
    setError(null)
    setSuccess(false)
    setConsent(false)
    setWebsite("")
    setStudentName("")
    setContactValue("")
    setMessage("")
    setContactType("TELEGRAM")
    setSelectedSubject("")
    setSelectedSlotId(null)
    setSelectedDayKey(null)

    const defaultSubject =
      tutor.tags?.[0] ??
      tutor.subjects?.[0]?.slug ??
      tutor.subjects?.[0]?.name ??
      tutor.subject ??
      ""

    setSlotsLoading(true)
    api.tutors
      .slots(tutor.id)
      .then((data) => {
        setSlots(data)
        setSelectedSubject(defaultSubject)
        if (data.length > 0) {
          const preferred = initialSlotId
            ? data.find((slot) => slot.id === initialSlotId)
            : null
          const firstSlot = preferred ?? data[0]
          const firstDay = startOfDay(new Date(firstSlot.startsAt)).getTime()
          setSelectedDayKey(firstDay)
          setSelectedSlotId(firstSlot.id)
        }
      })
      .catch(() => setError(t("booking.loadError")))
      .finally(() => setSlotsLoading(false))
  }, [open, tutor.id, tutor.tags, tutor.subjects, tutor.subject, t, initialSlotId])

  if (!open) return null

  const modalTitle = isReschedule
    ? t("tutorProfile.rescheduleLesson")
    : t("tutorProfile.bookLesson")

  const stepTitle = isReschedule
    ? t("lead.step.time")
    : step === "time"
      ? t("lead.step.time")
      : step === "subject"
        ? t("lead.step.subject")
        : t("lead.step.contact")

  const canContinueFromTime = slots.length === 0 || Boolean(selectedSlotId)
  const canContinueFromSubject = Boolean(selectedSubject.trim())

  const handleReschedule = async () => {
    if (!existingBookingId || !selectedSlotId || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await api.bookings.reschedule(
        existingBookingId,
        selectedSlotId,
        message.trim() || undefined,
      )
      onBooked?.()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("booking.error"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleStudentBook = async () => {
    if (!selectedSlotId || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await api.bookings.create(selectedSlotId, message.trim() || undefined)
      onBooked?.()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("booking.error"))
    } finally {
      setSubmitting(false)
    }
  }

  const handleLeadSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!consent || submitting) return
    setSubmitting(true)
    setError(null)

    const subjectLabel = (() => {
      const labelId = subjectLabelId(selectedSubject)
      return labelId ? t(labelId) : selectedSubject
    })()

    try {
      await api.leads.submit(tutor.id, {
        studentName: studentName.trim(),
        contactType,
        contactValue: contactValue.trim(),
        subject: subjectLabel,
        message: message.trim() || undefined,
        preferredTime: selectedSlot ? formatSlotLabel(selectedSlot, locale) : undefined,
        website,
      })
      onBooked?.()
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("lead.error.generic"))
    } finally {
      setSubmitting(false)
    }
  }

  const timeSlotPicker = (
    <>
      {slotsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-4 py-8 text-center">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-[var(--text-muted)]" />
          <p className="text-sm text-[var(--text-muted)]">{t("booking.noSlots")}</p>
          {!isReschedule && (
            <p className="mt-2 text-xs text-[var(--text-muted)]">{t("lead.noSlotsContinue")}</p>
          )}
        </div>
      ) : (
        <>
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
                      setSelectedSlotId(daySlots[0]?.id ?? null)
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
                const active = selectedSlotId === slot.id
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlotId(slot.id)}
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
        </>
      )}
    </>
  )

  return (
    <div className="fixed inset-0 z-[400] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label={t("lead.close")}
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:rounded-[2rem]">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
              {stepTitle}
            </p>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">{modalTitle}</h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{tutor.displayName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--text-muted)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isReschedule && (
          <div className="flex gap-2 px-6 pt-4">
            {(["time", "subject", "contact"] as const).map((item, index) => {
              const currentIndex = (["time", "subject", "contact"] as const).indexOf(step)
              return (
                <div
                  key={item}
                  className={`h-1 flex-1 rounded-full ${
                    index <= currentIndex ? "bg-[var(--primary)]" : "bg-[var(--border)]"
                  }`}
                />
              )
            })}
          </div>
        )}

        {success ? (
          <div className="space-y-4 px-6 py-8">
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {isReschedule
                ? t("tutorProfile.rescheduleSuccess.title")
                : t("lead.success.title")}
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {isReschedule
                ? t("tutorProfile.rescheduleSuccess.body")
                : isStudent
                  ? t("booking.requestSent")
                  : t("lead.success.body")}
            </p>
            <Button type="button" className="w-full" onClick={onClose}>
              {t("lead.close")}
            </Button>
          </div>
        ) : (
          <div className="overflow-y-auto px-6 py-5">
            {isReschedule ? (
              <div className="space-y-5">
                {timeSlotPicker}
                <div>
                  <label htmlFor="reschedule-message" className="mb-1 block text-sm font-semibold">
                    {t("lead.field.message")}{" "}
                    <span className="font-normal text-[var(--text-muted)]">
                      ({t("lead.optional")})
                    </span>
                  </label>
                  <textarea
                    id="reschedule-message"
                    rows={3}
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  />
                </div>
                {error && (
                  <p className="rounded-[var(--radius-button)] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </p>
                )}
                <Button
                  type="button"
                  className="w-full gap-2"
                  disabled={!canContinueFromTime || submitting}
                  onClick={() => void handleReschedule()}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t("tutorProfile.rescheduleLesson")}
                </Button>
              </div>
            ) : null}

            {!isReschedule && step === "time" && (
              <div className="space-y-5">
                {timeSlotPicker}
                <Button
                  type="button"
                  className="w-full"
                  disabled={!canContinueFromTime}
                  onClick={() => setStep(isStudent ? "subject" : "subject")}
                >
                  {t("lead.continue")}
                </Button>
              </div>
            )}

            {!isReschedule && step === "subject" && (
              <div className="space-y-5">
                <p className="text-sm text-[var(--text-muted)]">{t("lead.selectSubject")}</p>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map((tag) => {
                    const labelId = subjectLabelId(tag)
                    const label = labelId ? t(labelId) : tag
                    return (
                      <Chip
                        key={tag}
                        selected={selectedSubject === tag}
                        onClick={() => setSelectedSubject(tag)}
                      >
                        {label}
                      </Chip>
                    )
                  })}
                </div>
                {selectedSlot && (
                  <p className="rounded-[var(--radius-card)] bg-[var(--primary-soft)] px-3 py-2 text-sm text-[var(--primary)]">
                    {formatSlotLabel(selectedSlot, locale)}
                  </p>
                )}
                {isStudent ? (
                  <>
                    <div>
                      <label htmlFor="book-message" className="mb-1 block text-sm font-semibold">
                        {t("lead.field.message")}{" "}
                        <span className="font-normal text-[var(--text-muted)]">
                          ({t("lead.optional")})
                        </span>
                      </label>
                      <textarea
                        id="book-message"
                        rows={3}
                        maxLength={1000}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                      />
                    </div>
                    {error && (
                      <p className="rounded-[var(--radius-button)] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                        {error}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="gap-2"
                        onClick={() => setStep("time")}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        {t("lead.back")}
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 gap-2"
                        disabled={!canContinueFromSubject || submitting || !selectedSlotId}
                        onClick={() => void handleStudentBook()}
                      >
                        {submitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {t("tutorProfile.bookLesson")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => setStep("time")}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      {t("lead.back")}
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      disabled={!canContinueFromSubject}
                      onClick={() => setStep("contact")}
                    >
                      {t("lead.continue")}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!isReschedule && step === "contact" && (
              <form onSubmit={handleLeadSubmit} className="space-y-4">
                <div className="hidden" aria-hidden="true">
                  <input
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                {selectedSlot && (
                  <div className="rounded-[var(--radius-card)] border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {(() => {
                        const labelId = subjectLabelId(selectedSubject)
                        return labelId ? t(labelId) : selectedSubject
                      })()}
                    </span>
                    <span className="mx-2 text-[var(--text-muted)]">·</span>
                    {formatSlotLabel(selectedSlot, locale)}
                  </div>
                )}

                <div>
                  <label htmlFor="book-name" className="mb-1 block text-sm font-semibold">
                    {t("lead.field.name")}
                  </label>
                  <input
                    id="book-name"
                    required
                    minLength={2}
                    maxLength={80}
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-semibold">
                    {t("lead.field.contactMethod")}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["TELEGRAM", "PHONE"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setContactType(type)}
                        className={`rounded-[var(--radius-button)] border px-3 py-2 text-sm font-semibold ${
                          contactType === type
                            ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {type === "TELEGRAM" ? t("lead.telegram") : t("lead.phone")}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="book-contact" className="mb-1 block text-sm font-semibold">
                    {contactType === "TELEGRAM"
                      ? t("lead.field.telegram")
                      : t("lead.field.phone")}
                  </label>
                  <input
                    id="book-contact"
                    required
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    placeholder={contactType === "TELEGRAM" ? "@username" : "+77000000000"}
                    className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="book-message-guest" className="mb-1 block text-sm font-semibold">
                    {t("lead.field.message")}{" "}
                    <span className="font-normal text-[var(--text-muted)]">
                      ({t("lead.optional")})
                    </span>
                  </label>
                  <textarea
                    id="book-message-guest"
                    rows={3}
                    maxLength={1000}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
                  />
                </div>

                <label className="flex items-start gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{t("lead.consent")}</span>
                </label>

                {error && (
                  <p className="rounded-[var(--radius-button)] bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="gap-2"
                    onClick={() => setStep("subject")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {t("lead.back")}
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 gap-2"
                    disabled={submitting || !consent}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {t("lead.submit")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
