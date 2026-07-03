"use client"

import Link from "next/link"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function LandingFooter() {
  const { footer, footerLinks } = useLandingContent()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--footer-bg)]">
      <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_repeat(3,minmax(0,1fr))]">
          <div>
            <TutoraLogo href="/" size="sm" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--text-muted)]">
              {footer.description}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              {footer.product}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              {footer.tutors}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.tutors.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              {footer.company}
            </h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-[var(--text-muted)] transition hover:text-[var(--primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border)] pt-8 text-sm text-[var(--text-muted)] sm:flex-row">
          <p>{footer.copyright(year)}</p>
          <p>{footer.tagline}</p>
        </div>
      </div>
    </footer>
  )
}
