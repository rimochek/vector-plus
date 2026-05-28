"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type AppNotification } from "@/lib/api-client"

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
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, unread] = await Promise.all([
        api.notifications.list(),
        api.notifications.unreadCount(),
      ])
      setItems(list.slice(0, 4))
      setUnreadCount(unread.count)
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    load()
  }, [open, load])

  useEffect(() => {
    load()
  }, [load])

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
        className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#8B5CF6] ring-2 ring-white dark:ring-zinc-950" />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <p className="text-sm font-black text-[#1E293B] dark:text-zinc-100">
              {t("nav.notifications")}
            </p>
            {unreadCount > 0 && (
              <p className="mt-0.5 text-xs font-semibold text-[#8B5CF6]">
                {t("nav.notificationsUnread", { count: unreadCount })}
              </p>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-[#8B5CF6]" />
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm font-semibold text-slate-400">
                {t("dash.notifications.empty")}
              </p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className={`border-b border-slate-50 px-4 py-3 last:border-b-0 dark:border-zinc-800/80 ${
                    !item.read ? "bg-violet-50/50 dark:bg-violet-950/20" : ""
                  }`}
                >
                  <p className="text-sm font-bold text-[#1E293B] dark:text-zinc-100">
                    {item.title}
                  </p>
                  {item.body && (
                    <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
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

          <div className="border-t border-slate-100 p-2 dark:border-zinc-800">
            <Link
              href={notificationsHref}
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-xl bg-violet-50 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-[#8B5CF6] transition hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-950/60"
            >
              {t("nav.openNotifications")}
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
