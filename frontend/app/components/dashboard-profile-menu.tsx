"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Languages, LogOut, Moon, Sun } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { getUserInitials, logout } from "@/lib/auth-client"
import { useStoredTheme } from "@/lib/use-stored-theme"

function AvatarMark({
  name,
  src,
  size = "sm",
}: {
  name: string
  src?: string | null
  size?: "sm" | "md"
}) {
  const dimension = size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-to)] font-bold text-white ${dimension}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  )
}

export function DashboardProfileMenu({
  displayName,
  subtitle,
  avatarUrl,
  user,
}: {
  displayName: string
  subtitle: string
  avatarUrl?: string | null
  user?: Parameters<typeof getUserInitials>[0]
}) {
  const { t, locale, setLocale } = useTranslations()
  const router = useRouter()
  const { darkMode, toggleTheme } = useStoredTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const initials = getUserInitials(user ?? null)

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleLogout = () => {
    setOpen(false)
    void logout().then(() => router.push("/login"))
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-full bg-[var(--surface)] px-3 py-2 shadow-[var(--shadow-sm)] transition hover:bg-[var(--chip)]"
      >
        <AvatarMark name={displayName} src={avatarUrl} size="sm" />
        <div className="hidden min-w-0 text-left sm:block">
          <p className="truncate text-sm font-bold text-[var(--text-primary)]">
            {displayName}
          </p>
          <p className="truncate text-xs text-[var(--text-muted)]">{subtitle}</p>
        </div>
        <span className="hidden text-xs font-bold text-[var(--text-muted)] sm:inline">
          {initials}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--text-muted)] transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[240px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] py-1.5 shadow-[var(--shadow-lg)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              toggleTheme()
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? t("theme.light") : t("theme.dark")}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => setLocale(locale === "en" ? "ru" : "en")}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"
          >
            <Languages className="h-4 w-4" />
            {locale === "en" ? t("lang.ru") : t("lang.en")}
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold text-[var(--danger)] transition hover:bg-[var(--danger-soft)]"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  )
}
