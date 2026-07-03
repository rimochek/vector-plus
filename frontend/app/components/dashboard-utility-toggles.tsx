"use client"

import { Languages, Moon, Sun } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { useStoredTheme } from "@/lib/use-stored-theme"

const headerButtonClass =
  "flex h-10 items-center justify-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition duration-150 hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"

export function DashboardUtilityToggles({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslations()
  const { darkMode, toggleTheme } = useStoredTheme()

  return (
    <div className={`flex items-center gap-2 ${className}`.trim()}>
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
        className={`${headerButtonClass} w-10 px-0`}
      >
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <button
        type="button"
        onClick={() => setLocale(locale === "en" ? "ru" : "en")}
        aria-label={locale === "en" ? t("lang.ariaWhenEn") : t("lang.ariaWhenRu")}
        className={`${headerButtonClass} px-3 text-xs font-semibold uppercase tracking-wide`}
      >
        <Languages className="h-4 w-4" />
        {locale.toUpperCase()}
      </button>
    </div>
  )
}
