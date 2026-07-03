"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { motion, AnimatePresence, useReducedMotion } from "motion/react"
import { cn } from "@/lib/utils"
import { LanguageSwitcher } from "@/app/components/language-switcher"
import { useLandingContent } from "@/app/components/landing/use-landing-content"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { ButtonLink } from "@/app/components/ui/button"

export function LandingNavbar() {
  const { nav, navAuth } = useLandingContent()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <motion.header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-b border-[var(--border)] bg-[var(--surface)]/90 shadow-[var(--shadow-sm)] backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-[72px] max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <TutoraLogo href="/" size="md" />

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex" aria-label="Main">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <LanguageSwitcher className="rounded-[var(--radius-button)] border-[var(--border)] bg-[var(--surface)] px-3 py-2.5" />
            <Link
              href="/login"
              className="rounded-[var(--radius-button)] px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:bg-[var(--chip)]"
            >
              {navAuth.login}
            </Link>
            <ButtonLink href="/signup/tutor" variant="secondary" className="px-4 py-2.5">
              {navAuth.becomeTutor}
            </ButtonLink>
            <ButtonLink href="/tutors" variant="primary" className="px-5 py-2.5">
              {navAuth.findTutor}
            </ButtonLink>
          </div>

          <div className="ml-auto flex items-center gap-2 lg:hidden">
            <LanguageSwitcher className="rounded-[var(--radius-button)] border-[var(--border)] bg-[var(--surface)] px-2.5 py-2.5" />
          </div>

          <button
            type="button"
            className="rounded-[var(--radius-button)] border border-[var(--border)] p-2.5 text-[var(--text-primary)] lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <motion.span
              key={open ? "close" : "menu"}
              initial={reduced ? false : { rotate: open ? -90 : 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="inline-flex"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.span>
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] lg:hidden"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={reduced ? false : { x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)]"
            >
              <div className="mb-8 flex items-center justify-between">
                <TutoraLogo href="/" size="sm" />
                <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex flex-col gap-1" aria-label="Mobile">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-base font-semibold text-[var(--text-primary)] hover:bg-[var(--chip)]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto grid gap-2 pt-8">
                <LanguageSwitcher className="w-full justify-center rounded-[var(--radius-button)] border-[var(--border)] bg-[var(--surface)] py-3" />
                <ButtonLink href="/login" variant="secondary" className="w-full">
                  {navAuth.login}
                </ButtonLink>
                <ButtonLink href="/signup/tutor" variant="secondary" className="w-full">
                  {navAuth.becomeTutor}
                </ButtonLink>
                <ButtonLink href="/tutors" variant="primary" className="w-full">
                  {navAuth.findTutor}
                </ButtonLink>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
