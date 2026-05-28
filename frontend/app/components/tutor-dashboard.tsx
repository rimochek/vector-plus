"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  Calendar,
  Loader2,
  User,
  X,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import {
  getStoredUser,
  getUserDisplayName,
  getUserInitials,
  isLoggedIn,
  refreshCurrentUser,
  type StoredUser,
} from "@/lib/auth-client"
import { api, type Booking } from "@/lib/api-client"
import { ChatInbox } from "@/app/components/chat-inbox"
import { CancelLessonModal } from "@/app/components/cancel-lesson-modal"
import { NotificationsPanel } from "@/app/components/notifications-panel"
import { WeeklyAvailabilityEditor } from "@/app/components/weekly-availability-editor"
import { useToast } from "@/lib/toast-context"
import { useRouter } from "next/navigation"
import type { CancelBookingReason } from "@/lib/api-client"

type TutorTab = "bookings" | "availability" | "chats" | "notifications"

const TUTOR_TABS: TutorTab[] = ["bookings", "availability", "chats", "notifications"]

function parseTabParam(value: string | null): TutorTab | null {
  if (value && TUTOR_TABS.includes(value as TutorTab)) {
    return value as TutorTab
  }
  return null
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusLabelKey(status: Booking["status"]): MessageId {
  if (status === "completed") return "booking.status.completed"
  if (status === "cancelled") return "booking.status.cancelled"
  if (status === "pending") return "booking.status.pending"
  return "booking.status.upcoming"
}

export function TutorDashboard() {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<TutorTab>("bookings")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [availabilityDirty, setAvailabilityDirty] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const nextTab = parseTabParam(searchParams.get("tab"))
    if (nextTab) setTab(nextTab)
  }, [searchParams])

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login")
      return
    }

    const load = async () => {
      const refreshed = await refreshCurrentUser()
      if (!refreshed) {
        setReady(true)
        return
      }

      setUser(refreshed)
      const role = refreshed.role ?? refreshed.roles?.[0]
      if (role !== "tutor") {
        router.push("/dashboard")
        return
      }
      setReady(true)
    }
    load()
  }, [router])

  const refreshBookings = () => {
    api.bookings.tutorList().then(setBookings).catch(() => setBookings([]))
  }

  useEffect(() => {
    if (!ready) return
    setLoading(true)
    api.bookings
      .tutorList()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoading(false))
  }, [ready])

  const handleCancelBooking = async (reason: CancelBookingReason, otherText?: string) => {
    if (!cancelBookingId) return
    try {
      await api.bookings.cancel(cancelBookingId, { reason, otherText })
      toast.success(t("cancel.success"))
      refreshBookings()
      setSelectedBooking(null)
      setCancelBookingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
      throw err
    }
  }

  const handleApproveBooking = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await api.bookings.approve(bookingId)
      toast.success(t("booking.approveSuccess"))
      refreshBookings()
      setSelectedBooking(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectBooking = async (bookingId: string) => {
    setActionLoading(bookingId)
    try {
      await api.bookings.reject(bookingId)
      toast.success(t("booking.rejectSuccess"))
      refreshBookings()
      setSelectedBooking(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
    } finally {
      setActionLoading(null)
    }
  }

  const handleTabChange = (next: TutorTab) => {
    if (tab === "availability" && availabilityDirty && next !== "availability") {
      toast.warning(t("toast.unsavedChanges"))
      return
    }
    setTab(next)
  }

  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
      </div>
    )
  }

  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)

  const pending = bookings.filter((b) => b.status === "pending")
  const upcoming = bookings.filter((b) => b.status === "upcoming")
  const past = bookings.filter(
    (b) => b.status === "completed" || b.status === "cancelled",
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <CancelLessonModal
        open={Boolean(cancelBookingId)}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancelBooking}
        variant="tutor"
      />

      {selectedBooking && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedBooking(null)} />
          <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-6 flex items-start justify-between">
              <h3 className="text-xl font-black">{t("booking.detailTitle")}</h3>
              <button type="button" onClick={() => setSelectedBooking(null)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <dl className="space-y-4 text-sm">
              <div><dt className="text-xs font-black uppercase text-slate-400">{t("booking.student")}</dt><dd className="font-bold">{selectedBooking.studentName}</dd></div>
              <div><dt className="text-xs font-black uppercase text-slate-400">{t("booking.when")}</dt><dd className="font-bold">{formatDate(selectedBooking.scheduledStartAt, locale)}</dd></div>
              <div><dt className="text-xs font-black uppercase text-slate-400">{t("booking.duration")}</dt><dd className="font-bold">{selectedBooking.durationMinutes} min</dd></div>
              <div><dt className="text-xs font-black uppercase text-slate-400">{t("booking.statusLabel")}</dt><dd className="font-bold">{t(statusLabelKey(selectedBooking.status))}</dd></div>
              {selectedBooking.studentMessage && (
                <div><dt className="text-xs font-black uppercase text-slate-400">{t("booking.messageLabel")}</dt><dd className="font-medium text-slate-600">{selectedBooking.studentMessage}</dd></div>
              )}
              {selectedBooking.cancellationReasonLabel && (
                <div><dt className="text-xs font-black uppercase text-slate-400">{t("cancel.reasonLabel")}</dt><dd className="font-medium text-red-600">{selectedBooking.cancellationReasonLabel}</dd></div>
              )}
            </dl>
            {selectedBooking.status === "pending" && (
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={actionLoading === selectedBooking.id}
                  onClick={() => handleApproveBooking(selectedBooking.id)}
                  className="flex-1 rounded-2xl bg-[#8B5CF6] py-3 text-sm font-black uppercase text-white hover:bg-[#7C3AED] disabled:opacity-50"
                >
                  {t("booking.approve")}
                </button>
                <button
                  type="button"
                  disabled={actionLoading === selectedBooking.id}
                  onClick={() => handleRejectBooking(selectedBooking.id)}
                  className="flex-1 rounded-2xl border border-red-200 py-3 text-sm font-black uppercase text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("booking.reject")}
                </button>
              </div>
            )}
            {selectedBooking.status === "upcoming" && (
              <button type="button" onClick={() => setCancelBookingId(selectedBooking.id)} className="mt-6 w-full rounded-2xl border border-red-200 py-3 text-sm font-black uppercase text-red-600 hover:bg-red-50">
                {t("booking.cancel")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-xl font-black text-white">
            {displayName ? initials : <User className="h-8 w-8" />}
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#1E293B] dark:text-zinc-100">{t("tutorDash.title")}</h1>
            <p className="text-sm font-semibold text-slate-400">{displayName}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {(["bookings", "availability", "chats", "notifications"] as TutorTab[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={`rounded-2xl px-6 py-3 text-sm font-black uppercase tracking-widest transition ${
              tab === id ? "bg-[#8B5CF6] text-white" : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            {t(id === "notifications" ? "dash.tab.notifications" : (`tutorDash.tab.${id}` as MessageId))}
          </button>
        ))}
      </div>

      {loading && tab === "bookings" ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" /></div>
      ) : tab === "bookings" ? (
        <div className="grid gap-10 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 lg:col-span-2">
            <h2 className="mb-6 text-lg font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">
              {t("tutorDash.pending")}
            </h2>
            {pending.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">{t("tutorDash.noPending")}</p>
            ) : (
              <div className="space-y-3">
                {pending.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-2xl border border-amber-200 bg-white p-4 dark:border-amber-900/40 dark:bg-zinc-950"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(b)}
                      className="flex w-full items-center gap-4 text-left"
                    >
                      <Calendar className="h-5 w-5 shrink-0 text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-[#1E293B] dark:text-zinc-100">{b.studentName}</p>
                        <p className="text-xs font-semibold text-slate-400">
                          {formatDate(b.scheduledStartAt, locale)} · {b.durationMinutes} min
                        </p>
                        {b.studentMessage && (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{b.studentMessage}</p>
                        )}
                      </div>
                    </button>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={actionLoading === b.id}
                        onClick={() => handleApproveBooking(b.id)}
                        className="flex-1 rounded-xl bg-[#8B5CF6] py-2 text-xs font-black uppercase text-white hover:bg-[#7C3AED] disabled:opacity-50"
                      >
                        {t("booking.approve")}
                      </button>
                      <button
                        type="button"
                        disabled={actionLoading === b.id}
                        onClick={() => handleRejectBooking(b.id)}
                        className="flex-1 rounded-xl border border-red-200 py-2 text-xs font-black uppercase text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {t("booking.reject")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-6 text-lg font-black uppercase tracking-widest text-[#8B5CF6]">{t("tutorDash.upcoming")}</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">{t("booking.noBookings")}</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((b) => (
                  <button key={b.id} type="button" onClick={() => setSelectedBooking(b)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left hover:border-[#8B5CF6] dark:border-zinc-800 dark:bg-zinc-900">
                    <Calendar className="h-5 w-5 shrink-0 text-[#8B5CF6]" />
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-[#1E293B] dark:text-zinc-100">{b.studentName}</p>
                      <p className="text-xs font-semibold text-slate-400">{formatDate(b.scheduledStartAt, locale)} · {b.durationMinutes} min</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="mb-6 text-lg font-black uppercase tracking-widest text-slate-400">{t("tutorDash.past")}</h2>
            {past.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">{t("tutorDash.noPast")}</p>
            ) : (
              <div className="space-y-3">
                {past.map((b) => (
                  <button key={b.id} type="button" onClick={() => setSelectedBooking(b)} className="flex w-full items-center gap-4 rounded-2xl border border-slate-100 p-4 text-left opacity-80 dark:border-zinc-800">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{b.studentName}</p>
                      <p className="text-xs text-slate-400">{formatDate(b.scheduledStartAt, locale)} · {t(statusLabelKey(b.status))}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : tab === "availability" ? (
        <WeeklyAvailabilityEditor onDirtyChange={setAvailabilityDirty} />
      ) : tab === "notifications" ? (
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-6 text-2xl font-black text-[#1E293B] dark:text-zinc-100">{t("dash.tab.notifications")}</h2>
          <NotificationsPanel />
        </section>
      ) : (
        <section className="rounded-[2rem] border border-slate-100 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <ChatInbox />
        </section>
      )}
    </div>
  )
}
