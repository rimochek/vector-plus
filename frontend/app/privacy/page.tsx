"use client"

import { Container } from "@/app/components/ui/container"
import { useTranslations } from "@/lib/i18n/locale-context"
import { SiteShell } from "@/app/components/site-shell"

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com"

export default function PrivacyPage() {
  const { t } = useTranslations()

  return (
    <SiteShell>
      <Container size="content" className="py-10 sm:py-14">
        <article className="prose prose-neutral max-w-none dark:prose-invert">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {t("legal.privacyTitle")}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{t("legal.lastUpdated")}</p>

          <section className="mt-8 space-y-4 text-[var(--text-secondary)]">
            <p>
              Tutora collects personal information needed to operate the beta service,
              including account details, profile information, booking data, chat
              messages, notification preferences, and tutor verification documents.
            </p>
            <p>
              Verification documents uploaded by tutors are used to review tutor
              applications. Access is limited to authorized reviewers and secure storage
              systems.
            </p>
            <p>
              Data may be processed and stored by infrastructure providers such as
              hosting, database, email, and object storage providers that support the
              platform.
            </p>
            <p>
              We use cookies and similar technologies for authentication sessions,
              including httpOnly refresh cookies for secure sign-in.
            </p>
            <p>
              You may request account or data deletion by contacting support. Some
              records may be retained where needed for security, fraud prevention, or
              legal obligations.
            </p>
            <p>
              This privacy notice describes beta product behavior and is not a claim of
              jurisdiction-specific legal compliance.
            </p>
            <p>
              {t("legal.supportLabel")}:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[var(--primary)]">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </section>
        </article>
      </Container>
    </SiteShell>
  )
}
