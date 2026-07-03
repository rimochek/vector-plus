"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { useChat } from "@/lib/chat-context"
import { useAuthSession } from "@/lib/use-auth-session"

export const AIChatAssistant = () => {
  const { t, locale } = useTranslations()
  const { isOpen, openChat, closeChat } = useChat()
  const { isLoggedIn, ready } = useAuthSession()
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([{ role: "assistant", content: t("ai.welcome") }])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMessages([{ role: "assistant", content: t("ai.welcome") }])
    })
    return () => cancelAnimationFrame(id)
  }, [locale, t])

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current
    if (!container) return
    container.scrollTo({ top: container.scrollHeight, behavior })
  }

  useEffect(() => {
    if (!isOpen || messages.length === 0) return
    requestAnimationFrame(() => {
      scrollToBottom()
    })
  }, [messages, isOpen])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = input
    setMessages((prev) => [...prev, { role: "user", content: userMsg }])
    setInput("")
    setIsLoading(true)
    window.setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: t("ai.limited") },
      ])
      setIsLoading(false)
    }, 350)
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6 sm:z-50">
      {isOpen ? (
        <div className="flex h-[min(550px,calc(100dvh-5rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)]">
          <div className="bg-[var(--primary-from)] p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                <Sparkles className="text-white w-5 h-5" />
              </div>
              <div>
                <span className="text-white font-bold block leading-tight">
                  {t("ai.scoutTitle")}
                </span>
                <span className="text-white/70 text-[10px] uppercase font-bold tracking-widest">
                  {t("ai.scoutSubtitle")}
                </span>
              </div>
            </div>
            <button
              onClick={closeChat}
              className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-grow overflow-y-auto overscroll-contain p-5 space-y-4 bg-slate-50/50 dark:bg-[var(--bg)]"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[var(--primary-from)] text-white rounded-tr-none"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] rounded-tl-none shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-tl-none border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary-from)]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-white dark:bg-[var(--surface)] border-t border-slate-50 dark:border-[var(--border)] flex gap-2">
            <input
              type="text"
              placeholder={t("ai.placeholder")}
              className="flex-grow rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-5 py-3 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--primary-from)]/50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <button
              onClick={handleSend}
              className="rounded-2xl bg-[var(--primary)] p-3 text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition-all hover:bg-[var(--primary-hover)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        ready &&
        !isLoggedIn && (
          <button
            onClick={openChat}
            className="group flex items-center gap-3 rounded-full border border-violet-50 bg-white p-2 pr-6 shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(139,92,246,0.3)] dark:border-[var(--border)] dark:bg-[var(--surface)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="rounded-full bg-[var(--primary-from)] p-4 shadow-lg shadow-violet-200 transition-transform group-hover:rotate-12">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                {t("ai.askScout")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary-from)]">
                {t("ai.online")}
              </span>
            </div>
          </button>
        )
      )}
    </div>
  )
}