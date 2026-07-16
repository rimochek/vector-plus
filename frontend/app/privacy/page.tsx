"use client";

import { useTranslations } from "@/lib/i18n/locale-context";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com";

export default function PrivacyPage() {
  const { t } = useTranslations();

  return (
    <LegalDocumentPage
      title={t("legal.privacyTitle")}
      updated={t("legal.lastUpdated")}
    >
      <p>
        Tutora collects personal information needed to operate the beta service,
        including account details, profile information, booking data, chat
        messages, notification preferences, and tutor verification documents.
      </p>
      <p>
        Verification documents uploaded by tutors are used to review tutor
        applications. Access is limited to authorized reviewers and secure
        storage systems.
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
        When you leave a request on a tutor profile, your contact details
        (Telegram username or phone number) are shared with that tutor so they
        can respond directly outside Tutora. Public contact buttons are shown
        only when a tutor explicitly enables them.
      </p>
      <p>
        Tutors must not misuse student contact information. Verification
        documents are never shown publicly. You may report spam or misuse to
        support.
      </p>
      <p>
        You may request account or data deletion by contacting support. Some
        records may be retained where needed for security, fraud prevention, or
        legal obligations.
      </p>
      <p>
        This privacy notice describes beta product behavior and is not a claim
        of jurisdiction-specific legal compliance.
      </p>
      <p>
        {t("legal.supportLabel")}:{" "}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="text-blue-700 underline dark:text-blue-400"
        >
          {SUPPORT_EMAIL}
        </a>
      </p>
    </LegalDocumentPage>
  );
}
