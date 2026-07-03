"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  Bell,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  Gift,
  Heart,
  Loader2,
  MessageSquare,
  Settings,
  Sparkles,
  X,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"
import {
  getStoredUser,
  getUserDisplayName,
  isLoggedIn,
  refreshCurrentUser,
  type StoredUser,
} from "@/lib/auth-client"
import {
  api,
  type Booking,
  type CancelBookingReason,
  type FavoriteEntry,
} from "@/lib/api-client"
import { firstName } from "@/lib/greeting"
import { CancelLessonModal } from "@/app/components/cancel-lesson-modal"
import { ChatInbox } from "@/app/components/chat-inbox"
import { NotificationsPanel } from "@/app/components/notifications-panel"
import { DashboardProfileMenu } from "@/app/components/dashboard-profile-menu"
import { useLiveDashboardFeed } from "@/lib/use-live-dashboard-feed"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { StickySidebar } from "@/app/components/ui/sticky-sidebar"
import { Button, ButtonLink } from "@/app/components/ui/button"
import { EmptyState } from "@/app/components/ui/empty-state"
import { useToast } from "@/lib/toast-context"

type StudentTab =
  | "overview"
  | "bookings"
  | "messages"
  | "favorites"
  | "notifications"
  | "settings"

const STUDENT_TABS: StudentTab[] = [
  "overview",
  "bookings",
  "messages",
  "favorites",
  "notifications",
  "settings",
]

function parseTabParam(value: string | null): StudentTab | null {
  if (value === "chats") return "messages"
  if (value === "lessons") return "bookings"
  if (value && STUDENT_TABS.includes(value as StudentTab)) return value as StudentTab
  return null
}

function statusLabelKey(status: Booking["status"]): MessageId {
  if (status === "completed") return "booking.status.completed"
  if (status === "cancelled") return "booking.status.cancelled"
  if (status === "pending") return "booking.status.pending"
  return "booking.status.upcoming"
}

function formatSessionWhen(iso: string, locale: string) {
  const date = new Date(iso)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const time = date.toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
  if (target.getTime() === today.getTime()) {
    return `${locale === "ru" ? "Сегодня" : "Today"} • ${time}`
  }
  const dateStr = date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  })
  return `${dateStr} • ${time}`
}

function formatConversationWhen(iso: string, locale: string) {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (target.getTime() === today.getTime()) {
    return date.toLocaleTimeString(locale === "ru" ? "ru-RU" : "en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
  }
  if (target.getTime() === yesterday.getTime()) {
    return locale === "ru" ? "Вчера" : "Yesterday"
  }
  return date.toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

function Avatar({
  name,
  src,
  size = "md",
}: {
  name: string
  src?: string | null
  size?: "sm" | "md"
}) {
  const dimension = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-to)] font-bold text-white ${dimension}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

function DashboardCard({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] ${className}`.trim()}
    >
      {children}
    </section>
  )
}

function StatusBadge({ status }: { status: Booking["status"] }) {
  const { t } = useTranslations()
  const tone =
    status === "upcoming"
      ? "bg-[var(--success-soft)] text-[var(--success)]"
      : status === "pending"
        ? "bg-[var(--warning-soft)] text-[var(--warning)]"
        : status === "cancelled"
          ? "bg-[var(--danger-soft)] text-[var(--danger)]"
          : "bg-[var(--chip)] text-[var(--text-muted)]"

  const label =
    status === "upcoming" ? t("dash.status.confirmed") : t(statusLabelKey(status))

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  )
}

function SummaryCard({
  icon: Icon,
  iconClassName,
  title,
  children,
  action,
}: {
  icon: LucideIcon
  iconClassName: string
  title: string
  children: ReactNode
  action?: ReactNode
}) {
  return (
    <DashboardCard className="flex h-full flex-col p-5">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{title}</p>
          <div className="mt-2">{children}</div>
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </DashboardCard>
  )
}

export const Dashboard = () => {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<StudentTab>("overview")
  const [bookings, setBookings] = useState<Booking[]>([])
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [loading, setLoading] = useState(true)
  const { unreadNotifications, conversations, refresh: refreshLiveFeed } =
    useLiveDashboardFeed(ready)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [messagingTutorId, setMessagingTutorId] = useState<string | null>(null)

  useEffect(() => {
    const nextTab = parseTabParam(searchParams.get("tab"))
    if (nextTab) setTab(nextTab)
  }, [searchParams])

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push("/login")
      return
    }

    refreshCurrentUser().then((refreshed) => {
      setUser(refreshed)
      const role = refreshed?.role ?? refreshed?.roles?.[0]
      if (role === "tutor") {
        router.push("/tutor-dashboard")
        return
      }
      setReady(true)
    })
  }, [router])

  const refreshData = () => {
    setLoading(true)
    Promise.all([api.bookings.studentList(), api.favorites.list()])
      .then(([bookingData, favoriteData]) => {
        setBookings(bookingData)
        setFavorites(favoriteData)
      })
      .catch(() => {
        setBookings([])
        setFavorites([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!ready) return
    refreshData()
  }, [ready])

  const handleTabChange = (next: StudentTab) => setTab(next)

  const handleCancelBooking = async (reason: CancelBookingReason, otherText?: string) => {
    if (!cancelBookingId) return
    try {
      await api.bookings.cancel(cancelBookingId, { reason, otherText })
      toast.success(t("cancel.success"))
      refreshData()
      setSelectedBooking(null)
      setCancelBookingId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
      throw err
    }
  }

  const messageTutor = async (tutorProfileId: string) => {
    setMessagingTutorId(tutorProfileId)
    try {
      await api.chat.createConversation(tutorProfileId)
      handleTabChange("messages")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("tutorProfile.messageError"))
    } finally {
      setMessagingTutorId(null)
    }
  }

  const now = useMemo(() => new Date(), [bookings])
  const upcomingBookings = useMemo(
    () =>
      bookings
        .filter(
          (booking) =>
            (booking.status === "upcoming" || booking.status === "pending") &&
            new Date(booking.scheduledStartAt) >= now,
        )
        .sort(
          (a, b) =>
            new Date(a.scheduledStartAt).getTime() -
            new Date(b.scheduledStartAt).getTime(),
        ),
    [bookings, now],
  )
  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === "pending"),
    [bookings],
  )
  const nextBooking = upcomingBookings[0]
  const unreadMessages = conversations.filter((conversation) => conversation.unread).length

  if (!ready || (loading && bookings.length === 0 && favorites.length === 0)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const displayName = getUserDisplayName(user) || t("dash.userName")

  const navItems: {
    id: StudentTab
    icon: LucideIcon
    labelKey: MessageId
    badge?: number
  }[] = [
    { id: "overview", icon: Calendar, labelKey: "dash.nav.overview" },
    { id: "bookings", icon: BookOpen, labelKey: "dash.nav.bookings" },
    {
      id: "messages",
      icon: MessageSquare,
      labelKey: "dash.nav.messages",
      badge: unreadMessages || undefined,
    },
    { id: "favorites", icon: Heart, labelKey: "dash.nav.savedTutors" },
    {
      id: "notifications",
      icon: Bell,
      labelKey: "dash.nav.notifications",
      badge: unreadNotifications || undefined,
    },
    { id: "settings", icon: Settings, labelKey: "dash.nav.settings" },
  ]

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <CancelLessonModal
        open={Boolean(cancelBookingId)}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancelBooking}
      />

      {selectedBooking && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-xl">
            <div className="mb-6 flex items-start justify-between">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {t("booking.detailTitle")}
              </h3>
              <button type="button" onClick={() => setSelectedBooking(null)}>
                <X className="h-5 w-5 text-[var(--text-muted)]" />
              </button>
            </div>
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.tutor")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {selectedBooking.tutorName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.when")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {formatSessionWhen(selectedBooking.scheduledStartAt, locale)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.subject")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {selectedBooking.subject}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.statusLabel")}
                </dt>
                <dd>
                  <StatusBadge status={selectedBooking.status} />
                </dd>
              </div>
            </dl>
            {(selectedBooking.status === "upcoming" ||
              selectedBooking.status === "pending") && (
              <button
                type="button"
                onClick={() => setCancelBookingId(selectedBooking.id)}
                className="mt-6 w-full rounded-[var(--radius-button)] border border-red-200 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                {t("booking.cancel")}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1600px] items-stretch gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6 lg:gap-8">
        <StickySidebar
          mode="column"
          stretchColumn
          top={0}
          inset={24}
          panelClassName="z-10 flex flex-col rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] px-5 py-6 shadow-[var(--shadow-sm)]"
        >
          <TutoraLogo href="/dashboard" size="lg" className="mb-8 px-1" />
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--chip)]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="min-w-0 flex-1">{t(item.labelKey)}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-xs text-[var(--primary)]">
                      {item.badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          <div className="mt-auto space-y-4 pt-8">
            <div className="rounded-2xl bg-[var(--primary-soft)] p-4">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white">
                <Gift className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[var(--primary)]">{t("dash.referTitle")}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                {t("dash.referDesc")}
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-1 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white"
              >
                {t("dash.referCta")}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button className="flex w-full items-center justify-between rounded-full bg-[var(--surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">
              {t("dash.helpSupport")}
              <span>›</span>
            </button>
          </div>
        </StickySidebar>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabChange(item.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === item.id
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface)] text-[var(--text-secondary)]"
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {t("dash.welcomeBack", { name: firstName(displayName) })}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("dash.overviewSubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink href="/tutors">{t("dash.findTutors")}</ButtonLink>
              <button
                type="button"
                onClick={() => handleTabChange("notifications")}
                className="relative rounded-full border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text-secondary)]"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--danger)] px-1 text-[10px] font-bold text-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              <DashboardProfileMenu
                displayName={displayName}
                subtitle={t("dash.roleBadge")}
                user={user}
              />
            </div>
          </header>

          <div key={tab} className="tutora-tab-panel w-full min-w-0 space-y-6 overflow-x-hidden">
            {tab === "overview" && (
              <>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    icon={Calendar}
                    iconClassName="bg-[var(--primary-soft)] text-[var(--primary)]"
                    title={t("dash.kpi.upcomingSession")}
                    action={
                      nextBooking ? (
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(nextBooking)}
                          className="text-sm font-semibold text-[var(--primary)] hover:underline"
                        >
                          {t("dash.viewBooking")}
                        </button>
                      ) : (
                        <ButtonLink href="/tutors" variant="secondary" className="w-full">
                          {t("dash.findTutors")}
                        </ButtonLink>
                      )
                    }
                  >
                    {nextBooking ? (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {formatSessionWhen(nextBooking.scheduledStartAt, locale)}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {nextBooking.subject}
                        </p>
                        <div className="flex items-center gap-3">
                          <Avatar name={nextBooking.tutorName} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                              {nextBooking.tutorName}
                            </p>
                            <StatusBadge status={nextBooking.status} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">
                        {t("dash.bookFirstLesson")}
                      </p>
                    )}
                  </SummaryCard>

                  <SummaryCard
                    icon={Clock}
                    iconClassName="bg-[var(--warning-soft)] text-[var(--warning)]"
                    title={t("dash.kpi.pendingRequests")}
                    action={
                      pendingBookings.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleTabChange("bookings")}
                          className="text-sm font-semibold text-[var(--primary)] hover:underline"
                        >
                          {t("dash.viewRequests")}
                        </button>
                      ) : undefined
                    }
                  >
                    <p className="text-3xl font-extrabold text-[var(--text-primary)]">
                      {pendingBookings.length}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {pendingBookings.length > 0
                        ? t("dash.requestsWaiting", { count: pendingBookings.length })
                        : t("dash.noPendingRequests")}
                    </p>
                  </SummaryCard>

                  <SummaryCard
                    icon={Heart}
                    iconClassName="bg-pink-100 text-pink-600 dark:bg-pink-950/30 dark:text-pink-300"
                    title={t("dash.kpi.savedTutors")}
                    action={
                      <button
                        type="button"
                        onClick={() => handleTabChange("favorites")}
                        className="text-sm font-semibold text-[var(--primary)] hover:underline"
                      >
                        {t("dash.viewSavedTutors")}
                      </button>
                    }
                  >
                    <p className="text-3xl font-extrabold text-[var(--text-primary)]">
                      {favorites.length}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {t("dash.tutorsSavedCount", { count: favorites.length })}
                    </p>
                  </SummaryCard>

                  <SummaryCard
                    icon={Zap}
                    iconClassName="bg-[var(--primary-soft)] text-[var(--primary)]"
                    title={t("dash.kpi.quickActions")}
                  >
                    <ul className="space-y-2 text-sm">
                      {[
                        { label: t("dash.quickFindTutors"), href: "/tutors" },
                        { label: t("dash.quickBookLesson"), href: "/tutors" },
                        { label: t("dash.quickBrowseSubjects"), href: "/tutors" },
                        { label: t("dash.quickHowItWorks"), href: "/" },
                      ].map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="flex items-center justify-between font-medium text-[var(--text-secondary)] transition hover:text-[var(--primary)]"
                          >
                            {item.label}
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </SummaryCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.9fr)]">
                  <DashboardCard>
                    <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                      <h2 className="font-bold text-[var(--text-primary)]">
                        {t("dash.upcomingSessions")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleTabChange("bookings")}
                        className="text-xs font-semibold text-[var(--primary)]"
                      >
                        {t("dash.viewRequests")}
                      </button>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {upcomingBookings.length === 0 ? (
                        <div className="p-8">
                          <EmptyState
                            icon={Calendar}
                            title={t("dash.noUpcomingSession")}
                            description={t("dash.bookFirstLesson")}
                            action={{
                              label: t("dash.findTutors"),
                              onClick: () => router.push("/tutors"),
                            }}
                          />
                        </div>
                      ) : (
                        upcomingBookings.slice(0, 5).map((booking) => (
                          <div
                            key={booking.id}
                            className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <Avatar name={booking.tutorName} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-[var(--text-primary)]">
                                  {booking.subject}
                                </p>
                                <p className="text-sm text-[var(--text-muted)]">
                                  {booking.tutorName} ·{" "}
                                  {formatSessionWhen(booking.scheduledStartAt, locale)}
                                </p>
                              </div>
                              <StatusBadge status={booking.status} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {booking.meetingUrl ? (
                                <a
                                  href={booking.meetingUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-[var(--radius-button)] bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white"
                                >
                                  {t("dash.openMeeting")}
                                </a>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedBooking(booking)}
                                  className="rounded-[var(--radius-button)] border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
                                >
                                  {t("dash.viewBooking")}
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={messagingTutorId === booking.counterpartyId}
                                onClick={() => messageTutor(booking.counterpartyId)}
                                className="rounded-[var(--radius-button)] border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
                              >
                                {t("dash.messageTutor")}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </DashboardCard>

                  <div className="space-y-6">
                    <DashboardCard>
                      <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                        <h2 className="font-bold text-[var(--text-primary)]">
                          {t("dash.recentConversations")}
                        </h2>
                      </div>
                      <div className="divide-y divide-[var(--border)]">
                        {conversations.length === 0 ? (
                          <p className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                            {t("dash.chats.empty")}
                          </p>
                        ) : (
                          conversations.slice(0, 4).map((conversation) => (
                            <button
                              key={conversation.id}
                              type="button"
                              onClick={() => handleTabChange("messages")}
                              className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-[var(--chip)]"
                            >
                              <Avatar name={conversation.counterpartyName} size="sm" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="truncate font-semibold text-[var(--text-primary)]">
                                    {conversation.counterpartyName}
                                  </p>
                                  <span className="shrink-0 text-xs text-[var(--text-muted)]">
                                    {conversation.lastMessage
                                      ? formatConversationWhen(
                                          conversation.lastMessage.createdAt,
                                          locale,
                                        )
                                      : ""}
                                  </span>
                                </div>
                                <p className="truncate text-sm text-[var(--text-muted)]">
                                  {conversation.lastMessage?.content ?? "—"}
                                </p>
                              </div>
                              {conversation.unread && (
                                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary)]" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                      <div className="border-t border-[var(--border)] px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleTabChange("messages")}
                          className="w-full rounded-[var(--radius-button)] border border-[var(--border)] py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
                        >
                          {t("dash.goToMessages")}
                        </button>
                      </div>
                    </DashboardCard>

                    <DashboardCard>
                      <div className="border-b border-[var(--border)] px-5 py-4">
                        <h2 className="font-bold text-[var(--text-primary)]">
                          {t("dash.nav.savedTutors")}
                        </h2>
                      </div>
                      <div className="space-y-3 p-5">
                        {favorites.length === 0 ? (
                          <p className="text-center text-sm text-[var(--text-muted)]">
                            {t("favorites.empty")}
                          </p>
                        ) : (
                          favorites.slice(0, 4).map((entry) => (
                            <Link
                              key={entry.id}
                              href={`/tutors/${entry.tutorProfileId}`}
                              className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-3 transition hover:border-[var(--primary)]"
                            >
                              <Avatar
                                name={entry.tutor.displayName}
                                src={entry.tutor.avatarUrl}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold text-[var(--text-primary)]">
                                  {entry.tutor.displayName}
                                </p>
                                <p className="truncate text-xs text-[var(--text-muted)]">
                                  {entry.tutor.subject}
                                </p>
                              </div>
                              <Heart className="h-4 w-4 shrink-0 fill-[var(--primary)] text-[var(--primary)]" />
                            </Link>
                          ))
                        )}
                      </div>
                    </DashboardCard>
                  </div>
                </div>

                <DashboardCard className="overflow-hidden">
                  <div className="flex flex-col gap-6 bg-gradient-to-r from-[var(--primary-soft)] to-transparent p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                    <div className="max-w-xl">
                      <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">
                        {t("dash.ctaTitle")}
                      </h2>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {t("dash.ctaDesc")}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-3">
                        <ButtonLink href="/tutors">{t("dash.exploreTutors")}</ButtonLink>
                        <ButtonLink href="/tutors" variant="secondary">
                          {t("dash.browseSubjects")}
                        </ButtonLink>
                      </div>
                    </div>
                    <div className="hidden h-28 w-28 items-center justify-center rounded-[2rem] bg-[var(--primary)] text-white shadow-lg sm:flex">
                      <Sparkles className="h-12 w-12" />
                    </div>
                  </div>
                </DashboardCard>
              </>
            )}

            {tab === "bookings" && (
              <DashboardCard className="p-6">
                <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">
                  {t("dash.nav.bookings")}
                </h2>
                {bookings.length === 0 ? (
                  <EmptyState
                    icon={Calendar}
                    title={t("booking.noBookings")}
                    description={t("dash.bookFirstLesson")}
                    action={{
                      label: t("dash.findTutors"),
                      onClick: () => router.push("/tutors"),
                    }}
                  />
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        className="flex w-full flex-col gap-3 rounded-xl border border-[var(--border)] p-4 text-left transition hover:border-[var(--primary)] sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={booking.tutorName} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)]">
                              {booking.subject}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                              {booking.tutorName} ·{" "}
                              {formatSessionWhen(booking.scheduledStartAt, locale)}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={booking.status} />
                      </button>
                    ))}
                  </div>
                )}
              </DashboardCard>
            )}

            {tab === "messages" && (
              <DashboardCard className="p-5">
                <ChatInbox onActivity={refreshLiveFeed} />
              </DashboardCard>
            )}

            {tab === "favorites" && (
              <DashboardCard className="p-6">
                <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">
                  {t("dash.nav.savedTutors")}
                </h2>
                {favorites.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title={t("favorites.empty")}
                    description={t("favorites.subtitle")}
                    action={{
                      label: t("favorites.browse"),
                      onClick: () => router.push("/tutors"),
                    }}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {favorites.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-col gap-4 rounded-xl border border-[var(--border)] p-4 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar
                            name={entry.tutor.displayName}
                            src={entry.tutor.avatarUrl}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--text-primary)]">
                              {entry.tutor.displayName}
                            </p>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)]">
                              {entry.tutor.subject}
                            </p>
                          </div>
                        </div>
                        <ButtonLink href={`/tutors/${entry.tutorProfileId}`} variant="secondary">
                          {t("find.bookSession")}
                        </ButtonLink>
                      </div>
                    ))}
                  </div>
                )}
              </DashboardCard>
            )}

            {tab === "notifications" && (
              <DashboardCard className="p-6">
                <NotificationsPanel onRefresh={refreshLiveFeed} />
              </DashboardCard>
            )}

            {tab === "settings" && (
              <DashboardCard className="p-8 text-center">
                <Settings className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-[var(--surface-secondary)] p-3 text-[var(--text-muted)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {t("dash.nav.settings")}
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">{t("dash.settingsHint")}</p>
              </DashboardCard>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
