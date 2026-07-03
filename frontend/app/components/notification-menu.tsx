"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type AppNotification } from "@/lib/api-client"
import { useLiveNotifications } from "@/lib/use-live-notifications"

type NotificationMenuProps = {
  notificationsHref: string
}

function formatWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotificationMenu({ notificationsHref }: NotificationMenuProps) {
  const { t, locale } = useTranslations()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const markedOnOpenRef = useRef(false)
  const { unreadCount, refresh } = useLiveNotifications(true)

  const loadPreview = useCallback(async () => {
    setLoading(true)
    try {
      const list = await api.notifications.list()
      setItems(list.slice(0, 4))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) {
      markedOnOpenRef.current = false
      return
    }

    void loadPreview()
  }, [loadPreview, open])

  useEffect(() => {
    if (!open || markedOnOpenRef.current) return

    const markOpenNotificationsRead = async () => {
      try {
        const unread = await api.notifications.unreadCount()
        if (unread.count === 0) {
          markedOnOpenRef.current = true
          return
        }

        await api.notifications.markAllRead()
        markedOnOpenRef.current = true
        setItems((prev) => prev.map((item) => ({ ...item, read: true })))
        await refresh()
        await loadPreview()
      } catch {
        markedOnOpenRef.current = true
      }
    }

    void markOpenNotificationsRead()
  }, [loadPreview, open, refresh])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("nav.notifications")}
        aria-expanded={open}
        aria-haspopup="menu"
        className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-[var(--border)] dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--primary-from)] ring-2 ring-white dark:ring-black" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-[var(--border)] dark:bg-[var(--surface)]"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-[var(--border)]">
            <p className="text-sm font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
              {t("nav.notifications")}
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[var(--primary-from)]" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm font-semibold text-slate-400">
                {t("dash.notifications.empty")}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-slate-50 px-4 py-3 last:border-b-0 dark:border-[var(--border)]/80 ${
                    !item.read ? "bg-violet-50/50 dark:bg-violet-950/20" : ""
                  }`}
                >
                  <p className="text-sm font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                    {item.title}
                  </p>
                  {item.body && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500 dark:text-[var(--text-muted)]">
                      {item.body}
                    </p>
                  )}
                  <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {formatWhen(item.createdAt, locale)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 p-2 dark:border-[var(--border)]">
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-violet-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--primary-from)] transition hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-950/60"
            >
              {t("nav.openNotifications")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
