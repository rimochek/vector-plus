"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Search, Send, X } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import {
  api,
  type CancelBookingReason,
  type ChatLesson,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/api-client"
import { getStoredUser } from "@/lib/auth-client"
import { CancelLessonModal } from "@/app/components/cancel-lesson-modal"
import { LessonChatCard } from "@/app/components/lesson-chat-card"
import { useToast } from "@/lib/toast-context"
import { LIVE_FEED_POLL_INTERVAL_MS } from "@/lib/use-live-dashboard-feed"

type TimelineItem =
  | { kind: "message"; id: string; createdAt: string; message: ChatMessage }
  | { kind: "lesson"; id: string; createdAt: string; lesson: ChatLesson }

type ChatInboxProps = {
  onConversationChange?: (id: string | null) => void
  onActivity?: () => void
}

export function ChatInbox({ onConversationChange, onActivity }: ChatInboxProps) {
  const { t, locale } = useTranslations()
  const toast = useToast()
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [lessons, setLessons] = useState<ChatLesson[]>([])
  const [draft, setDraft] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cancelLessonId, setCancelLessonId] = useState<string | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const lastPollRef = useRef<string | null>(null)
  const stickToBottomRef = useRef(true)
  const userId = getStoredUser()?.id ?? ""
  const isTutor = (getStoredUser()?.role ?? getStoredUser()?.roles?.[0]) === "tutor"

  const timeline = useMemo(() => {
    const items: TimelineItem[] = [
      ...lessons.map((lesson) => ({
        kind: "lesson" as const,
        id: `lesson-${lesson.id}`,
        createdAt: lesson.createdAt,
        lesson,
      })),
      ...messages.map((message) => ({
        kind: "message" as const,
        id: `message-${message.id}`,
        createdAt: message.createdAt,
        message,
      })),
    ]
    return items.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )
  }, [lessons, messages])

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior })
  }, [])

  const updateStickToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    stickToBottomRef.current = distanceFromBottom <= 80
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const data = await api.chat.conversations()
      setConversations(data)
    } catch {
      setError(t("chat.loadError"))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadLessons = useCallback(async (conversationId: string) => {
    try {
      const data = await api.chat.lessons(conversationId)
      setLessons(data)
    } catch {
      setLessons([])
    }
  }, [])

  useEffect(() => {
    loadConversations()
    const interval = setInterval(() => {
      void loadConversations()
    }, LIVE_FEED_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [loadConversations])

  useEffect(() => {
    onConversationChange?.(activeId)
  }, [activeId, onConversationChange])

  useEffect(() => {
    if (!activeId) return

    let cancelled = false

    const loadMessages = async (since?: string) => {
      try {
        const data = await api.chat.messages(activeId, since)
        if (cancelled) return
        if (since) {
          if (data.length > 0) {
            setMessages((prev) => [...prev, ...data])
            onActivity?.()
          }
        } else {
          setMessages(data)
        }
        if (data.length > 0) {
          lastPollRef.current = data[data.length - 1].createdAt
        }
      } catch {
        if (!since) setError(t("chat.loadError"))
      }
    }

    lastPollRef.current = null
    stickToBottomRef.current = true
    setMessages([])
    setLessons([])
    loadMessages()
    loadLessons(activeId)

    const interval = setInterval(() => {
      if (lastPollRef.current) {
        loadMessages(lastPollRef.current)
      }
      loadLessons(activeId)
    }, LIVE_FEED_POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeId, t, loadLessons, onActivity])

  useEffect(() => {
    if (timeline.length === 0 || !stickToBottomRef.current) return
    requestAnimationFrame(() => {
      scrollMessagesToBottom(timeline.length <= 1 ? "auto" : "smooth")
    })
  }, [timeline, scrollMessagesToBottom])

  const handleSend = async () => {
    if (!activeId || !draft.trim()) return
    stickToBottomRef.current = true
    setSending(true)
    try {
      const msg = await api.chat.send(activeId, draft.trim())
      setMessages((prev) => [...prev, msg])
      lastPollRef.current = msg.createdAt
      setDraft("")
      loadConversations()
      onActivity?.()
    } catch {
      setError(t("chat.sendError"))
    } finally {
      setSending(false)
    }
  }

  const handleCancelLesson = async (reason: CancelBookingReason, otherText?: string) => {
    if (!cancelLessonId || !activeId) return
    try {
      await api.bookings.cancel(cancelLessonId, { reason, otherText })
      toast.success(t("cancel.success"))
      await loadLessons(activeId)
      setCancelLessonId(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
      throw err
    }
  }

  const handleApproveLesson = async (lessonId: string) => {
    if (!activeId) return
    try {
      await api.bookings.approve(lessonId)
      toast.success(t("booking.approveSuccess"))
      await loadLessons(activeId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
    }
  }

  const handleRejectLesson = async (lessonId: string) => {
    if (!activeId) return
    try {
      await api.bookings.reject(lessonId)
      toast.success(t("booking.rejectSuccess"))
      await loadLessons(activeId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("booking.error"))
    }
  }

  const activeConversation = conversations.find((c) => c.id === activeId)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-from)]" />
      </div>
    )
  }

  return (
    <>
      <CancelLessonModal
        open={Boolean(cancelLessonId)}
        onClose={() => setCancelLessonId(null)}
        onConfirm={handleCancelLesson}
        variant={isTutor ? "tutor" : "student"}
      />

      <div className="flex h-[min(680px,calc(100dvh-12rem))] flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)] lg:flex-row">
        <aside className={`w-full shrink-0 border-b border-[var(--border)] lg:w-80 lg:border-b-0 lg:border-r ${activeId ? "hidden lg:block" : "block"}`}>
          <div className="border-b border-[var(--border)] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="search"
                placeholder={t("chat.searchPlaceholder")}
                className="w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-secondary)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto overscroll-contain lg:h-full lg:max-h-none">
            {conversations.length === 0 ? (
              <p className="p-6 text-sm font-semibold text-slate-400">
                {t("dash.chats.empty")}
              </p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => setActiveId(conv.id)}
                  className={`flex w-full items-center gap-3 border-b border-[var(--border)] p-4 text-left transition duration-150 hover:bg-[var(--primary-soft)] ${
                    activeId === conv.id ? "bg-[var(--primary-soft)]" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-from)] text-sm font-black text-white">
                    {conv.counterpartyName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                      {conv.counterpartyName}
                    </p>
                    {conv.lastMessage && (
                      <p className="truncate text-xs font-medium text-[var(--text-muted)]">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unread && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--primary-from)]" />
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <div
          className={`min-h-0 flex-1 flex-col ${
            activeId
              ? "fixed inset-0 z-[250] flex bg-[var(--surface)] lg:relative lg:inset-auto lg:z-auto"
              : "hidden lg:flex"
          }`}
        >
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm font-semibold text-[var(--text-muted)]">
              {t("chat.selectConversation")}
            </div>
          ) : (
            <>
              <div className="flex shrink-0 items-center gap-3 border-b border-[var(--border)] px-4 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--chip)] lg:hidden"
                  aria-label={t("lead.close")}
                >
                  <X className="h-5 w-5" />
                </button>
                <p className="font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                  {activeConversation?.counterpartyName}
                </p>
              </div>

              <div
                ref={messagesContainerRef}
                onScroll={updateStickToBottom}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6"
              >
                {timeline.length === 0 ? (
                  <p className="text-center text-sm font-semibold text-[var(--text-muted)]">
                    {t("chat.emptyThread")}
                  </p>
                ) : (
                  timeline.map((item) => {
                    if (item.kind === "lesson") {
                      return (
                        <LessonChatCard
                          key={item.id}
                          lesson={item.lesson}
                          locale={locale}
                          isTutor={isTutor}
                          onCancel={
                            item.lesson.status === "upcoming" ||
                            item.lesson.status === "pending"
                              ? setCancelLessonId
                              : undefined
                          }
                          onApprove={
                            isTutor && item.lesson.status === "pending"
                              ? handleApproveLesson
                              : undefined
                          }
                          onReject={
                            isTutor && item.lesson.status === "pending"
                              ? handleRejectLesson
                              : undefined
                          }
                        />
                      )
                    }

                    const mine = item.message.senderId === userId
                    return (
                      <div
                        key={item.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium ${
                            mine
                              ? "bg-[var(--primary-from)] text-white"
                              : "bg-[var(--surface-secondary)] text-[var(--text-primary)]"
                          }`}
                        >
                          {item.message.content}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {error && (
                <p className="shrink-0 px-6 text-sm font-semibold text-red-500">{error}</p>
              )}

              <div className="flex shrink-0 gap-2 border-t border-[var(--border)] p-4">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                  placeholder={t("chat.placeholder")}
                  className="min-w-0 flex-1 rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-medium outline-none focus:border-[var(--primary)]"
                />
                <button
                  type="button"
                  disabled={sending || !draft.trim()}
                  onClick={handleSend}
                  className="rounded-[var(--radius-button)] bg-[var(--primary)] p-3 text-[var(--primary-foreground)] transition duration-150 hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
