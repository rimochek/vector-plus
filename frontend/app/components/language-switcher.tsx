"use client"

import { Languages } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale, setLocale, t } = useTranslations()

  const toggle = () => setLocale(locale === "en" ? "ru" : "en")

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === "en" ? t("lang.ariaWhenEn") : t("lang.ariaWhenRu")}
      title={locale === "en" ? t("lang.ariaWhenEn") : t("lang.ariaWhenRu")}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-[var(--border)] bg-slate-50 dark:bg-zinc-800/80 px-3 py-3 text-slate-700 dark:text-zinc-200 font-black text-xs uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-zinc-700 transition-colors ${className}`}
    >
      <Languages
        className="w-4 h-4 shrink-0 text-slate-500 dark:text-[var(--text-muted)]"
        aria-hidden
      />
      <span className="tabular-nums">{locale.toUpperCase()}</span>
    </button>
  )
}
