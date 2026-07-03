"use client"

import { useEffect, useState } from "react"
import { Loader2, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import type { CancelBookingReason } from "@/lib/api-client"

const STUDENT_REASONS: { id: CancelBookingReason; labelKey: MessageId }[] = [
  { id: "family", labelKey: "cancel.reason.family" },
  { id: "cant_at_time", labelKey: "cancel.reason.cantAtTime" },
  { id: "found_another", labelKey: "cancel.reason.foundAnother" },
  { id: "other", labelKey: "cancel.reason.other" },
]

const TUTOR_REASONS: { id: CancelBookingReason; labelKey: MessageId }[] = [
  { id: "family", labelKey: "cancel.reason.tutor.family" },
  { id: "cant_at_time", labelKey: "cancel.reason.tutor.cantAtTime" },
  { id: "schedule_conflict", labelKey: "cancel.reason.tutor.scheduleConflict" },
  { id: "other", labelKey: "cancel.reason.other" },
]

type CancelLessonModalProps = {
  open: boolean
  onClose: () => void
  onConfirm: (reason: CancelBookingReason, otherText?: string) => Promise<void>
  variant?: "student" | "tutor"
}

export function CancelLessonModal({
  open,
  onClose,
  onConfirm,
  variant = "student",
}: CancelLessonModalProps) {
  const { t } = useTranslations()
  const reasons = variant === "tutor" ? TUTOR_REASONS : STUDENT_REASONS
  const [reason, setReason] = useState<CancelBookingReason>(reasons[0].id)
  const [otherText, setOtherText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setReason(reasons[0].id)
      setOtherText("")
    }
  }, [open, variant, reasons])

  if (!open) return null

  const handleConfirm = async () => {
    if (reason === "other" && !otherText.trim()) return
    setSubmitting(true)
    try {
      await onConfirm(reason, reason === "other" ? otherText.trim() : undefined)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label={t("booking.close")}
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl dark:border-[var(--border)] dark:bg-[var(--bg)]">
        <div className="mb-6 flex items-start justify-between gap-4">
          <h3 className="text-xl font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
            {t("cancel.title")}
          </h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[var(--chip)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-4 text-sm font-semibold text-slate-500 dark:text-[var(--text-muted)]">
          {t(variant === "tutor" ? "cancel.subtitleTutor" : "cancel.subtitle")}
        </p>

        <div className="space-y-2">
          {reasons.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                reason === item.id
                  ? "border-[var(--primary-from)] bg-violet-50 dark:bg-violet-950/30"
                  : "border-slate-200 dark:border-[var(--border)]"
              }`}
            >
              <input
                type="radio"
                name="cancel-reason"
                checked={reason === item.id}
                onChange={() => setReason(item.id)}
                className="accent-[var(--primary-from)]"
              />
              <span className="text-sm font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                {t(item.labelKey)}
              </span>
            </label>
          ))}
        </div>

        {reason === "other" && (
          <textarea
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            rows={3}
            placeholder={t("cancel.otherPlaceholder")}
            className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-[var(--primary-from)] dark:border-[var(--border)] dark:bg-[var(--surface)]"
          />
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-black uppercase tracking-widest text-slate-500 dark:border-[var(--border)]"
          >
            {t("booking.close")}
          </button>
          <button
            type="button"
            disabled={submitting || (reason === "other" && !otherText.trim())}
            onClick={handleConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("cancel.confirm")}
          </button>
        </div>
      </div>
    </div>
  )
}
