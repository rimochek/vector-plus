"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Send } from "lucide-react"
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

const POLL_INTERVAL_MS = 4000

type TimelineItem =
  | { kind: "message"; id: string; createdAt: string; message: ChatMessage }
  | { kind: "lesson"; id: string; createdAt: string; lesson: ChatLesson }

type ChatInboxProps = {
  onConversationChange?: (id: string | null) => void
}

export function ChatInbox({ onConversationChange }: ChatInboxProps) {
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
    setMessages([])
    setLessons([])
    loadMessages()
    loadLessons(activeId)

    const interval = setInterval(() => {
      if (lastPollRef.current) {
        loadMessages(lastPollRef.current)
      }
      loadLessons(activeId)
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [activeId, t, loadLessons])

  useEffect(() => {
    if (timeline.length === 0) return
    requestAnimationFrame(() => {
      scrollMessagesToBottom()
    })
  }, [timeline, scrollMessagesToBottom])

  const handleSend = async () => {
    if (!activeId || !draft.trim()) return
    setSending(true)
    try {
      const msg = await api.chat.send(activeId, draft.trim())
      setMessages((prev) => [...prev, msg])
      lastPollRef.current = msg.createdAt
      setDraft("")
      loadConversations()
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
        <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
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

      <div className="flex h-[min(560px,calc(100dvh-14rem))] flex-col gap-0 overflow-hidden rounded-[2rem] border border-slate-100 dark:border-zinc-800 lg:flex-row">
        <aside className="w-full shrink-0 border-b border-slate-100 dark:border-zinc-800 lg:w-72 lg:border-b-0 lg:border-r">
          <div className="max-h-48 overflow-y-auto overscroll-contain lg:max-h-none lg:h-full">
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
                  className={`flex w-full items-center gap-3 border-b border-slate-50 p-4 text-left transition hover:bg-violet-50/50 dark:border-zinc-900 dark:hover:bg-violet-950/20 ${
                    activeId === conv.id ? "bg-violet-50 dark:bg-violet-950/30" : ""
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8B5CF6] text-sm font-black text-white">
                    {conv.counterpartyName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black text-[#1E293B] dark:text-zinc-100">
                      {conv.counterpartyName}
                    </p>
                    {conv.lastMessage && (
                      <p className="truncate text-xs font-semibold text-slate-400">
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  {conv.unread && (
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#8B5CF6]" />
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-h-0 flex-1 flex-col">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-8 text-sm font-semibold text-slate-400">
              {t("chat.selectConversation")}
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-slate-100 px-6 py-4 dark:border-zinc-800">
                <p className="font-black text-[#1E293B] dark:text-zinc-100">
                  {activeConversation?.counterpartyName}
                </p>
              </div>

              <div
                ref={messagesContainerRef}
                className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-6"
              >
                {timeline.length === 0 ? (
                  <p className="text-center text-sm font-semibold text-slate-400">
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
                              ? "bg-[#8B5CF6] text-white"
                              : "bg-slate-100 text-[#1E293B] dark:bg-zinc-800 dark:text-zinc-100"
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

              <div className="flex shrink-0 gap-2 border-t border-slate-100 p-4 dark:border-zinc-800">
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
                  className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-[#8B5CF6] dark:border-zinc-700 dark:bg-zinc-900"
                />
                <button
                  type="button"
                  disabled={sending || !draft.trim()}
                  onClick={handleSend}
                  className="rounded-2xl bg-[#8B5CF6] p-3 text-white disabled:opacity-50"
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
