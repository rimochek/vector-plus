"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Calendar, Heart, LogOut, MessageSquare, User } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import {
  dashboardTabHref,
  getUserInitials,
  logout,
  type StoredUser,
} from "@/lib/auth-client"

type ProfileMenuProps = {
  user: StoredUser | null
  size?: "sm" | "md"
}

export function ProfileMenu({ user, size = "md" }: ProfileMenuProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const isTutor = (user?.role ?? user?.roles?.[0]) === "tutor"
  const homeHref = isTutor ? "/tutor-dashboard" : "/dashboard"

  const initials = getUserInitials(user)
  const avatarUrl = user?.tutorProfile?.avatarUrl ?? user?.studentProfile?.avatarUrl
  const avatarClass =
    size === "sm"
      ? "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white ring-2 ring-white shadow-sm"
      : "flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-md ring-2 ring-white transition duration-150 hover:scale-105"

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

  const menuItems = [
    {
      href: homeHref,
      icon: User,
      label: isTutor ? t("nav.tutorDashboard") : t("nav.profile"),
    },
    {
      href: dashboardTabHref(isTutor ? "upcoming" : "lessons", user),
      icon: Calendar,
      label: t("dash.tab.lessons"),
    },
    {
      href: dashboardTabHref("chats", user),
      icon: MessageSquare,
      label: t("dash.tab.chats"),
    },
    {
      href: dashboardTabHref("notifications", user),
      icon: Bell,
      label: t("dash.tab.notifications"),
    },
    ...(!isTutor
      ? [
          {
            href: dashboardTabHref("favorites", user),
            icon: Heart,
            label: t("dash.tab.favorites"),
          },
        ]
      : []),
  ]

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("nav.profile")}
        aria-expanded={open}
        aria-haspopup="menu"
        className={avatarClass}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl dark:border-[var(--border)] dark:bg-[var(--surface)]"
        >
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-violet-50 hover:text-[var(--primary-from)] dark:text-zinc-200 dark:hover:bg-violet-950/40 dark:hover:text-violet-300"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
          <div className="my-1 border-t border-slate-100 dark:border-[var(--border)]" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {t("nav.logout")}
          </button>
        </div>
      )}
    </div>
  )
}
