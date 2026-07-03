"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { api, type AppNotification } from "@/lib/api-client"
import { playNotificationSound } from "@/lib/play-notification-sound"

export const LIVE_FEED_POLL_INTERVAL_MS = 3000

function hasNewUnreadNotification(
  previous: AppNotification[],
  next: AppNotification[],
): boolean {
  const previousIds = new Set(previous.filter((item) => !item.read).map((item) => item.id))
  return next.some((item) => !item.read && !previousIds.has(item.id))
}

export function useLiveNotifications(enabled: boolean) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const previousNotificationsRef = useRef<AppNotification[]>([])
  const previousUnreadRef = useRef(0)
  const initializedRef = useRef(false)

  const refresh = useCallback(async () => {
    try {
      const [unread, notificationData] = await Promise.all([
        api.notifications.unreadCount(),
        api.notifications.list(),
      ])

      const shouldPlaySound =
        initializedRef.current &&
        (unread.count > previousUnreadRef.current ||
          hasNewUnreadNotification(previousNotificationsRef.current, notificationData))

      previousUnreadRef.current = unread.count
      previousNotificationsRef.current = notificationData

      setUnreadCount(unread.count)
      setNotifications(notificationData)

      if (shouldPlaySound) {
        playNotificationSound()
      }

      initializedRef.current = true

      return { unreadCount: unread.count, notifications: notificationData }
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    void refresh()
    const interval = setInterval(() => {
      void refresh()
    }, LIVE_FEED_POLL_INTERVAL_MS)

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refresh()
      }
    }

    window.addEventListener("focus", handleVisibility)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleVisibility)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [enabled, refresh])

  return { unreadCount, notifications, refresh }
}
