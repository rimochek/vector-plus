"use client"

import { Moon, Sun } from "lucide-react"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { useTranslations } from "@/lib/i18n/locale-context"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { LanguageSwitcher } from "@/app/components/language-switcher"

export function AuthTopBar({ title }: { title: string }) {
  const { darkMode, toggleTheme } = useStoredTheme()
  const { t } = useTranslations()

  return (
    <header className="border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-[16px]">
      <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-between gap-3 px-4 sm:px-6">
        <TutoraLogo href="/" size="sm" />
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs font-black uppercase tracking-widest text-[var(--text-muted)] max-w-[200px] md:max-w-[280px] truncate">
            {title}
          </span>
          <LanguageSwitcher />
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
            className="p-2 rounded-xl border border-slate-200 dark:border-[var(--border)] bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}
