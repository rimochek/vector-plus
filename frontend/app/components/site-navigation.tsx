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
  Navigation as NavIcon,
} from "lucide-react"
import { useStoredTheme } from "@/lib/use-stored-theme"
import { useTranslations } from "@/lib/i18n/locale-context"
import { useAuthSession } from "@/lib/use-auth-session"
import {
  DEFAULT_AUTH_ROUTE,
  dashboardTabHref,
  getUserDisplayName,
  getUserInitials,
  logout,
} from "@/lib/auth-client"
import { NotificationMenu } from "@/app/components/notification-menu"
import { ProfileMenu } from "@/app/components/profile-menu"

function NavIconButton({
  onClick,
  href,
  label,
  badge,
  children,
}: {
  onClick?: () => void
  href?: string
  label: string
  badge?: boolean
  children: ReactNode
}) {
  const className =
    "relative rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"

  const content = (
    <>
      {children}
      {badge && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#8B5CF6] ring-2 ring-white dark:ring-zinc-950" />
      )}
    </>
  )

  if (href) {
    return (
      <Link href={href} aria-label={label} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {content}
    </button>
  )
}

function MobileMenuLink({
  href,
  onClick,
  active,
  icon: Icon,
  children,
}: {
  href?: string
  onClick?: () => void
  active?: boolean
  icon?: React.ComponentType<{ className?: string }>
  children: ReactNode
}) {
  const className = `flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold transition ${
    active
      ? "bg-violet-50 text-[#8B5CF6] dark:bg-violet-950/40 dark:text-violet-300"
      : "text-slate-700 hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
  }`

  const inner = (
    <>
      {Icon && <Icon className="h-5 w-5 shrink-0 opacity-80" />}
      <span className="flex-1">{children}</span>
    </>
  )

  if (href) {
    return (
      <Link href={href} onClick={onClick} className={className}>
        {inner}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
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
  const favoritesHref = dashboardTabHref("favorites", user)
  const homeHref = isTutor ? "/tutor-dashboard" : "/dashboard"

  const navItems: { href: string; label: string }[] = isTutor
    ? [
        { href: "/tutors", label: t("nav.findTutors") },
        { href: "/tutor-dashboard", label: t("nav.tutorDashboard") },
      ]
    : [
        { href: "/tutors", label: t("nav.findTutors") },
        { href: "/dashboard", label: t("nav.dashboard") },
      ]

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  const authActions = ready && isLoggedIn && (
    <>
      {!isTutor && (
        <NavIconButton href={favoritesHref} label={t("nav.favorites")}>
          <Heart className="h-5 w-5" />
        </NavIconButton>
      )}

      <NotificationMenu notificationsHref={notificationsHref} />

      <NavIconButton href={conversationsHref} label={t("nav.chat")}>
        <MessageSquare className="h-5 w-5" />
      </NavIconButton>

      <ProfileMenu user={user} />
    </>
  )

  const guestActions = ready && !isLoggedIn && (
    <>
      <Link
        href="/login"
        className="text-sm font-bold text-slate-500 hover:text-[#1E293B] dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        {t("nav.login")}
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center justify-center rounded-2xl bg-[#1E293B] px-8 py-3 text-sm font-bold text-white shadow-xl shadow-slate-200 transition hover:bg-slate-800 dark:bg-zinc-100 dark:text-zinc-950 dark:shadow-zinc-900/50 dark:hover:bg-white"
      >
        {t("nav.join")}
      </Link>
    </>
  )

  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)

  const mobileMenu =
    mounted && isOpen ? (
      <div
        className="fixed inset-0 z-[200] md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
      >
        <button
          type="button"
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm dark:bg-black/60"
          aria-label={t("nav.closeMenu")}
          onClick={closeMenu}
        />

        <div className="fixed inset-y-0 right-0 z-[201] flex h-dvh w-[min(100%,20rem)] flex-col border-l border-slate-100 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 px-4 dark:border-zinc-800">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              {t("nav.menu")}
            </span>
            <button
              type="button"
              onClick={closeMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label={t("nav.closeMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
            {ready && isLoggedIn && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-violet-50 px-4 py-3 dark:bg-violet-950/30">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-sm font-black text-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#1E293B] dark:text-zinc-100">
                    {displayName || user?.email}
                  </p>
                  <p className="truncate text-xs font-semibold text-slate-500 dark:text-zinc-400">
                    {user?.email}
                  </p>
                </div>
              </div>
            )}

            <p className="mb-2 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              {t("nav.sectionBrowse")}
            </p>
            <div className="space-y-1">
              {navItems.map((item) => (
                <MobileMenuLink
                  key={item.href}
                  href={item.href}
                  onClick={closeMenu}
                  active={isActive(item.href)}
                >
                  {item.label}
                </MobileMenuLink>
              ))}
            </div>

            {ready && isLoggedIn && (
              <>
                <p className="mb-2 mt-6 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
                  {t("nav.sectionAccount")}
                </p>
                <div className="space-y-1">
                  <MobileMenuLink
                    href={homeHref}
                    onClick={closeMenu}
                    icon={User}
                    active={pathname.startsWith(homeHref)}
                  >
                    {isTutor ? t("nav.tutorDashboard") : t("nav.profile")}
                  </MobileMenuLink>
                  <MobileMenuLink
                    href={dashboardTabHref(isTutor ? "bookings" : "lessons", user)}
                    onClick={closeMenu}
                    icon={Calendar}
                  >
                    {t("dash.tab.lessons")}
                  </MobileMenuLink>
                  <MobileMenuLink
                    href={conversationsHref}
                    onClick={closeMenu}
                    icon={MessageSquare}
                  >
                    {t("nav.chat")}
                  </MobileMenuLink>
                  <MobileMenuLink
                    href={notificationsHref}
                    onClick={closeMenu}
                    icon={Bell}
                  >
                    {t("nav.notifications")}
                  </MobileMenuLink>
                  {!isTutor && (
                    <MobileMenuLink
                      href={favoritesHref}
                      onClick={closeMenu}
                      icon={Heart}
                    >
                      {t("nav.favorites")}
                    </MobileMenuLink>
                  )}
                </div>
              </>
            )}

            <p className="mb-2 mt-6 px-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-500">
              {t("nav.sectionSettings")}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
              >
                {darkMode ? (
                  <Sun className="h-5 w-5 shrink-0 opacity-80" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0 opacity-80" />
                )}
                <span className="flex-1">
                  {darkMode ? t("theme.light") : t("theme.dark")}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ru" : "en")}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
              >
                <Languages className="h-5 w-5 shrink-0 opacity-80" />
                <span className="flex-1">{t("lang.switch")}</span>
                <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-black tabular-nums text-[#8B5CF6] dark:bg-zinc-800">
                  {locale.toUpperCase()}
                </span>
              </button>
            </div>

            {ready && isLoggedIn && (
              <div className="mt-6 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <MobileMenuLink onClick={handleLogout} icon={LogOut}>
                  <span className="text-red-600 dark:text-red-400">
                    {t("nav.logout")}
                  </span>
                </MobileMenuLink>
              </div>
            )}

            {ready && !isLoggedIn && (
              <div className="mt-6 space-y-2 border-t border-slate-100 pt-4 dark:border-zinc-800">
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block w-full rounded-2xl border-2 border-slate-200 py-3.5 text-center text-sm font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  onClick={closeMenu}
                  className="block w-full rounded-2xl bg-[#1E293B] py-3.5 text-center text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-950"
                >
                  {t("nav.join")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    ) : null

  return (
    <nav
      className={`sticky top-0 border-b border-slate-100 bg-white/80 backdrop-blur-xl transition-colors dark:border-zinc-800 dark:bg-zinc-950/80 ${
        isOpen ? "z-[199]" : "z-50"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between md:h-20">
          <Link
            href={isLoggedIn ? DEFAULT_AUTH_ROUTE : "/"}
            className="group flex min-w-0 cursor-pointer items-center gap-2 sm:gap-3"
          >
            <div className="shrink-0 rotate-12 rounded-[12px] bg-[#8B5CF6] p-2 shadow-lg shadow-violet-200 transition-transform duration-500 group-hover:rotate-45 dark:shadow-violet-900/40 md:rounded-[14px] md:p-2.5">
              <NavIcon className="h-5 w-5 text-white md:h-6 md:w-6" />
            </div>
            <span className="truncate text-xl font-black tracking-tight text-[#1E293B] dark:text-zinc-100 md:text-2xl">
              Vector<span className="text-[#8B5CF6]">+</span>
            </span>
          </Link>

          <div className="hidden items-center space-x-10 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-1 py-1 text-sm font-bold uppercase tracking-wide transition-all ${
                  isActive(item.href)
                    ? "text-[#8B5CF6]"
                    : "text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
                }`}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-[#8B5CF6]" />
                )}
              </Link>
            ))}

            <div className="ml-6 flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={darkMode ? t("theme.lightAria") : t("theme.darkAria")}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={() => setLocale(locale === "en" ? "ru" : "en")}
                aria-label={
                  locale === "en" ? t("lang.ariaWhenEn") : t("lang.ariaWhenRu")
                }
                title={locale === "en" ? t("lang.ariaWhenEn") : t("lang.ariaWhenRu")}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black uppercase tracking-wider text-slate-700 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                <Languages className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-400" />
                <span className="tabular-nums">{locale.toUpperCase()}</span>
              </button>

              {authActions}
              {guestActions}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 md:hidden"
            aria-expanded={isOpen}
            aria-label={isOpen ? t("nav.closeMenu") : t("nav.menu")}
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenu && createPortal(mobileMenu, document.body)}
    </nav>
  )
}
