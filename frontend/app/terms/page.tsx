"use client";

import { useTranslations } from "@/lib/i18n/locale-context";
import { LegalDocumentPage } from "@/app/components/legal-document-page";

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@example.com";

export default function TermsPage() {
  const { t } = useTranslations();

  return (
    <LegalDocumentPage
      title={t("legal.termsTitle")}
      updated={t("legal.lastUpdated")}
    >
      <p>
        Tutora is a closed beta platform that connects students with tutors for
        discovery, booking requests, messaging, and lesson coordination.
      </p>
      <p>
        Tutors are responsible for the accuracy of their profiles,
        qualifications, availability, and pricing. Tutora does not guarantee
        specific academic outcomes, exam scores, or admission results.
      </p>
      <p>
        Payment for lessons is arranged directly between the student and tutor.
        Tutora does not process lesson payments in this beta release.
      </p>
      <p>
        Users must not upload illegal, misleading, harmful, or infringing
        content. Tutora may suspend or remove accounts that appear fraudulent,
        abusive, or in violation of these terms.
      </p>
      <p>
        Cancellations should be handled promptly and respectfully between
        student and tutor. Repeated no-shows or misuse of the booking system may
        lead to account restrictions.
      </p>
      <p>
        These terms describe beta product behavior and are not a claim of
        jurisdiction-specific legal compliance.
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
