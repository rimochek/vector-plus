"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Calendar,
  Heart,
  Languages,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { useTranslations } from "@/lib/i18n/locale-context"
import { useAuthSession } from "@/lib/use-auth-session"
import {
  DEFAULT_AUTH_ROUTE,
  dashboardTabHref,
  logout,
} from "@/lib/auth-client"
import { NotificationMenu } from "@/app/components/notification-menu"
import { ProfileMenu } from "@/app/components/profile-menu"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { Container } from "@/app/components/ui/container"

function NavIconButton({
  href,
  label,
  children,
}: {
  href?: string
  label: string
  children: ReactNode
}) {
  const className =
    "relative flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition duration-150 ease-in-out hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" aria-label={label} className={className}>
      {children}
    </button>
  )
}

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { t, locale, setLocale } = useTranslations()
  const { darkMode, toggleTheme } = useStoredTheme()
  const { user, isLoggedIn, ready } = useAuthSession()

  const closeMenu = () => setIsOpen(false)
  const isTutor = (user?.role ?? user?.roles?.[0]) === "tutor"
  const conversationsHref = dashboardTabHref("chats", user)
  const notificationsHref = dashboardTabHref("notifications", user)
  const mobileAccountItems = [
    {
      href: isTutor ? "/tutor-dashboard" : "/dashboard",
      label: isTutor ? t("nav.tutorDashboard") : t("nav.profile"),
      icon: User,
    },
    {
      href: dashboardTabHref(isTutor ? "upcoming" : "lessons", user),
      label: t("dash.tab.lessons"),
      icon: Calendar,
    },
    { href: conversationsHref, label: t("dash.tab.chats"), icon: MessageSquare },
    { href: notificationsHref, label: t("dash.tab.notifications"), icon: Bell },
    ...(!isTutor
      ? [{ href: dashboardTabHref("favorites", user), label: t("dash.tab.favorites"), icon: Heart }]
      : []),
  ]

  const centerNav = isLoggedIn
    ? isTutor
      ? [
          { href: "/tutors", label: t("nav.findTutors") },
          { href: "/tutor-dashboard", label: t("nav.tutorDashboard") },
        ]
      : [{ href: "/tutors", label: t("nav.findTutors") }]
    : [
        { href: "/tutors", label: t("nav.findTutors") },
        { href: "/signup/tutor", label: t("nav.becomeTutor") },
        { href: "/login", label: t("nav.forTutors") },
      ]

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0])

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = () => {
    closeMenu()
    void logout().then(() => router.push("/login"))
  }

  const logoHref = isLoggedIn ? DEFAULT_AUTH_ROUTE : "/"

  return (
    <header
      className={`sticky top-0 z-50 border-b border-[var(--header-border)] bg-[var(--header-bg)] shadow-sm backdrop-blur supports-[backdrop-filter]:bg-[var(--header-bg)] ${
        isOpen ? "z-[199]" : ""
      }`}
    >
      <Container>
        <div className="flex h-[72px] items-center gap-6">
          <TutoraLogo href={logoHref} size="md" />

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {centerNav.map((item) => (
              <Link
                key={item.href + item.label}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-150 ease-in-out ${
                  isActive(item.href)
                    ? "bg-[var(--primary-from)] text-white shadow-sm"
                    : "text-[var(--text-muted)] hover:bg-indigo-50 hover:text-[var(--primary-from)]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition duration-150 hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setLocale(locale === "en" ? "ru" : "en")}
              className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-secondary)] transition duration-150 hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"
            >
              <Languages className="h-4 w-4" />
              {locale.toUpperCase()}
            </button>

            {ready && isLoggedIn && isTutor && (
              <>
                <NotificationMenu notificationsHref={notificationsHref} />
                <ProfileMenu user={user} />
              </>
            )}

            {ready && isLoggedIn && !isTutor && (
              <>
                <NotificationMenu notificationsHref={notificationsHref} />
                <ProfileMenu user={user} />
              </>
            )}

            {ready && !isLoggedIn && (
              <>
                <Link
                  href="/login"
                  className="rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition duration-150 hover:bg-[var(--chip)] hover:text-[var(--text-primary)]"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-[var(--radius-button)] bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-[var(--shadow-sm)] transition duration-150 hover:bg-[var(--primary-hover)]"
                >
                  {t("nav.join")}
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] lg:hidden"
            aria-expanded={isOpen}
            aria-label={isOpen ? t("nav.closeMenu") : t("nav.menu")}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </Container>

      {mounted &&
        isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal>
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeMenu}
              aria-label={t("nav.closeMenu")}
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-2xl">
              <div className="flex h-[72px] items-center justify-between border-b border-[var(--border)] px-4">
                <span className="text-sm font-bold text-[var(--text-muted)]">
                  {t("nav.menu")}
                </span>
                <button type="button" onClick={closeMenu} className="p-2">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {centerNav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className={`mb-1 block rounded-full px-4 py-3 text-sm font-semibold transition duration-150 ${
                      isActive(item.href)
                        ? "bg-[var(--primary-from)] text-white"
                        : "text-[var(--text-secondary)] hover:bg-[var(--chip)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
                {ready && !isLoggedIn && (
                  <div className="mt-4 grid gap-2 border-t border-[var(--border)] pt-4">
                    <Link
                      href="/login"
                      onClick={closeMenu}
                      className="rounded-full px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/signup"
                      onClick={closeMenu}
                      className="rounded-full bg-[var(--primary)] px-4 py-3 text-center text-sm font-semibold text-[var(--primary-foreground)]"
                    >
                      {t("nav.join")}
                    </Link>
                  </div>
                )}
                {ready && isLoggedIn && (
                  <div className="mt-4 border-t border-[var(--border)] pt-4">
                    {mobileAccountItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeMenu}
                          className="mb-1 flex items-center gap-3 rounded-[var(--radius-button)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--chip)]"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-[var(--primary)]" />
                          {item.label}
                        </Link>
                      )
                    })}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="mt-2 flex w-full items-center gap-3 rounded-[var(--radius-button)] px-4 py-3 text-sm font-semibold text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  )
}
