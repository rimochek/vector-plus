"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type AppNotification } from "@/lib/api-client"
import { EmptyState } from "@/app/components/ui/empty-state"
import { LIVE_FEED_POLL_INTERVAL_MS } from "@/lib/use-live-notifications"

function formatWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

type NotificationsPanelProps = {
  onRefresh?: () => Promise<void>
  autoMarkRead?: boolean
}

export function NotificationsPanel({
  onRefresh,
  autoMarkRead = true,
}: NotificationsPanelProps = {}) {
  const { t, locale } = useTranslations()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const autoMarkedRef = useRef(false)

  const load = useCallback(async () => {
    try {
      const data = await api.notifications.list()
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  const markAllRead = useCallback(async () => {
    await api.notifications.markAllRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
    await onRefresh?.()
  }, [onRefresh])

  useEffect(() => {
    void load()
    const interval = setInterval(() => {
      void load()
    }, LIVE_FEED_POLL_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void load()
      }
    }

    window.addEventListener("focus", handleVisibility)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleVisibility)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [load])

  useEffect(() => {
    if (!autoMarkRead || loading || autoMarkedRef.current) return
    if (!items.some((item) => !item.read)) {
      autoMarkedRef.current = true
      return
    }

    autoMarkedRef.current = true
    void markAllRead()
  }, [autoMarkRead, items, loading, markAllRead])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-from)]" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title={t("dash.notifications.empty")}
        description={t("dash.notifications.empty")}
      />
    )
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {items.map((notification) => (
          <li key={notification.id}>
            <div
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                notification.read
                  ? "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                  : "border-[var(--primary-soft)] bg-[var(--primary-soft)] text-[var(--text-primary)]"
              }`}
            >
              <p className="text-sm font-semibold">{notification.title}</p>
              {notification.body && (
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {notification.body}
                </p>
              )}
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {formatWhen(notification.createdAt, locale)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
