"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Calendar,
  Clock,
  Heart,
  Loader2,
  MessageSquare,
  User,
  X,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import {
  getStoredUser,
  getUserDisplayName,
  getUserInitials,
  getUserRoleLabel,
  refreshCurrentUser,
  type StoredUser,
} from "@/lib/auth-client"
import { api, type Booking } from "@/lib/api-client"
import { ChatInbox } from "@/app/components/chat-inbox"
import { CancelLessonModal } from "@/app/components/cancel-lesson-modal"
import { NotificationsPanel } from "@/app/components/notifications-panel"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import { useToast } from "@/lib/toast-context"
import type { CancelBookingReason } from "@/lib/api-client"

type DashboardTab = "chats" | "lessons" | "notifications" | "favorites"

const DASHBOARD_TABS: DashboardTab[] = [
  "chats",
  "lessons",
  "notifications",
  "favorites",
]

function parseTabParam(value: string | null): DashboardTab | null {
  if (value && DASHBOARD_TABS.includes(value as DashboardTab)) {
    return value as DashboardTab
  }
  return null
}

function formatBookingDate(iso: string, locale: string) {
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

export const Dashboard = () => {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>("lessons")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [favorites, setFavorites] = useState<
    Awaited<ReturnType<typeof api.favorites.list>>
  >([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingFavorites, setLoadingFavorites] = useState(false)

  useEffect(() => {
    const tab = parseTabParam(searchParams.get("tab"))
    if (tab) setActiveTab(tab)
  }, [searchParams])

  useEffect(() => {
    const fetchUser = async () => {
      if (!localStorage.getItem("token")) {
        setUser(getStoredUser())
        return
      }
      const refreshed = await refreshCurrentUser()
      setUser(refreshed)
    }
    fetchUser()
  }, [])

  useEffect(() => {
    const role = user?.role ?? user?.roles?.[0]
    if (!role || role === "tutor") return

    setLoadingBookings(true)
    api.bookings
      .studentList()
      .then(setBookings)
      .catch(() => setBookings([]))
      .finally(() => setLoadingBookings(false))
  }, [user])

  useEffect(() => {
    if (activeTab !== "favorites") return
    setLoadingFavorites(true)
    api.favorites
      .list()
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoadingFavorites(false))
  }, [activeTab])

  const displayName = getUserDisplayName(user) || t("dash.userName")
  const roleLabel = getUserRoleLabel(user) || t("dash.roleBadge")
  const initials = getUserInitials(user)
  const isTutor = (user?.role ?? user?.roles?.[0]) === "tutor"

  const refreshBookings = () => {
    api.bookings
      .studentList()
      .then(setBookings)
      .catch(() => setBookings([]))
  }

  const handleCancelBooking = async (
    reason: CancelBookingReason,
    otherText?: string,
  ) => {
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

  const tabs: {
    id: DashboardTab
    icon: typeof MessageSquare
    labelKey: MessageId
  }[] = [
    { id: "chats", icon: MessageSquare, labelKey: "dash.tab.chats" },
    { id: "lessons", icon: Calendar, labelKey: "dash.tab.lessons" },
    { id: "notifications", icon: Heart, labelKey: "dash.tab.notifications" },
    { id: "favorites", icon: Heart, labelKey: "dash.tab.favorites" },
  ]

  if (isTutor) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-6 font-semibold text-slate-500">
          {t("tutorDash.redirectHint")}
        </p>
        <Link
          href="/tutor-dashboard"
          className="inline-flex rounded-2xl bg-[#8B5CF6] px-8 py-4 text-sm font-black uppercase tracking-widest text-white"
        >
          {t("tutorDash.title")}
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 duration-700 animate-in fade-in sm:px-6 lg:px-8">
      <CancelLessonModal
        open={Boolean(cancelBookingId)}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancelBooking}
      />

      {selectedBooking && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-slate-100 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-6 flex items-start justify-between">
              <h3 className="text-xl font-black text-[#1E293B] dark:text-zinc-100">
                {t("booking.detailTitle")}
              </h3>
              <button type="button" onClick={() => setSelectedBooking(null)}>
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("booking.tutor")}
                </dt>
                <dd className="font-bold">{selectedBooking.tutorName}</dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("booking.when")}
                </dt>
                <dd className="font-bold">
                  {formatBookingDate(selectedBooking.scheduledStartAt, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("booking.duration")}
                </dt>
                <dd className="font-bold">
                  {selectedBooking.durationMinutes} min
                </dd>
              </div>
              <div>
                <dt className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("booking.statusLabel")}
                </dt>
                <dd className="font-bold">
                  {t(statusLabelKey(selectedBooking.status))}
                </dd>
              </div>
              {selectedBooking.studentMessage && (
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t("booking.messageLabel")}
                  </dt>
                  <dd className="font-medium text-slate-600 dark:text-zinc-400">
                    {selectedBooking.studentMessage}
                  </dd>
                </div>
              )}
              {selectedBooking.cancellationReasonLabel && (
                <div>
                  <dt className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {t("cancel.reasonLabel")}
                  </dt>
                  <dd className="font-medium text-red-600">
                    {selectedBooking.cancellationReasonLabel}
                  </dd>
                </div>
              )}
            </dl>
            {(selectedBooking.status === "upcoming" ||
              selectedBooking.status === "pending") && (
              <button
                type="button"
                onClick={() => {
                  setCancelBookingId(selectedBooking.id)
                }}
                className="mt-6 w-full rounded-2xl border border-red-200 py-3 text-sm font-black uppercase text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
              >
                {t("booking.cancel")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <aside className="space-y-8 lg:col-span-3">
          <div className="flex flex-col items-center rounded-[3rem] border border-slate-100 bg-white p-10 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
            <div className="relative mb-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-2xl font-black text-white shadow-lg">
                {getUserDisplayName(user) ? (
                  initials
                ) : (
                  <User className="h-12 w-12 text-white/80" />
                )}
              </div>
            </div>
            <h3 className="text-2xl font-black text-[#1E293B] dark:text-zinc-100">
              {displayName}
            </h3>
            {user?.email && (
              <p className="mt-1 text-sm font-semibold text-slate-400 dark:text-zinc-500">
                {user.email}
              </p>
            )}
            <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[#8B5CF6]">
              {roleLabel}
            </p>
          </div>

          <div className="space-y-1 rounded-[3rem] border border-slate-100 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-4 rounded-[2rem] px-8 py-5 text-sm font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-violet-50 text-[#8B5CF6] dark:bg-violet-950/50"
                    : "text-slate-400 hover:bg-slate-50 dark:text-zinc-500 dark:hover:bg-zinc-800/80"
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {t(tab.labelKey)}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-9">
          {activeTab === "chats" && (
            <section className="rounded-[3rem] border border-slate-100 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
              <h3 className="mb-6 text-3xl font-black text-[#1E293B] dark:text-zinc-100">
                {t("dash.tab.chats")}
              </h3>
              <ChatInbox />
            </section>
          )}

          {activeTab === "lessons" && (
            <section className="rounded-[3rem] border border-slate-100 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-12">
              <h3 className="mb-10 text-3xl font-black text-[#1E293B] dark:text-zinc-100">
                {t("dash.tab.lessons")}
              </h3>
              {loadingBookings ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center">
                  <p className="font-semibold text-slate-400">
                    {t("booking.noBookings")}
                  </p>
                  <Link
                    href="/tutors"
                    className="mt-6 inline-flex rounded-2xl bg-[#8B5CF6] px-6 py-3 text-sm font-black uppercase tracking-widest text-white"
                  >
                    {t("favorites.browse")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="flex w-full flex-col gap-4 rounded-[2rem] border border-slate-100 bg-[#F8FAFC] p-6 text-left transition hover:border-[#8B5CF6] dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-[#8B5CF6] shadow-md dark:bg-zinc-800">
                          <Calendar className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-lg font-black text-[#1E293B] dark:text-zinc-100">
                            {booking.tutorName}
                          </h4>
                          <p className="mt-1 flex items-center gap-2 text-xs font-semibold text-slate-400">
                            <Clock className="h-3.5 w-3.5" />
                            {formatBookingDate(
                              booking.scheduledStartAt,
                              locale,
                            )}{" "}
                            · {booking.durationMinutes} min
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider ${
                          booking.status === "upcoming"
                            ? "bg-violet-100 text-[#8B5CF6] dark:bg-violet-950/40"
                            : booking.status === "pending"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : booking.status === "cancelled"
                              ? "bg-red-100 text-red-600 dark:bg-red-950/40"
                              : "bg-slate-100 text-slate-500 dark:bg-zinc-800"
                        }`}
                      >
                        {t(statusLabelKey(booking.status))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="rounded-[3rem] border border-slate-100 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
              <h3 className="mb-8 text-3xl font-black text-[#1E293B] dark:text-zinc-100">
                {t("dash.tab.notifications")}
              </h3>
              <NotificationsPanel />
            </section>
          )}

          {activeTab === "favorites" && (
            <section className="rounded-[3rem] border border-slate-100 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-10">
              <h3 className="mb-8 text-3xl font-black text-[#1E293B] dark:text-zinc-100">
                {t("dash.tab.favorites")}
              </h3>
              {loadingFavorites ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center">
                  <p className="font-semibold text-slate-400">
                    {t("favorites.empty")}
                  </p>
                  <Link
                    href="/tutors"
                    className="mt-6 inline-flex rounded-2xl bg-[#8B5CF6] px-6 py-3 text-sm font-black uppercase tracking-widest text-white"
                  >
                    {t("favorites.browse")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-[#F8FAFC] p-5 dark:border-zinc-800 dark:bg-zinc-900/80 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xl font-black text-[#1E293B] dark:text-zinc-100">
                          {entry.tutor.displayName}
                        </h4>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8B5CF6]">
                          {entry.tutor.subject}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {formatTenge(
                            tutorHourlyRateTenge(
                              entry.tutor.defaultHourlyRateCents,
                            ),
                          )}
                          {t("find.perHour")}
                        </p>
                      </div>
                      <Link
                        href={`/tutors/${entry.tutorProfileId}`}
                        className="rounded-2xl bg-[#F1F5F9] px-5 py-3 text-sm font-black text-[#1E293B] transition hover:bg-[#8B5CF6] hover:text-white dark:bg-zinc-800 dark:text-zinc-100"
                      >
                        {t("find.bookSession")}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  )
}
