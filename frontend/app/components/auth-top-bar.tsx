"use client"

import Link from "next/link"
import { Moon, Sun, Navigation as NavIcon } from "lucide-react"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { useTranslations } from "@/lib/i18n/locale-context"
import { LanguageSwitcher } from "@/app/components/language-switcher"

export function AuthTopBar({ title }: { title: string }) {
  const { darkMode, toggleTheme } = useStoredTheme()
  const { t } = useTranslations()

  return (
    <header className="border-b border-slate-100 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-3 group"
        >
          <div className="bg-[#8B5CF6] p-2.5 rounded-xl rotate-6 group-hover:rotate-12 transition-transform shadow-md shadow-violet-200/50 dark:shadow-violet-900/40">
            <NavIcon className="text-white w-6 h-6" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-[#1E293B] dark:text-zinc-100 tracking-tight">
            Vector<span className="text-[#8B5CF6]">+</span>
          </span>
        </Link>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 max-w-[200px] md:max-w-[280px] truncate">
            {title}
          </span>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
            className="p-2 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
