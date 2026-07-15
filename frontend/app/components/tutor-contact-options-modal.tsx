"use client"

import { useState } from "react"
import { Calendar, Loader2, Phone, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type ApiTutor } from "@/lib/api-client"
import { TutorBookLessonModal } from "@/app/components/tutor-book-lesson-modal"
import { TelegramIcon } from "@/app/components/icons/telegram-icon"

type TutorContactOptionsModalProps = {
  open: boolean
  onClose: () => void
  tutor: ApiTutor
}

export function TutorContactOptionsModal({
  open,
  onClose,
  tutor,
}: TutorContactOptionsModalProps) {
  const { t } = useTranslations()
  const [bookOpen, setBookOpen] = useState(false)
  const [tracking, setTracking] = useState<"telegram" | "phone" | null>(null)

  const telegramUsername = tutor.publicTelegramUsername
  const publicPhone = tutor.publicPhone
  const canRequest = tutor.acceptsDirectRequests !== false

  const openTelegram = async () => {
    if (!telegramUsername) return
    setTracking("telegram")
    try {
      await api.leads.trackTelegramClick(tutor.id)
    } catch {
      /* ignore */
    } finally {
      setTracking(null)
      window.open(
        `https://t.me/${telegramUsername.replace(/^@/, "")}`,
        "_blank",
        "noopener,noreferrer",
      )
    }
  }

  const openPhone = async () => {
    if (!publicPhone) return
    setTracking("phone")
    try {
      await api.leads.trackPhoneClick(tutor.id)
    } catch {
      /* ignore */
    } finally {
      setTracking(null)
      window.location.href = `tel:${publicPhone}`
    }
  }

  const handleRequest = () => {
    onClose()
    setBookOpen(true)
  }

  if (!open && !bookOpen) return null

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-[350] flex items-end justify-center p-0 sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label={t("lead.close")}
            onClick={onClose}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-t-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-2xl sm:rounded-[2rem]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  {t("lead.contactTutor")}
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{tutor.displayName}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-[var(--text-muted)]"
                aria-label={t("lead.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 px-6 py-5">
              {canRequest && (
                <button
                  type="button"
                  onClick={handleRequest}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-button)] bg-[var(--primary)] px-4 py-3.5 text-left text-sm font-semibold text-white transition hover:opacity-95"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block">{t("lead.leaveRequest")}</span>
                    <span className="mt-0.5 block text-xs font-normal text-white/80">
                      {t("tutorProfile.bookLesson")}
                    </span>
                  </span>
                </button>
              )}

              {telegramUsername ? (
                <button
                  type="button"
                  disabled={tracking === "telegram"}
                  onClick={() => void openTelegram()}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-button)] px-4 py-3.5 text-left text-sm font-semibold text-white transition hover:opacity-95 disabled:opacity-70"
                  style={{ backgroundColor: "#24A1DE" }}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    {tracking === "telegram" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <TelegramIcon className="h-5 w-5" />
                    )}
                  </span>
                  <span>{t("lead.openTelegram")}</span>
                </button>
              ) : null}

              {publicPhone ? (
                <button
                  type="button"
                  disabled={tracking === "phone"}
                  onClick={() => void openPhone()}
                  className="flex w-full items-center gap-3 rounded-[var(--radius-button)] bg-emerald-600 px-4 py-3.5 text-left text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-70"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                    {tracking === "phone" ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Phone className="h-5 w-5" />
                    )}
                  </span>
                  <span>{t("lead.call")}</span>
                </button>
              ) : null}

              {!canRequest && !telegramUsername && !publicPhone ? (
                <p className="rounded-[var(--radius-card)] border border-dashed border-[var(--border)] px-4 py-6 text-center text-sm text-[var(--text-muted)]">
                  {t("lead.directContactHint")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      <TutorBookLessonModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        tutor={tutor}
      />
    </>
  )
}
