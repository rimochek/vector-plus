"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Link from "next/link"
import {
  Search,
  BookOpen,
  Star,
  Users,
  Calendar,
  CheckCircle,
  ChevronRight,
  Menu,
  X,
  Filter,
  MessageSquare,
  Clock,
  Award,
  Globe,
  ArrowRight,
  User,
  LogOut,
  Bell,
  Settings,
  Send,
  Navigation as NavIcon,
  Sparkles,
  Loader2,
  Moon,
  Sun,
} from "lucide-react"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { useTranslations } from "@/lib/i18n/locale-context"
import { LanguageSwitcher } from "@/app/components/language-switcher"

const TUTORS_DATA = [
  {
    id: 1,
    name: "Dr. Sarah Jenkins",
    subject: "Mathematics",
    expertise: ["Calculus", "Linear Algebra", "Statistics"],
    rating: 4.9,
    reviews: 124,
    price: 45,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    bio: "PhD in Mathematics with 10+ years of teaching experience. I simplify complex concepts.",
    availability: "Next: Today, 4:00 PM",
    verified: true,
  },
  {
    id: 2,
    name: "James Wilson",
    subject: "Computer Science",
    expertise: ["React", "Python", "Data Structures"],
    rating: 4.8,
    reviews: 89,
    price: 55,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Senior Software Engineer. I help students build real-world projects while learning theory.",
    availability: "Next: Tomorrow, 10:00 AM",
    verified: true,
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    subject: "Languages",
    expertise: ["Spanish", "French", "ESL"],
    rating: 5.0,
    reviews: 210,
    price: 35,
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    bio: "Native speaker and certified linguist. My lessons are interactive and culture-focused.",
    availability: "Next: Monday, 2:00 PM",
    verified: true,
  },
  {
    id: 4,
    name: "Michael Chen",
    subject: "Physics",
    expertise: ["Quantum Mechanics", "Thermodynamics"],
    rating: 4.7,
    reviews: 45,
    price: 40,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    bio: "Passionate educator focusing on visual learning and practical experiments.",
    availability: "Next: Wednesday, 5:00 PM",
    verified: false,
  },
]

const AIChatAssistant = () => {
  const { t, locale } = useTranslations()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([{ role: "assistant", content: t("ai.welcome") }])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setMessages([{ role: "assistant", content: t("ai.welcome") }])
    })
    return () => cancelAnimationFrame(id)
  }, [locale, t])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="bg-white dark:bg-zinc-900 w-[380px] h-[550px] rounded-[2.5rem] shadow-[0_20px_50px_rgba(139,92,246,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-violet-100 dark:border-zinc-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
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
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-zinc-950/80">
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
            <div ref={chatEndRef} />
          </div>

          <div className="p-5 bg-white dark:bg-zinc-900 border-t border-slate-50 dark:border-zinc-700 flex gap-2">
            <input
              type="text"
              placeholder={t("ai.placeholder")}
              className="flex-grow bg-slate-100 dark:bg-zinc-800 dark:text-zinc-100 border-none rounded-2xl px-5 py-3 text-sm focus:ring-2 focus:ring-[#8B5CF6]/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
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
        <button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-3 bg-white dark:bg-zinc-900 p-2 pr-6 rounded-full shadow-[0_10px_30px_rgba(139,92,246,0.2)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_40px_rgba(139,92,246,0.3)] dark:hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all border border-violet-50 dark:border-zinc-700"
        >
          <div className="bg-[#8B5CF6] p-4 rounded-full shadow-lg shadow-violet-200 group-hover:rotate-12 transition-transform">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <div className="text-left">
            <span className="text-[#1E293B] dark:text-zinc-100 font-bold block text-sm">
              {t("ai.askScout")}
            </span>
            <span className="text-[#8B5CF6] text-[10px] font-bold uppercase tracking-wider">
              {t("ai.online")}
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

const Navigation = ({
  activeTab,
  setActiveTab,
  darkMode,
  onToggleTheme,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  darkMode: boolean
  onToggleTheme: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslations()

  const navItems: { tab: string; label: string }[] = [
    { tab: "home", label: t("nav.home") },
    { tab: "findtutors", label: t("nav.findTutors") },
    { tab: "dashboard", label: t("nav.dashboard") },
  ]

  return (
    <nav className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-zinc-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setActiveTab("home")}
          >
            <div className="bg-[#8B5CF6] p-2.5 rounded-[14px] rotate-12 group-hover:rotate-45 transition-transform duration-500 shadow-lg shadow-violet-200 dark:shadow-violet-900/40">
              <NavIcon className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black text-[#1E293B] dark:text-zinc-100 tracking-tight">
              Vector<span className="text-[#8B5CF6]">+</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            {navItems.map((item) => (
              <button
                key={item.tab}
                onClick={() => setActiveTab(item.tab)}
                className={`relative px-1 py-1 text-sm font-bold tracking-wide uppercase transition-all ${
                  activeTab === item.tab
                    ? "text-[#8B5CF6]"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                }`}
              >
                {item.label}
                {activeTab === item.tab && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-[#8B5CF6] rounded-full"></span>
                )}
              </button>
            ))}
            <div className="flex items-center gap-3 ml-6">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={
                  darkMode ? t("theme.lightAria") : t("theme.darkAria")
                }
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
              <LanguageSwitcher />
              <Link
                href="/login"
                className="text-slate-500 dark:text-zinc-400 hover:text-[#1E293B] dark:hover:text-zinc-100 font-bold text-sm"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                className="bg-[#1E293B] dark:bg-zinc-100 text-white dark:text-zinc-950 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-slate-800 dark:hover:bg-white transition-all shadow-xl shadow-slate-200 dark:shadow-zinc-900/50 inline-flex items-center justify-center"
              >
                {t("nav.join")}
              </Link>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-500 dark:text-zinc-400 p-2"
              aria-expanded={isOpen}
              aria-label={t("nav.menu")}
            >
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-zinc-800 py-6 space-y-1 animate-in slide-in-from-top-2 duration-200">
            {navItems.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => {
                  setActiveTab(item.tab)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-black uppercase tracking-widest ${
                  activeTab === item.tab
                    ? "bg-violet-50 dark:bg-violet-950/40 text-[#8B5CF6]"
                    : "text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80"
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col gap-2 px-4">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="py-3 text-center rounded-2xl border-2 border-slate-200 dark:border-zinc-700 font-bold text-sm text-slate-700 dark:text-zinc-200"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/register"
                onClick={() => setIsOpen(false)}
                className="py-3 text-center rounded-2xl bg-[#1E293B] dark:bg-zinc-100 text-white dark:text-zinc-950 font-bold text-sm"
              >
                {t("nav.join")}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

const LandingPage = ({ onExplore }: { onExplore: () => void }) => {
  const { t } = useTranslations()
  const features = [
    {
      titleKey: "landing.feature.vectorMatching.title" as const,
      descKey: "landing.feature.vectorMatching.desc" as const,
      icon: Sparkles,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950/50",
    },
    {
      titleKey: "landing.feature.eliteNetwork.title" as const,
      descKey: "landing.feature.eliteNetwork.desc" as const,
      icon: NavIcon,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-100 dark:bg-indigo-950/50",
    },
    {
      titleKey: "landing.feature.instantAccess.title" as const,
      descKey: "landing.feature.instantAccess.desc" as const,
      icon: Clock,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-100 dark:bg-emerald-950/50",
    },
  ]

  return (
    <div className="animate-in fade-in duration-1000">
      <section className="relative pt-20 pb-24 lg:pt-32 lg:pb-48 overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[800px] h-[800px] bg-violet-50 dark:bg-violet-950/40 rounded-full blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-50 dark:bg-indigo-950/30 rounded-full blur-[100px] -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-[#8B5CF6] text-xs font-black uppercase tracking-[0.2em] mb-10 animate-bounce border border-violet-100/80 dark:border-violet-800/50">
            <Sparkles className="w-4 h-4" />
            {t("landing.badge")}
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-[#1E293B] dark:text-zinc-50 tracking-tighter mb-8 leading-[0.9]">
            {t("landing.heroLine1")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]">
              {t("landing.heroGradient")}
            </span>
          </h1>
          <p className="text-xl text-slate-500 dark:text-zinc-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
            {t("landing.tagline")}
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={onExplore}
              className="px-10 py-5 bg-[#8B5CF6] text-white rounded-[2rem] font-black text-lg hover:shadow-[0_20px_40px_rgba(139,92,246,0.3)] dark:hover:shadow-[0_20px_40px_rgba(139,92,246,0.25)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              {t("landing.exploreTutors")} <ArrowRight className="w-6 h-6" />
            </button>
            <button className="px-10 py-5 bg-white dark:bg-zinc-900 text-[#1E293B] dark:text-zinc-100 border-2 border-slate-100 dark:border-zinc-700 rounded-[2rem] font-black text-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all shadow-sm">
              {t("landing.howItWorks")}
            </button>
          </div>

          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto opacity-50 grayscale">
            <div className="flex items-center justify-center font-black text-2xl text-slate-400 dark:text-zinc-600 italic tracking-tighter">
              FORBES
            </div>
            <div className="flex items-center justify-center font-black text-2xl text-slate-400 dark:text-zinc-600 italic tracking-tighter">
              WIRED
            </div>
            <div className="flex items-center justify-center font-black text-2xl text-slate-400 dark:text-zinc-600 italic tracking-tighter">
              TECHCRUNCH
            </div>
            <div className="flex items-center justify-center font-black text-2xl text-slate-400 dark:text-zinc-600 italic tracking-tighter">
              THE VERGE
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 bg-[#F8FAFC] dark:bg-zinc-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-10 rounded-[3rem] bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 shadow-sm hover:shadow-xl dark:hover:shadow-black/40 transition-all group"
              >
                <div
                  className={`w-16 h-16 ${feature.bg} ${feature.color} rounded-3xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform shadow-sm`}
                >
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-[#1E293B] dark:text-zinc-100 mb-4">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-slate-500 dark:text-zinc-400 leading-relaxed font-medium">
                  {t(feature.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

const FindTutors = () => {
  const { t } = useTranslations()
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("All")

  const filteredTutors = useMemo(() => {
    return TUTORS_DATA.filter((tutor) => {
      const matchesSearch =
        tutor.name.toLowerCase().includes(search.toLowerCase()) ||
        tutor.subject.toLowerCase().includes(search.toLowerCase())
      const matchesFilter = filter === "All" || tutor.subject === filter
      return matchesSearch && matchesFilter
    })
  }, [search, filter])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div className="max-w-xl">
          <h2 className="text-5xl font-black text-[#1E293B] dark:text-zinc-50 tracking-tight mb-4">
            {t("find.title")}
          </h2>
          <p className="text-slate-400 dark:text-zinc-500 text-lg font-medium">
            {t("find.subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-zinc-600 w-5 h-5 group-focus-within:text-[#8B5CF6] transition-colors" />
            <input
              type="text"
              placeholder={t("find.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-80 pl-14 pr-6 py-5 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-700 rounded-[2rem] focus:border-[#8B5CF6] outline-none shadow-sm transition-all font-medium text-[#1E293B] dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-8 py-5 bg-white dark:bg-zinc-900 border-2 border-slate-100 dark:border-zinc-700 rounded-[2rem] focus:border-[#8B5CF6] outline-none shadow-sm font-black text-[#1E293B] dark:text-zinc-100 uppercase text-xs tracking-widest cursor-pointer"
          >
            <option value="All">{t("find.allDisciplines")}</option>
            <option value="Mathematics">{t("find.math")}</option>
            <option value="Computer Science">{t("find.cs")}</option>
            <option value="Languages">{t("find.languages")}</option>
            <option value="Physics">{t("find.physics")}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {filteredTutors.map((tutor) => (
          <div
            key={tutor.id}
            className="bg-white dark:bg-zinc-950 rounded-[3rem] border border-slate-100 dark:border-zinc-800 overflow-hidden hover:shadow-[0_30px_60px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_30px_60px_rgba(0,0,0,0.45)] hover:-translate-y-3 transition-all duration-500 flex flex-col group"
          >
            <div className="relative h-72 overflow-hidden">
              <img
                src={tutor.image}
                alt={tutor.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              />
              <div className="absolute top-6 left-6 px-4 py-2 bg-white dark:bg-zinc-900 rounded-2xl text-sm font-black text-[#1E293B] dark:text-zinc-100 flex items-center gap-2 shadow-xl border border-slate-100/80 dark:border-zinc-700">
                <Star className="w-4 h-4 text-[#8B5CF6] fill-[#8B5CF6]" />{" "}
                {tutor.rating}
              </div>
              <div className="absolute bottom-6 right-6 bg-[#1E293B] dark:bg-zinc-800 text-white px-5 py-2 rounded-2xl text-sm font-black shadow-2xl">
                ${tutor.price}
                <span className="text-white/40 font-bold ml-1">
                  {t("find.perHour")}
                </span>
              </div>
            </div>

            <div className="p-8 flex-grow">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-2xl font-black text-[#1E293B] dark:text-zinc-100 leading-none">
                  {tutor.name}
                </h3>
                {tutor.verified && (
                  <CheckCircle className="w-5 h-5 text-[#8B5CF6]" />
                )}
              </div>
              <p className="text-[#8B5CF6] font-black text-xs mb-6 tracking-[0.2em] uppercase">
                {tutor.subject}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {tutor.expertise.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-3 py-1.5 rounded-full font-black uppercase tracking-wider border border-slate-100 dark:border-zinc-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              <p className="text-slate-400 dark:text-zinc-500 text-sm font-medium leading-relaxed">
                {tutor.bio}
              </p>
            </div>

            <div className="p-8 pt-0">
              <button className="w-full py-5 bg-[#F1F5F9] dark:bg-zinc-800 text-[#1E293B] dark:text-zinc-100 rounded-[1.5rem] font-black hover:bg-[#8B5CF6] hover:text-white transition-all transform active:scale-95 shadow-sm">
                {t("find.bookSession")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const Dashboard = () => {
  const { t } = useTranslations()
  const [user, setUser] = useState<{
    firstName?: string
    lastName?: string
    email?: string
    role?: string
  } | null>(null)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token")
        if (token) {
          const res = await fetch("http://localhost:3000/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            setUser(data.user)
            return
          }
        }
        const raw = localStorage.getItem("user")
        if (raw) setUser(JSON.parse(raw))
      } catch {
        setUser(null)
      }
    }
    fetchUser()
  }, [])

  const navItems = [
    { icon: BookOpen, labelKey: "dash.nav.curriculum" as const, active: true },
    { icon: Calendar, labelKey: "dash.nav.sessions" as const, active: false },
    {
      icon: MessageSquare,
      labelKey: "dash.nav.messages" as const,
      active: false,
    },
    { icon: Award, labelKey: "dash.nav.milestones" as const, active: false },
    { icon: Settings, labelKey: "dash.nav.profile" as const, active: false },
  ]

  const stats = [
    {
      labelKey: "dash.stat.brainPower" as const,
      val: "84%",
      color: "text-[#8B5CF6]",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      icon: Sparkles,
    },
    {
      labelKey: "dash.stat.milestones" as const,
      val: "14",
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      icon: Award,
    },
    {
      labelKey: "dash.stat.xp" as const,
      val: "2.4k",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      icon: Clock,
    },
  ]

  const lessons = [
    {
      tutor: "Dr. Sarah Jenkins",
      subject: "Quantum Calculus",
      dateKey: "today" as const,
      time: "4:00 PM",
      active: true,
    },
    {
      tutor: "James Wilson",
      subject: "Fullstack Theory",
      dateKey: "tomorrow" as const,
      time: "10:00 AM",
      active: false,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <aside className="lg:col-span-3 space-y-8">
          <div className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-xl flex flex-col items-center text-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-6 relative border-4 border-white dark:border-zinc-950 shadow-lg overflow-hidden">
                <User className="w-12 h-12 text-slate-400 dark:text-zinc-500" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-[#1E293B] dark:text-zinc-100">
              {user
                ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                  user.email
                : t("dash.userName")}
            </h3>
            <p className="text-[#8B5CF6] text-xs font-black uppercase tracking-[0.2em] mt-2">
              {user?.role ? user.role : t("dash.roleBadge")}
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-4 rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-sm space-y-1">
            {navItems.map((item) => (
              <button
                key={item.labelKey}
                type="button"
                className={`w-full flex items-center gap-4 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest transition-all ${
                  item.active
                    ? "bg-violet-50 dark:bg-violet-950/50 text-[#8B5CF6]"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/80"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {t(item.labelKey)}
              </button>
            ))}
          </div>
        </aside>

        <main className="lg:col-span-9 space-y-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-white dark:bg-zinc-950 p-10 rounded-[3rem] border border-slate-100 dark:border-zinc-800 shadow-sm group hover:-translate-y-2 transition-transform"
              >
                <div
                  className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-400 dark:text-zinc-500 font-black uppercase tracking-widest mb-1">
                  {t(stat.labelKey)}
                </p>
                <h4 className={`text-4xl font-black ${stat.color}`}>
                  {stat.val}
                </h4>
              </div>
            ))}
          </div>

          <section className="bg-white dark:bg-zinc-950 p-12 rounded-[4rem] border border-slate-100 dark:border-zinc-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-50 dark:bg-violet-950/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="flex items-center justify-between mb-10 relative">
              <h3 className="text-3xl font-black text-[#1E293B] dark:text-zinc-100">
                {t("dash.liveSessions")}
              </h3>
              <button
                type="button"
                className="text-[#8B5CF6] font-black uppercase text-xs tracking-widest hover:underline"
              >
                {t("dash.fullCalendar")}
              </button>
            </div>

            <div className="space-y-6">
              {lessons.map((lesson, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-8 rounded-[2.5rem] bg-[#F8FAFC] dark:bg-zinc-900/80 border border-slate-100 dark:border-zinc-800 group hover:border-[#8B5CF6] dark:hover:border-violet-600 transition-all"
                >
                  <div className="flex items-center gap-6 mb-6 sm:mb-0">
                    <div className="w-16 h-16 rounded-3xl bg-white dark:bg-zinc-800 shadow-md flex items-center justify-center text-[#8B5CF6]">
                      <NavIcon className="w-8 h-8 rotate-45" />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-[#1E293B] dark:text-zinc-100">
                        {lesson.subject}
                      </h4>
                      <p className="text-slate-400 dark:text-zinc-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                        {lesson.tutor} •{" "}
                        {lesson.dateKey === "today"
                          ? t("dash.lesson.today")
                          : t("dash.lesson.tomorrow")}
                        , {lesson.time}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${
                      lesson.active
                        ? "bg-[#8B5CF6] text-white shadow-lg shadow-violet-200 dark:shadow-violet-950/50 hover:scale-105"
                        : "bg-white dark:bg-zinc-800 text-slate-400 border border-slate-200 dark:border-zinc-700 cursor-not-allowed"
                    }`}
                  >
                    {lesson.active ? t("dash.joinNode") : t("dash.locked")}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

const Footer = () => {
  const { t } = useTranslations()
  const columns = [
    { titleKey: "footer.col.ecosystem" as const },
    { titleKey: "footer.col.resource" as const },
    { titleKey: "footer.col.company" as const },
  ]
  const links = [
    "footer.link.tutorMap",
    "footer.link.vectorAlgo",
    "footer.link.knowledgeNodes",
    "footer.link.apiAccess",
  ] as const

  return (
    <footer className="bg-[#1E293B] dark:bg-black text-white pt-32 pb-16 border-t border-transparent dark:border-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-10">
              <div className="bg-[#8B5CF6] p-2 rounded-xl rotate-12">
                <NavIcon className="text-white w-6 h-6" />
              </div>
              <span className="text-3xl font-black tracking-tight">
                Vector<span className="text-[#8B5CF6]">+</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed font-medium mb-10">
              {t("footer.blurb")}
            </p>
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-[#8B5CF6] transition-all cursor-pointer"
                >
                  <Globe className="w-6 h-6 text-white/40" />
                </div>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.titleKey}>
              <h4 className="text-xs font-black uppercase tracking-[0.3em] text-[#8B5CF6] mb-10">
                {t(col.titleKey)}
              </h4>
              <ul className="space-y-6 text-slate-400 font-black text-xs tracking-widest">
                {links.map((linkKey) => (
                  <li
                    key={linkKey}
                    className="hover:text-white cursor-pointer transition-colors"
                  >
                    {t(linkKey)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">
          <p>{t("footer.copyright")}</p>
          <div className="flex gap-12">
            <span className="hover:text-white cursor-pointer transition-colors">
              {t("footer.privacy")}
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              {t("footer.terms")}
            </span>
            <span className="hover:text-white cursor-pointer transition-colors">
              {t("footer.security")}
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState("home")
  const { darkMode, toggleTheme } = useStoredTheme()
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <LandingPage onExplore={() => setActiveTab("findtutors")} />
      case "findtutors":
        return <FindTutors />
      case "dashboard":
        return <Dashboard />
      default:
        return <LandingPage onExplore={() => setActiveTab("findtutors")} />
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans selection:bg-[#8B5CF6]/30 selection:text-[#1E293B] dark:selection:text-zinc-100 text-[#1E293B] dark:text-zinc-100 transition-colors duration-200">
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      <main>{renderContent()}</main>

      <Footer />
      <AIChatAssistant />

      <div className="fixed bottom-6 left-6 z-40 hidden md:block">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-2 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-zinc-800 flex gap-1">
          {["home", "findtutors", "dashboard"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all ${
                activeTab === tab
                  ? "bg-[#8B5CF6] text-white shadow-lg shadow-violet-200 dark:shadow-violet-950/40 scale-110"
                  : "text-slate-300 dark:text-zinc-600 hover:text-slate-500 dark:hover:text-zinc-400"
              }`}
            >
              {tab === "home" && <BookOpen className="w-5 h-5" />}
              {tab === "findtutors" && <Search className="w-5 h-5" />}
              {tab === "dashboard" && <Users className="w-5 h-5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
