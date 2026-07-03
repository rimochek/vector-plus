"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Clock, Loader2, Pencil } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import { api, type ApiTutor } from "@/lib/api-client"
import { ButtonLink } from "@/app/components/ui/button"

function statusMessageId(status: string | undefined): MessageId {
  switch (status) {
    case "DRAFT":
      return "tutorApp.status.draft"
    case "SUBMITTED":
      return "tutorApp.status.submitted"
    case "UNDER_REVIEW":
      return "tutorApp.status.underReview"
    case "APPROVED":
      return "tutorApp.status.approved"
    case "REJECTED":
      return "tutorApp.status.rejected"
    default:
      return "tutorApp.status.draft"
  }
}

export function TutorApplicationStatusBanner({
  onEditProfile,
}: {
  onEditProfile?: () => void
}) {
  const { t } = useTranslations()
  const [profile, setProfile] = useState<ApiTutor | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    api.tutors
      .ownProfile()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const updated = await api.tutors.submitApplication()
      setProfile(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tutorApp.submitError"))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text-muted)]">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("tutorApp.loading")}
      </div>
    )
  }

  if (!profile?.applicationStatus) return null

  const status = profile.applicationStatus
  const rejectedDocs =
    profile.verificationDocuments?.filter((doc) => doc.status === "REJECTED") ?? []

  const tone =
    status === "APPROVED"
      ? "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30"
      : status === "REJECTED"
        ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
        : status === "SUBMITTED" || status === "UNDER_REVIEW"
          ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
          : "border-[var(--border)] bg-[var(--surface)]"

  const Icon =
    status === "APPROVED"
      ? CheckCircle2
      : status === "REJECTED"
        ? AlertCircle
        : Clock

  return (
    <section
      className={`mb-6 rounded-[var(--radius-card)] border p-4 sm:p-5 ${tone}`}
      aria-live="polite"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <Icon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h2 className="font-bold text-[var(--text-primary)]">
              {t("tutorApp.title")}
            </h2>
            <p className="mt-1 text-sm font-medium">{t(statusMessageId(status))}</p>
            {status === "APPROVED" ? (
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("tutorApp.approvedHint")}
              </p>
            ) : null}
            {status === "REJECTED" && profile.applicationRejectionReason ? (
              <p className="mt-2 text-sm">
                <span className="font-semibold">{t("tutorApp.rejectionReason")}: </span>
                {profile.applicationRejectionReason}
              </p>
            ) : null}
            {rejectedDocs.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {rejectedDocs.map((doc) => (
                  <li key={doc.id ?? doc.fileName}>
                    {doc.fileName}
                    {"rejectionReason" in doc && doc.rejectionReason
                      ? `: ${doc.rejectionReason}`
                      : ""}
                  </li>
                ))}
              </ul>
            ) : null}
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(status === "DRAFT" || status === "REJECTED") && (
            <>
              {onEditProfile ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold"
                  onClick={onEditProfile}
                >
                  <Pencil className="h-4 w-4" />
                  {t("tutorApp.editProfile")}
                </button>
              ) : (
                <ButtonLink href="/tutor-dashboard?tab=profile" variant="secondary">
                  {t("tutorApp.editProfile")}
                </ButtonLink>
              )}
              <button
                type="button"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--primary-from)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                onClick={() => void handleSubmit()}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t(status === "REJECTED" ? "tutorApp.resubmit" : "tutorApp.submit")
                )}
              </button>
            </>
          )}
          {status === "APPROVED" ? (
            <ButtonLink href={`/tutors/${profile.id}`} variant="secondary">
              {t("tutorApp.viewPublicProfile")}
            </ButtonLink>
          ) : null}
        </div>
      </div>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        {t("payment.directWithTutor")}
      </p>
    </section>
  )
}
