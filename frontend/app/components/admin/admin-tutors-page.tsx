"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import { api, type AdminTutorDetail, type AdminTutorSummary } from "@/lib/api-client"
import {
  getStoredUser,
  isLoggedIn,
  refreshCurrentUser,
} from "@/lib/auth-client"
import { isAdminUser } from "@/lib/guest-auth"
import { useTranslations } from "@/lib/i18n/locale-context"
import { useToast } from "@/lib/toast-context"
import { Container } from "@/app/components/ui/container"
import { SegmentedTabs } from "@/app/components/ui/segmented-tabs"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import { EmptyState } from "@/app/components/ui/empty-state"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import {
  choiceFromLessonFormats,
  normalizeLessonFormats,
} from "@/lib/tutor-lesson-formats"

type StatusFilter = "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL"

function formatChoiceLabel(
  formats: ("online" | "offline")[],
  t: (id: "find.format.online" | "find.format.inPerson" | "find.format.hybrid") => string,
) {
  const choice = choiceFromLessonFormats(normalizeLessonFormats(formats))
  if (choice === "both") return t("find.format.hybrid")
  if (choice === "offline") return t("find.format.inPerson")
  return t("find.format.online")
}

function TutorReviewPanel({
  tutor,
  onClose,
  onUpdated,
}: {
  tutor: AdminTutorDetail
  onClose: () => void
  onUpdated: () => void
}) {
  const { t } = useTranslations()
  const toast = useToast()
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmApprove, setConfirmApprove] = useState(false)

  const handleApprove = async () => {
    if (!confirmApprove) {
      setConfirmApprove(true)
      return
    }
    setBusy("approve")
    try {
      await api.admin.approveTutor(tutor.id)
      toast.success(t("admin.approveSuccess"))
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.actionError"))
    } finally {
      setBusy(null)
      setConfirmApprove(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error(t("admin.rejectReasonRequired"))
      return
    }
    setBusy("reject")
    try {
      await api.admin.rejectTutor(tutor.id, rejectReason.trim())
      toast.success(t("admin.rejectSuccess"))
      onUpdated()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.actionError"))
    } finally {
      setBusy(null)
    }
  }

  const reviewDocument = async (
    docId: string,
    status: "VERIFIED" | "REJECTED",
    reason?: string,
  ) => {
    setBusy(`doc-${docId}`)
    try {
      await api.admin.reviewDocument(docId, status, reason)
      toast.success(t("admin.documentReviewSuccess"))
      onUpdated()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.actionError"))
    } finally {
      setBusy(null)
    }
  }

  const openDocument = async (docId: string) => {
    setBusy(`open-${docId}`)
    try {
      const { downloadUrl } = await api.admin.documentDownload(docId)
      window.open(downloadUrl, "_blank", "noopener,noreferrer")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.actionError"))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("admin.reviewTitle")}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-md)] sm:rounded-[var(--radius-panel)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              {tutor.displayName}
            </h2>
            <p className="text-sm text-[var(--text-muted)]">{tutor.email}</p>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label={t("admin.closeReview")}>
            ✕
          </Button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <section className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t("admin.headline")}
              </p>
              <p className="mt-1 text-sm">{tutor.headline ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t("admin.rate")}
              </p>
              <p className="mt-1 text-sm">
                {formatTenge(tutorHourlyRateTenge(tutor.defaultHourlyRateCents))}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {t("admin.bio")}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{tutor.bio}</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("admin.subjects")}</h3>
            <div className="flex flex-wrap gap-2">
              {(tutor.subjects.length ? tutor.subjects : tutor.tags).map((subject) => (
                <Badge key={subject}>{subject}</Badge>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-semibold">{t("admin.documents")}</h3>
            {tutor.verificationDocuments.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">{t("admin.noDocuments")}</p>
            ) : (
              <ul className="space-y-3">
                {tutor.verificationDocuments.map((doc) => (
                  <li
                    key={doc.id}
                    className="rounded-[var(--radius-card)] border border-[var(--border)] p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <p className="text-xs text-[var(--text-muted)]">{doc.documentType}</p>
                        <Badge className="mt-2">{doc.status}</Badge>
                        {doc.rejectionReason ? (
                          <p className="mt-2 text-sm text-red-600">{doc.rejectionReason}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          disabled={busy === `open-${doc.id}`}
                          onClick={() => void openDocument(doc.id)}
                        >
                          {busy === `open-${doc.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <ExternalLink className="mr-1 h-3.5 w-3.5" />
                              {t("admin.viewDocument")}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          disabled={busy === `doc-${doc.id}`}
                          onClick={() => void reviewDocument(doc.id, "VERIFIED")}
                        >
                          {t("admin.approveDocument")}
                        </Button>
                        <Button
                          variant="ghost"
                          className="px-3 py-2 text-xs text-red-600"
                          disabled={busy === `doc-${doc.id}`}
                          onClick={() => {
                            const reason = window.prompt(t("admin.documentRejectPrompt"))
                            if (reason?.trim()) void reviewDocument(doc.id, "REJECTED", reason.trim())
                          }}
                        >
                          {t("admin.rejectDocument")}
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-3 border-t border-[var(--border)] px-4 py-4 sm:px-6">
          {showRejectForm ? (
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="reject-reason">
                {t("admin.rejectReasonLabel")}
              </label>
              <textarea
                id="reject-reason"
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowRejectForm(false)}
                  disabled={busy === "reject"}
                >
                  {t("admin.cancel")}
                </Button>
                <Button
                  variant="primary"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={busy === "reject"}
                  onClick={() => void handleReject()}
                >
                  {busy === "reject" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t("admin.confirmReject")
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => setShowRejectForm(true)}
                disabled={busy === "approve"}
              >
                <XCircle className="mr-1.5 h-4 w-4" />
                {t("admin.rejectApplication")}
              </Button>
              <Button
                variant="primary"
                disabled={busy === "approve"}
                onClick={() => void handleApprove()}
              >
                {busy === "approve" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    {confirmApprove ? t("admin.confirmApprove") : t("admin.approveApplication")}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TutorApplicationRow({
  tutor,
  onReview,
  t,
}: {
  tutor: AdminTutorSummary
  onReview: () => void
  t: ReturnType<typeof useTranslations>["t"]
}) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--primary-soft)] text-lg font-bold text-[var(--primary)]">
            {tutor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tutor.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              tutor.displayName.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[var(--text-primary)]">{tutor.displayName}</h3>
            <p className="text-sm text-[var(--text-muted)]">{tutor.email}</p>
            <p className="mt-1 line-clamp-2 text-sm">{tutor.headline ?? "—"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge>{tutor.applicationStatus}</Badge>
              <Badge>{tutor.verificationStatus}</Badge>
              {tutor.subjects.slice(0, 3).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {formatChoiceLabel(tutor.lessonFormats, t)} ·{" "}
              {formatTenge(tutorHourlyRateTenge(tutor.defaultHourlyRateCents))}
              {tutor.submittedAt
                ? ` · ${new Date(tutor.submittedAt).toLocaleDateString()}`
                : ""}
            </p>
          </div>
        </div>
        <Button variant="secondary" className="shrink-0" onClick={onReview}>
          {t("admin.review")}
        </Button>
      </div>
    </article>
  )
}

export function AdminTutorsPage() {
  const router = useRouter()
  const { t } = useTranslations()
  const toast = useToast()
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<StatusFilter>("APPROVED")
  const [search, setSearch] = useState("")
  const [tutors, setTutors] = useState<AdminTutorSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<AdminTutorDetail | null>(null)
  const visibleTutors = tutors.filter((tutor) =>
    tutor.displayName.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  )

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login?returnTo=/admin/tutors")
      return
    }
    refreshCurrentUser().then((user) => {
      if (!isAdminUser(user ?? getStoredUser())) {
        router.replace("/tutors")
        return
      }
      setReady(true)
    })
  }, [router])

  const loadTutors = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.admin.listTutors(status)
      setTutors(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.loadError"))
      setTutors([])
    } finally {
      setLoading(false)
    }
  }, [status, t, toast])

  useEffect(() => {
    if (!ready) return
    void loadTutors()
  }, [ready, loadTutors])

  const openReview = async (id: string) => {
    setSelectedId(id)
    try {
      const detail = await api.admin.getTutor(id)
      setSelectedDetail(detail)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.loadError"))
      setSelectedId(null)
    }
  }

  const refreshReview = async () => {
    await loadTutors()
    if (selectedId) {
      const detail = await api.admin.getTutor(selectedId)
      setSelectedDetail(detail)
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <Container className="py-8 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {t("admin.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{t("admin.subtitle")}</p>
      </div>

      <SegmentedTabs
        tabs={[
          { id: "SUBMITTED" as const, label: t("admin.tabSubmitted") },
          { id: "APPROVED" as const, label: t("admin.tabApproved") },
          { id: "REJECTED" as const, label: t("admin.tabRejected") },
          { id: "ALL" as const, label: t("admin.tabAll") },
        ]}
        active={status}
        onChange={setStatus}
        ariaLabel={t("admin.filterLabel")}
      />

      <label className="relative mt-5 block">
        <span className="sr-only">Search tutors by name</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search tutors by name"
          className="min-h-12 w-full rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-soft)]"
        />
      </label>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
          </div>
        ) : visibleTutors.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("admin.empty")}
            description={t("admin.emptyHint")}
          />
        ) : (
          visibleTutors.map((tutor) => (
            <TutorApplicationRow
              key={tutor.id}
              tutor={tutor}
              t={t}
              onReview={() => void openReview(tutor.id)}
            />
          ))
        )}
      </div>

      {selectedDetail ? (
        <TutorReviewPanel
          tutor={selectedDetail}
          onClose={() => {
            setSelectedDetail(null)
            setSelectedId(null)
          }}
          onUpdated={() => void refreshReview()}
        />
      ) : null}
    </Container>
  )
}
