"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type AppNotification } from "@/lib/api-client"

function formatWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function NotificationsPanel() {
  const { t, locale } = useTranslations()
  const [items, setItems] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    load()
  }, [load])

  const markRead = async (id: string) => {
    await api.notifications.markRead(id)
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  const markAllRead = async () => {
    await api.notifications.markAllRead()
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <p className="font-semibold text-slate-400 dark:text-zinc-500">
        {t("dash.notifications.empty")}
      </p>
    )
  }

  const unread = items.filter((n) => !n.read).length

  return (
    <div className="space-y-4">
      {unread > 0 && (
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-bold text-[#8B5CF6] hover:underline"
        >
          {t("notifications.markAllRead")}
        </button>
      )}
      <div className="space-y-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => !item.read && markRead(item.id)}
            className={`flex w-full items-start gap-4 rounded-[2rem] border p-5 text-left transition ${
              item.read
                ? "border-slate-100 bg-slate-50/80 dark:border-zinc-800 dark:bg-zinc-900/50"
                : "border-violet-100 bg-violet-50/60 dark:border-violet-900/40 dark:bg-violet-950/20"
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#8B5CF6] text-white">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-black text-[#1E293B] dark:text-zinc-100">{item.title}</p>
              {item.body && (
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-zinc-400">
                  {item.body}
                </p>
              )}
              <p className="mt-2 text-xs font-semibold text-slate-400">
                {formatWhen(item.createdAt, locale)}
              </p>
            </div>
            {!item.read && (
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#8B5CF6]" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
