"use client"

import { useEffect, useState } from "react"
import { Loader2, Phone, Send, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api } from "@/lib/api-client"

type LeadContactType = "TELEGRAM" | "PHONE"

type TutorLeadFormModalProps = {
  open: boolean
  onClose: () => void
  tutorId: string
  defaultSubject?: string
}

export function TutorLeadFormModal({
  open,
  onClose,
  tutorId,
  defaultSubject = "",
}: TutorLeadFormModalProps) {
  const { t } = useTranslations()
  const [studentName, setStudentName] = useState("")
  const [contactType, setContactType] = useState<LeadContactType>("TELEGRAM")
  const [contactValue, setContactValue] = useState("")
  const [subject, setSubject] = useState(defaultSubject)
  const [goal, setGoal] = useState("")
  const [preferredTime, setPreferredTime] = useState("")
  const [message, setMessage] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (open) {
      setSubject(defaultSubject)
      setError(null)
      setSuccess(false)
      setConsent(false)
      setWebsite("")
    }
  }, [open, defaultSubject])

  if (!open) return null

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!consent || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await api.leads.submit(tutorId, {
        studentName: studentName.trim(),
        contactType,
        contactValue: contactValue.trim(),
        subject: subject.trim() || undefined,
        goal: goal.trim() || undefined,
        message: message.trim() || undefined,
        preferredTime: preferredTime.trim() || undefined,
        website,
      })
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("lead.error.generic"))
    } finally {
      setSubmitting(false)
    }
  }

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
            <h3 className="text-xl font-bold text-[var(--text-primary)]">
              {t("lead.title")}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{t("lead.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-[var(--text-muted)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4 px-6 py-8">
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {t("lead.success.title")}
            </p>
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
              {t("lead.success.body")}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-[var(--radius-button)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white"
            >
              {t("lead.close")}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-6 py-5">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="lead-website">Website</label>
              <input
                id="lead-website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="lead-name" className="mb-1 block text-sm font-semibold">
                {t("lead.field.name")}
              </label>
              <input
                id="lead-name"
                required
                minLength={2}
                maxLength={80}
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <span className="mb-2 block text-sm font-semibold">{t("lead.field.contactMethod")}</span>
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
              <label htmlFor="lead-contact" className="mb-1 block text-sm font-semibold">
                {contactType === "TELEGRAM" ? t("lead.field.telegram") : t("lead.field.phone")}
              </label>
              <input
                id="lead-contact"
                required
                value={contactValue}
                onChange={(e) => setContactValue(e.target.value)}
                placeholder={
                  contactType === "TELEGRAM" ? "@username" : "+77000000000"
                }
                className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="lead-subject" className="mb-1 block text-sm font-semibold">
                {t("lead.field.subject")}
              </label>
              <input
                id="lead-subject"
                maxLength={100}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="lead-goal" className="mb-1 block text-sm font-semibold">
                {t("lead.field.goal")}
              </label>
              <input
                id="lead-goal"
                maxLength={300}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="lead-time" className="mb-1 block text-sm font-semibold">
                {t("lead.field.preferredTime")}
              </label>
              <input
                id="lead-time"
                maxLength={200}
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="lead-message" className="mb-1 block text-sm font-semibold">
                {t("lead.field.message")}
              </label>
              <textarea
                id="lead-message"
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

            <button
              type="submit"
              disabled={submitting || !consent}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("lead.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
