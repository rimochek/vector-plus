"use client"

import { useCallback, useEffect, useState } from "react"
import { api, type ConversationSummary } from "@/lib/api-client"
import {
  LIVE_FEED_POLL_INTERVAL_MS,
  useLiveNotifications,
} from "@/lib/use-live-notifications"

export { LIVE_FEED_POLL_INTERVAL_MS }

export function useLiveDashboardFeed(enabled: boolean) {
  const { unreadCount: unreadNotifications, refresh: refreshNotifications } =
    useLiveNotifications(enabled)
  const [conversations, setConversations] = useState<ConversationSummary[]>([])

  const refreshConversations = useCallback(async () => {
    try {
      const conversationData = await api.chat.conversations()
      setConversations(conversationData)
    } catch {
      // Keep last known conversations on transient errors.
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([refreshNotifications(), refreshConversations()])
  }, [refreshConversations, refreshNotifications])

  useEffect(() => {
    if (!enabled) return

    void refreshConversations()
    const interval = setInterval(() => {
      void refreshConversations()
    }, LIVE_FEED_POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [enabled, refreshConversations])

  return { unreadNotifications, conversations, refresh }
}
