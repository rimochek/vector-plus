"use client"

import { useState, useEffect, useRef } from "react"
import { X, Send, Sparkles, Loader2 } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { TUTORS_DATA } from "@/app/components/tutors-data"
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

    const apiKey = ""
    const systemPrompt = `You are the Vector+ Scout, an AI assistant for a tutor platform. 
    Your goal is to help students find tutors based on their interests.
    Here is the tutor database: ${JSON.stringify(TUTORS_DATA)}.
    Suggest specific tutors from this list that match the user's request. 
    Keep responses friendly, professional, and concise.`

    try {
      let retries = 0
      const maxRetries = 5
      let success = false
      let resultText = ""

      while (retries < maxRetries && !success) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: userMsg }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] },
              }),
            },
          )
          const data = await response.json()
          resultText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || t("ai.noMatch")
          success = true
        } catch {
          retries++
          await new Promise((res) =>
            setTimeout(res, Math.pow(2, retries) * 1000),
          )
        }
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: resultText },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: t("ai.connectionError"),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 sm:bottom-6 sm:right-6 sm:z-50">
      {isOpen ? (
        <div className="flex h-[min(550px,calc(100dvh-5rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[2.5rem] border border-violet-100 bg-white shadow-[0_20px_50px_rgba(139,92,246,0.15)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="bg-[#8B5CF6] p-6 flex justify-between items-center">
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
            className="flex-grow overflow-y-auto overscroll-contain p-5 space-y-4 bg-slate-50/50 dark:bg-zinc-950/80"
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#8B5CF6] text-white rounded-tr-none"
                      : "bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-200 border border-slate-100 dark:border-zinc-600 rounded-tl-none shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-600 p-4 rounded-3xl rounded-tl-none shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-[#8B5CF6]" />
                </div>
              </div>
            )}
          </div>

          <div className="p-5 bg-white dark:bg-zinc-900 border-t border-slate-50 dark:border-zinc-700 flex gap-2">
            <input
              type="text"
              placeholder={t("ai.placeholder")}
              className="flex-grow bg-slate-100 dark:bg-zinc-800 dark:text-zinc-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#8B5CF6]/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
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
              className="bg-[#8B5CF6] text-white p-3 rounded-2xl hover:bg-[#7c4dff] transition-all shadow-lg shadow-violet-200 dark:shadow-violet-950/40"
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
            className="group flex items-center gap-3 rounded-full border border-violet-50 bg-white p-2 pr-6 shadow-[0_10px_30px_rgba(139,92,246,0.2)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(139,92,246,0.3)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)]"
          >
            <div className="rounded-full bg-[#8B5CF6] p-4 shadow-lg shadow-violet-200 transition-transform group-hover:rotate-12">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <span className="block text-sm font-bold text-[#1E293B] dark:text-zinc-100">
                {t("ai.askScout")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">
                {t("ai.online")}
              </span>
            </div>
          </button>
        )
      )}
    </div>
  )
}