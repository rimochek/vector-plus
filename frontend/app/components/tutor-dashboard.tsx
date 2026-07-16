"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Bell,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  GraduationCap,
  Loader2,
  MessageSquare,
  MoreVertical,
  Settings,
  User,
  Users,
  X,
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
  type TutorDashboardLesson,
  type TutorDashboardOverview,
} from "@/lib/api-client"
import { firstName, greetingMessageId } from "@/lib/greeting"
import { CancelLessonModal } from "@/app/components/cancel-lesson-modal"
import { ChatInbox } from "@/app/components/chat-inbox"
import { NotificationsPanel } from "@/app/components/notifications-panel"
import { WeeklyAvailabilityEditor } from "@/app/components/weekly-availability-editor"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { StickySidebar } from "@/app/components/ui/sticky-sidebar"
import { Button, ButtonLink } from "@/app/components/ui/button"
import { EmptyState } from "@/app/components/ui/empty-state"
import { DashboardProfileMenu } from "@/app/components/dashboard-profile-menu"
import { AccountSettingsPanel } from "@/app/components/account-settings-panel"
import { useLiveDashboardFeed } from "@/lib/use-live-dashboard-feed"
import { TutorProfileEditor } from "@/app/components/tutor-profile-editor"
import { useToast } from "@/lib/toast-context"

type TutorTab =
  | "overview"
  | "requests"
  | "upcoming"
  | "messages"
  | "availability"
  | "profile"
  | "notifications"
  | "settings"

const TUTOR_TABS: TutorTab[] = [
  "overview",
  "requests",
  "upcoming",
  "messages",
  "availability",
  "profile",
  "notifications",
  "settings",
]

function parseTabParam(value: string | null): TutorTab | null {
  if (value && TUTOR_TABS.includes(value as TutorTab)) return value as TutorTab
  return null
}

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimeRange(startIso: string, endIso: string, locale: string) {
  const options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" }
  const localeId = locale === "ru" ? "ru-RU" : "en-US"
  return `${new Date(startIso).toLocaleTimeString(localeId, options)} – ${new Date(
    endIso,
  ).toLocaleTimeString(localeId, options)}`
}

function formatWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
  })
}

function statusLabelKey(status: Booking["status"]): MessageId {
  if (status === "completed") return "booking.status.completed"
  if (status === "cancelled") return "booking.status.cancelled"
  if (status === "pending") return "booking.status.pending"
  return "booking.status.upcoming"
}

function dayLabelKey(day: number): MessageId {
  const map: Record<number, MessageId> = {
    0: "avail.day.sun",
    1: "avail.day.mon",
    2: "avail.day.tue",
    3: "avail.day.wed",
    4: "avail.day.thu",
    5: "avail.day.fri",
    6: "avail.day.sat",
  }
  return map[day] ?? "avail.day.mon"
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
        // eslint-disable-next-line @next/next/no-img-element -- User-uploaded avatar domains are not configured for next/image.
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

function KpiCard({
  icon: Icon,
  label,
  value,
  footer,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  footer?: string
}) {
  return (
    <DashboardCard className="p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 text-3xl font-extrabold leading-none text-[var(--text-primary)]">
            {value}
          </p>
          {footer && (
            <p className="mt-3 text-xs font-medium text-[var(--text-muted)]">{footer}</p>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}

function ProfileCompletionCard({
  value,
  label,
  successText,
  improveText,
  actionLabel,
  onAction,
}: {
  value: number
  label: string
  successText: string
  improveText: string
  actionLabel: string
  onAction?: () => void
}) {
  const clamped = Math.max(0, Math.min(value, 100))
  const isComplete = clamped >= 100
  return (
    <DashboardCard className="p-5">
      <div className="flex items-center gap-4">
        <div
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full text-sm font-extrabold text-[var(--primary)]"
          style={{
            background: `conic-gradient(var(--primary) ${clamped * 3.6}deg, var(--primary-soft) 0deg)`,
          }}
        >
          <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--surface)]">
            {clamped}%
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-1 text-sm font-bold text-[var(--text-primary)]">
            {isComplete ? successText : improveText}
          </p>
          {!isComplete && onAction ? (
            <button
              type="button"
              onClick={onAction}
              className="mt-2 text-xs font-semibold text-[var(--primary)] hover:underline"
            >
              {actionLabel} →
            </button>
          ) : null}
        </div>
      </div>
    </DashboardCard>
  )
}

function LessonRow({
  lesson,
  locale,
  variant,
  onOpen,
  onApprove,
  onReject,
  actionLoading,
  approveLabel,
  rejectLabel,
  joinLabel,
}: {
  lesson: TutorDashboardLesson
  locale: string
  variant: "request" | "upcoming"
  onOpen: () => void
  onApprove?: () => void
  onReject?: () => void
  actionLoading?: boolean
  approveLabel: string
  rejectLabel: string
  joinLabel: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Avatar name={lesson.studentName} src={lesson.studentAvatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-[var(--text-primary)]">
              {lesson.studentName}
            </p>
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
          </div>
          <p className="mt-0.5 truncate text-xs font-medium text-[var(--text-secondary)]">
            {lesson.subject}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-[11rem] items-center gap-2 text-left text-xs text-[var(--text-secondary)]"
      >
        <Calendar className="h-4 w-4 text-[var(--text-muted)]" />
        <span>{formatDate(lesson.scheduledStartAt, locale)}</span>
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-[10rem] items-center gap-2 text-left text-xs text-[var(--text-secondary)]"
      >
        <Clock className="h-4 w-4 text-[var(--text-muted)]" />
        <span>
          {formatTimeRange(lesson.scheduledStartAt, lesson.scheduledEndAt, locale)} (
          {lesson.durationMinutes} min)
        </span>
      </button>

      {variant === "request" ? (
        <div className="flex gap-2 sm:justify-end">
          <button
            type="button"
            disabled={actionLoading}
            onClick={onApprove}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-soft)] disabled:opacity-50"
          >
            {approveLabel}
          </button>
          <button
            type="button"
            disabled={actionLoading}
            onClick={onReject}
            className="rounded-lg border border-red-100 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {rejectLabel}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg border border-[var(--border)] px-5 py-2 text-xs font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-soft)]"
          >
            {joinLabel}
          </button>
          <MoreVertical className="h-4 w-4 text-[var(--text-muted)]" />
        </div>
      )}
    </div>
  )
}

function AvailabilityOverviewCard({
  overview,
  t,
  onManage,
}: {
  overview: TutorDashboardOverview["availability"]
  t: (id: MessageId, params?: Record<string, string | number>) => string
  onManage: () => void
}) {
  return (
    <DashboardCard>
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="font-bold text-[var(--text-primary)]">
          {t("tutorDash.availabilityOverview")}
        </h2>
        <button
          type="button"
          onClick={onManage}
          className="text-xs font-semibold text-[var(--primary)]"
        >
          {t("tutorDash.manageAvailability")}
        </button>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-7 gap-2">
          {overview.days.map((day) => (
            <div
              key={day.dayOfWeek}
              className={`rounded-xl px-2 py-3 text-center ${
                day.hasAvailability ? "bg-[var(--primary-soft)]" : "bg-[var(--surface-secondary)]"
              }`}
            >
              <p className="text-xs font-bold text-[var(--text-secondary)]">
                {t(dayLabelKey(day.dayOfWeek))}
              </p>
              <span
                className={`mx-auto mt-4 block h-2.5 w-2.5 rounded-full ${
                  day.hasAvailability ? "bg-[var(--success)]" : "bg-[var(--border-strong)]"
                }`}
              />
              <p className="mt-3 text-[11px] font-semibold text-[var(--text-muted)]">
                {day.slotsCount > 0
                  ? t("tutorDash.slotsCount", { count: day.slotsCount })
                  : "—"}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--text-muted)]">
          {t("avail.timezone")}: {overview.timezone}
        </p>
      </div>
    </DashboardCard>
  )
}

export function TutorDashboard() {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState<TutorTab>("overview")
  const [overview, setOverview] = useState<TutorDashboardOverview | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [availabilityDirty, setAvailabilityDirty] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const { unreadNotifications, conversations, refresh: refreshLiveFeed } =
    useLiveDashboardFeed(ready)

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

  const refreshDashboard = () => {
    setLoading(true)
    Promise.all([
      api.tutors.dashboardOverview(),
      api.bookings.tutorList(),
    ])
      .then(([overviewData, bookingData]) => {
        setOverview(overviewData)
        setBookings(bookingData)
      })
      .catch(() => {
        setOverview(null)
        setBookings([])
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!ready) return
    refreshDashboard()
  }, [ready])

  const handleCancelBooking = async (reason: CancelBookingReason, otherText?: string) => {
    if (!cancelBookingId) return
    try {
      await api.bookings.cancel(cancelBookingId, { reason, otherText })
      toast.success(t("cancel.success"))
      refreshDashboard()
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
      refreshDashboard()
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
      refreshDashboard()
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

  const bookingById = useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings],
  )

  const openLesson = (lesson: TutorDashboardLesson) => {
    const booking = bookingById.get(lesson.id)
    if (booking) setSelectedBooking(booking)
  }

  if (!ready || (loading && !overview)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const displayName =
    overview?.displayName || getUserDisplayName(user) || getStoredUser()?.email || "Tutor"
  const pending = overview?.pendingRequests ?? []
  const upcoming = overview?.upcomingLessons ?? []
  const stats = overview?.stats
  const unreadMessages = conversations.filter((conversation) => conversation.unread).length

  const navItems: {
    id: TutorTab
    icon: LucideIcon
    labelKey: MessageId
    badge?: number
  }[] = [
    { id: "overview", icon: Calendar, labelKey: "tutorDash.nav.overview" },
    {
      id: "requests",
      icon: Calendar,
      labelKey: "tutorDash.nav.lessonRequests",
      badge: stats?.pendingRequests,
    },
    {
      id: "upcoming",
      icon: Clock,
      labelKey: "tutorDash.nav.upcomingLessons",
    },
    {
      id: "messages",
      icon: MessageSquare,
      labelKey: "tutorDash.nav.messages",
      badge: unreadMessages || undefined,
    },
    { id: "availability", icon: Calendar, labelKey: "tutorDash.nav.availability" },
    { id: "profile", icon: User, labelKey: "tutorDash.nav.publicProfile" },
    {
      id: "notifications",
      icon: Bell,
      labelKey: "tutorDash.nav.notifications",
      badge: unreadNotifications || undefined,
    },
    { id: "settings", icon: Settings, labelKey: "tutorDash.nav.settings" },
  ]

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <CancelLessonModal
        open={Boolean(cancelBookingId)}
        onClose={() => setCancelBookingId(null)}
        onConfirm={handleCancelBooking}
        variant="tutor"
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
                  {t("booking.student")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {selectedBooking.studentName}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.when")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {formatDate(selectedBooking.scheduledStartAt, locale)} ·{" "}
                  {formatTimeRange(
                    selectedBooking.scheduledStartAt,
                    selectedBooking.scheduledEndAt,
                    locale,
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.duration")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {selectedBooking.durationMinutes} min
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {t("booking.statusLabel")}
                </dt>
                <dd className="font-semibold text-[var(--text-primary)]">
                  {t(statusLabelKey(selectedBooking.status))}
                </dd>
              </div>
              {selectedBooking.studentMessage && (
                <div>
                  <dt className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                    {t("booking.messageLabel")}
                  </dt>
                  <dd className="font-medium text-[var(--text-secondary)]">
                    {selectedBooking.studentMessage}
                  </dd>
                </div>
              )}
            </dl>
            {selectedBooking.status === "pending" && (
              <div className="mt-6 flex gap-3">
                <Button
                  disabled={actionLoading === selectedBooking.id}
                  onClick={() => handleApproveBooking(selectedBooking.id)}
                  className="flex-1"
                >
                  {t("booking.approve")}
                </Button>
                <button
                  type="button"
                  disabled={actionLoading === selectedBooking.id}
                  onClick={() => handleRejectBooking(selectedBooking.id)}
                  className="flex-1 rounded-[var(--radius-button)] border border-red-200 py-3 text-sm font-semibold text-red-600 transition duration-150 hover:bg-red-50 disabled:opacity-50"
                >
                  {t("booking.reject")}
                </button>
              </div>
            )}
            {selectedBooking.status === "upcoming" && (
              <button
                type="button"
                onClick={() => setCancelBookingId(selectedBooking.id)}
                className="mt-6 w-full rounded-[var(--radius-button)] border border-red-200 py-3 text-sm font-semibold text-red-600 transition duration-150 hover:bg-red-50"
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
          <TutoraLogo href="/tutor-dashboard" size="lg" className="mb-8 px-1" />
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
            {stats && stats.profileCompletion < 100 ? (
              <div className="rounded-2xl bg-[var(--primary-soft)] p-4">
                <h3 className="text-sm font-bold text-[var(--primary)]">
                  {t("tutorDash.sidebarProfileTitle")}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {t("tutorDash.sidebarProfileDesc")}
                </p>
                <button
                  type="button"
                  onClick={() => handleTabChange("profile")}
                  className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white"
                >
                  {t("tutorDash.completeProfile")}
                </button>
              </div>
            ) : null}
            <button className="flex w-full items-center justify-between rounded-full bg-[var(--surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)]">
              {t("tutorDash.helpSupport")}
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
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {t(greetingMessageId("tutorDash"), { name: firstName(displayName) })}
              </h1>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {t("tutorDash.overviewSubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <ButtonLink
                href={overview ? `/tutors/${overview.tutorProfileId}` : "/tutors"}
                variant="secondary"
                className="gap-2"
              >
                {t("tutorDash.previewProfile")}
                <ExternalLink className="h-4 w-4" />
              </ButtonLink>
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
                subtitle={t("nav.profile")}
                avatarUrl={overview?.avatarUrl}
                user={user}
              />
            </div>
          </header>

          <div key={tab} className="tutora-tab-panel w-full min-w-0 overflow-x-hidden">
          {tab === "overview" && overview && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                <KpiCard
                  icon={Calendar}
                  label={t("tutorDash.kpi.upcoming")}
                  value={stats.upcomingLessons}
                  footer={upcoming[0] ? `${t("tutorDash.next")}: ${formatWhen(upcoming[0].scheduledStartAt, locale)}` : t("tutorDash.noUpcomingTitle")}
                />
                <KpiCard
                  icon={User}
                  label={t("tutorDash.kpi.pending")}
                  value={stats.pendingRequests}
                  footer={t("tutorDash.requiresAction")}
                />
                <KpiCard
                  icon={Users}
                  label={t("tutorDash.kpi.students")}
                  value={stats.totalStudents}
                  footer={t("tutorDash.realData")}
                />
                <KpiCard
                  icon={Eye}
                  label={t("tutorDash.kpi.views")}
                  value={stats.profileViews}
                  footer={t("tutorDash.viewsThisWeek", { count: stats.profileViewsThisWeek })}
                />
                <ProfileCompletionCard
                  value={stats.profileCompletion}
                  label={t("tutorDash.kpi.profileCompletion")}
                  successText={t("tutorDash.profileGreat")}
                  improveText={t("tutorDash.profileImprove")}
                  actionLabel={t("tutorDash.completeProfile")}
                  onAction={() => handleTabChange("profile")}
                />
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.9fr)]">
                <div className="space-y-6">
                  <DashboardCard>
                    <div className="flex items-center justify-between px-5 py-4">
                      <h2 className="font-bold text-[var(--text-primary)]">
                        {t("tutorDash.pendingBookingRequests")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleTabChange("requests")}
                        className="text-xs font-semibold text-[var(--primary)]"
                      >
                        {t("tutorDash.viewAllRequests")}
                      </button>
                    </div>
                    {pending.length === 0 ? (
                      <EmptyState
                        icon={Calendar}
                        title={t("tutorDash.noPendingTitle")}
                        description={t("tutorDash.noPendingDesc")}
                      />
                    ) : (
                      pending.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          locale={locale}
                          variant="request"
                          onOpen={() => openLesson(lesson)}
                          onApprove={() => handleApproveBooking(lesson.id)}
                          onReject={() => handleRejectBooking(lesson.id)}
                          actionLoading={actionLoading === lesson.id}
                          approveLabel={t("booking.approve")}
                          rejectLabel={t("booking.reject")}
                          joinLabel={t("tutorDash.joinLesson")}
                        />
                      ))
                    )}
                  </DashboardCard>

                  <DashboardCard>
                    <div className="flex items-center justify-between px-5 py-4">
                      <h2 className="font-bold text-[var(--text-primary)]">
                        {t("tutorDash.upcomingLessons")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleTabChange("upcoming")}
                        className="text-xs font-semibold text-[var(--primary)]"
                      >
                        {t("tutorDash.viewFullSchedule")}
                      </button>
                    </div>
                    {upcoming.length === 0 ? (
                      <EmptyState
                        icon={Clock}
                        title={t("tutorDash.noUpcomingTitle")}
                        description={t("tutorDash.noUpcomingDesc")}
                        action={{
                          label: t("tutorDash.setAvailability"),
                          onClick: () => handleTabChange("availability"),
                        }}
                      />
                    ) : (
                      upcoming.map((lesson) => (
                        <LessonRow
                          key={lesson.id}
                          lesson={lesson}
                          locale={locale}
                          variant="upcoming"
                          onOpen={() => openLesson(lesson)}
                          approveLabel={t("booking.approve")}
                          rejectLabel={t("booking.reject")}
                          joinLabel={t("tutorDash.joinLesson")}
                        />
                      ))
                    )}
                  </DashboardCard>
                </div>

                <div className="space-y-6">
                  <AvailabilityOverviewCard
                    overview={overview.availability}
                    t={t}
                    onManage={() => handleTabChange("availability")}
                  />

                  <DashboardCard>
                    <div className="flex items-center justify-between px-5 py-4">
                      <h2 className="font-bold text-[var(--text-primary)]">
                        {t("tutorDash.recentConversations")}
                      </h2>
                      <button
                        type="button"
                        onClick={() => handleTabChange("messages")}
                        className="text-xs font-semibold text-[var(--primary)]"
                      >
                        {t("tutorDash.viewAllMessages")}
                      </button>
                    </div>
                    {conversations.length === 0 ? (
                      <EmptyState
                        icon={MessageSquare}
                        title={t("dash.chats.empty")}
                        description={t("dash.chats.empty")}
                      />
                    ) : (
                      <div className="divide-y divide-[var(--border)]">
                        {conversations.slice(0, 4).map((conversation) => (
                          <button
                            key={conversation.id}
                            type="button"
                            onClick={() => handleTabChange("messages")}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-[var(--chip)]"
                          >
                            <Avatar name={conversation.counterpartyName} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                                {conversation.counterpartyName}
                              </p>
                              <p className="truncate text-xs text-[var(--text-muted)]">
                                {conversation.lastMessage?.content ?? t("chat.emptyThread")}
                              </p>
                            </div>
                            {conversation.unread && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </DashboardCard>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    <DashboardCard className="p-5">
                      <GraduationCap className="mb-4 h-10 w-10 rounded-2xl bg-[var(--primary-soft)] p-2 text-[var(--primary)]" />
                      <h3 className="font-bold text-[var(--text-primary)]">
                        {t("tutorDash.referTitle")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t("tutorDash.referDesc")}
                      </p>
                    </DashboardCard>
                    <DashboardCard className="group relative p-5 transition duration-200 hover:-translate-y-0.5">
                      <CheckCircle2 className="mb-4 h-10 w-10 rounded-2xl bg-[var(--primary-soft)] p-2 text-[var(--primary)]" />
                      <h3 className="font-bold text-[var(--text-primary)]">
                        {t("tutorDash.boostTitle")}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {t("tutorDash.boostDesc")}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleTabChange("profile")}
                        aria-label={t("tutorDash.boostTitle")}
                        className="absolute inset-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                      />
                    </DashboardCard>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "requests" && (
            <DashboardCard>
              <div className="px-5 py-4">
                <h2 className="font-bold text-[var(--text-primary)]">
                  {t("tutorDash.pendingBookingRequests")}
                </h2>
              </div>
              {pending.length === 0 ? (
                <EmptyState
                  icon={Calendar}
                  title={t("tutorDash.noPendingTitle")}
                  description={t("tutorDash.noPendingDesc")}
                />
              ) : (
                pending.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    locale={locale}
                    variant="request"
                    onOpen={() => openLesson(lesson)}
                    onApprove={() => handleApproveBooking(lesson.id)}
                    onReject={() => handleRejectBooking(lesson.id)}
                    actionLoading={actionLoading === lesson.id}
                    approveLabel={t("booking.approve")}
                    rejectLabel={t("booking.reject")}
                    joinLabel={t("tutorDash.joinLesson")}
                  />
                ))
              )}
            </DashboardCard>
          )}

          {tab === "upcoming" && (
            <DashboardCard>
              <div className="px-5 py-4">
                <h2 className="font-bold text-[var(--text-primary)]">
                  {t("tutorDash.upcomingLessons")}
                </h2>
              </div>
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={t("tutorDash.noUpcomingTitle")}
                  description={t("tutorDash.noUpcomingDesc")}
                  action={{
                    label: t("tutorDash.setAvailability"),
                    onClick: () => handleTabChange("availability"),
                  }}
                />
              ) : (
                upcoming.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    locale={locale}
                    variant="upcoming"
                    onOpen={() => openLesson(lesson)}
                    approveLabel={t("booking.approve")}
                    rejectLabel={t("booking.reject")}
                    joinLabel={t("tutorDash.joinLesson")}
                  />
                ))
              )}
            </DashboardCard>
          )}

          {tab === "messages" && (
            <DashboardCard className="p-5">
              <ChatInbox onActivity={refreshLiveFeed} />
            </DashboardCard>
          )}

          {tab === "availability" && (
            <WeeklyAvailabilityEditor onDirtyChange={setAvailabilityDirty} />
          )}

          {tab === "profile" && (
            <DashboardCard className="p-6 sm:p-8">
              <TutorProfileEditor
                tutorProfileId={overview?.tutorProfileId}
                onSaved={refreshDashboard}
              />
            </DashboardCard>
          )}

          {tab === "notifications" && (
            <DashboardCard className="p-6">
              <NotificationsPanel onRefresh={refreshLiveFeed} />
            </DashboardCard>
          )}

          {tab === "settings" && (
            <DashboardCard className="p-6">
              <h2 className="mb-6 text-xl font-bold text-[var(--text-primary)]">
                {t("tutorDash.nav.settings")}
              </h2>
              <AccountSettingsPanel />
            </DashboardCard>
          )}
          </div>
        </main>
      </div>
    </div>
  )
}
