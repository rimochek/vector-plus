"use client"

import Link from "next/link"
import { useTranslations } from "@/lib/i18n/locale-context"
import { Container } from "@/app/components/ui/container"
import { TutoraLogo } from "@/app/components/ui/tutora-logo"
import { ButtonLink } from "@/app/components/ui/button"

export const Footer = () => {
  const { t } = useTranslations()

  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--footer-bg)] py-10">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <TutoraLogo href="/" size="sm" />
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link href="/terms" className="text-[var(--text-muted)] hover:text-[var(--primary)]">
              {t("footer.terms")}
            </Link>
            <Link href="/privacy" className="text-[var(--text-muted)] hover:text-[var(--primary)]">
              {t("footer.privacy")}
            </Link>
          </div>
          <ButtonLink href="/signup" variant="primary" className="px-6 py-2.5">
            {t("nav.join")}
          </ButtonLink>
          <p className="text-sm text-[var(--text-muted)]">{t("footer.copyright")}</p>
        </div>
      </Container>
    </footer>
  )
}
