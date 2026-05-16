"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Locale, MessageId } from "./messages"
import { messagesEn, messagesRu } from "./messages"

const STORAGE_KEY = "vector-locale"

const dictionaries = {
  en: messagesEn,
  ru: messagesRu,
} as const

function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] !== undefined && vars[key] !== null
      ? String(vars[key])
      : `{${key}}`,
  )
}

type LocaleContextValue = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (id: MessageId, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const next: Locale = raw === "ru" ? "ru" : "en"
    document.documentElement.lang = next === "ru" ? "ru" : "en"
    const id = requestAnimationFrame(() => setLocaleState(next))
    return () => cancelAnimationFrame(id)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l === "ru" ? "ru" : "en"
  }, [])

  const t = useCallback(
    (id: MessageId, vars?: Record<string, string | number>) => {
      const raw = dictionaries[locale][id]
      return interpolate(raw, vars)
    },
    [locale],
  )

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  )

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  )
}

export function useTranslations() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error("useTranslations must be used within LocaleProvider")
  }
  return ctx
}
