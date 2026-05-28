"use client"

import Link from "next/link"
import {
  Sparkles,
  Navigation as NavIcon,
  Clock,
  ArrowRight,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"

export const LandingPage = () => {
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
            <Link
              href="/register?role=student&step=2"
              className="px-10 py-5 bg-[#8B5CF6] text-white rounded-[2rem] font-black text-lg hover:shadow-[0_20px_40px_rgba(139,92,246,0.3)] dark:hover:shadow-[0_20px_40px_rgba(139,92,246,0.25)] transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
            >
              {t("landing.exploreTutors")} <ArrowRight className="w-6 h-6" />
            </Link>
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
