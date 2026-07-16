"use client"

import { useEffect, useState } from "react"
import { AnimatePresence } from "motion/react"
import { Heart, Loader2, Phone } from "lucide-react"
import { TelegramIcon } from "@/app/components/icons/telegram-icon"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { ApiTutor, AvailabilitySlot, Booking } from "@/lib/api-client"
import { api } from "@/lib/api-client"
import { getStoredUser, isLoggedIn } from "@/lib/auth-client"
import { TutorBookLessonModal } from "@/app/components/tutor-book-lesson-modal"
import { Button } from "@/app/components/ui/button"

type TutorContactSidebarProps = {
  className?: string
  tutor: ApiTutor
  favorited: boolean
  favoriteLoading: boolean
  onToggleFavorite: () => void
  preferredSlot?: AvailabilitySlot | null
}

function findActiveBooking(
  bookings: Booking[],
  tutorId: string,
): Booking | null {
  return (
    bookings.find(
      (booking) =>
        booking.counterpartyId === tutorId &&
        (booking.status === "upcoming" || booking.status === "pending"),
    ) ?? null
  )
}

export function TutorContactSidebar({
  className = "",
  tutor,
  favorited,
  favoriteLoading,
  onToggleFavorite,
  preferredSlot = null,
}: TutorContactSidebarProps) {
  const { t } = useTranslations()
  const [bookOpen, setBookOpen] = useState(false)
  const [tracking, setTracking] = useState<string | null>(null)
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null)

  const canRequest = tutor.acceptsDirectRequests !== false
  const telegramUsername = tutor.publicTelegramUsername
  const publicPhone = tutor.publicPhone

  useEffect(() => {
    let cancelled = false

    const loadActiveBooking = async () => {
      if (!isLoggedIn()) {
        if (!cancelled) setActiveBooking(null)
        return
      }

      const user = getStoredUser()
      const isStudent = (user?.role ?? user?.roles?.[0]) === "student"
      if (!isStudent) {
        if (!cancelled) setActiveBooking(null)
        return
      }

      try {
        const bookings = await api.bookings.studentList()
        if (!cancelled) {
          setActiveBooking(findActiveBooking(bookings, tutor.id))
        }
      } catch {
        if (!cancelled) setActiveBooking(null)
      }
    }

    void loadActiveBooking()
    return () => {
      cancelled = true
    }
  }, [tutor.id, bookOpen])

  const openTelegram = async () => {
    if (!telegramUsername) return
    setTracking("telegram")
    try {
      await api.leads.trackTelegramClick(tutor.id)
    } catch {
      /* ignore tracking errors */
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

  return (
    <>
      <aside
        className={`rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] xl:sticky xl:top-24 ${className}`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              {t("lead.contactTutor")}
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">
              {Math.round(tutor.defaultHourlyRateCents / 100).toLocaleString()}{" "}
              ₸
              <span className="text-sm font-medium text-[var(--text-muted)]">
                {t("tutorProfile.perLesson")}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={favoriteLoading}
            aria-label={t("tutorProfile.favorite")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--background)]"
          >
            {favoriteLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-[var(--text-muted)]"}`}
              />
            )}
          </button>
        </div>

        <div className="space-y-3">
          {canRequest && (
            <Button
              type="button"
              className="w-full"
              onClick={() => setBookOpen(true)}
            >
              {activeBooking
                ? t("tutorProfile.rescheduleLesson")
                : t("tutorProfile.bookLesson")}
            </Button>
          )}

          {telegramUsername && (
            <Button
              type="button"
              className="w-full gap-2 border-transparent text-white hover:opacity-95"
              style={{ backgroundColor: "#24A1DE" }}
              disabled={tracking === "telegram"}
              onClick={() => void openTelegram()}
            >
              {tracking === "telegram" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TelegramIcon className="h-4 w-4" />
              )}
              {t("lead.openTelegram")}
            </Button>
          )}

          {publicPhone && (
            <Button
              type="button"
              className="w-full gap-2 border-transparent bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={tracking === "phone"}
              onClick={() => void openPhone()}
            >
              {tracking === "phone" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Phone className="h-4 w-4" />
              )}
              {t("lead.call")}
            </Button>
          )}
        </div>

        <p className="mt-4 text-xs leading-relaxed text-[var(--text-muted)]">
          {t("lead.directContactHint")}
        </p>
      </aside>

      <AnimatePresence>
        {bookOpen && (
          <TutorBookLessonModal
            open
            onClose={() => setBookOpen(false)}
            tutor={tutor}
            initialSlotId={preferredSlot?.id ?? null}
            existingBookingId={activeBooking?.id ?? null}
            onBooked={() => {
              void api.bookings.studentList().then((bookings) => {
                setActiveBooking(findActiveBooking(bookings, tutor.id))
              })
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
