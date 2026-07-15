"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, Briefcase, CheckCircle, MapPin, Star } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { formatTenge, tutorHourlyRateTenge } from "@/lib/currency"
import type { ApiTutor } from "@/lib/api-client"
import { Button, ButtonLink } from "@/app/components/ui/button"
import { TutorContactOptionsModal } from "@/app/components/tutor-contact-options-modal"

type TutorCardProps = {
  tutor: ApiTutor
}

export function TutorCard({ tutor }: TutorCardProps) {
  const { t } = useTranslations()
  const router = useRouter()
  const [contactOpen, setContactOpen] = useState(false)
  const hourly = formatTenge(tutorHourlyRateTenge(tutor.defaultHourlyRateCents))
  const profileHref = `/tutors/${tutor.id}`

  const openProfile = () => {
    router.push(profileHref)
  }

  return (
    <>
      <article
        role="link"
        tabIndex={0}
        onClick={openProfile}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            openProfile()
          }
        }}
        className="group relative cursor-pointer rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition duration-150 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] sm:p-6"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-5">
            <div className="relative shrink-0">
              <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-to)] text-2xl font-bold text-white sm:h-24 sm:w-24">
                {tutor.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- Tutor avatar URLs are user-provided; no remote image domains are configured.
                  <img
                    src={tutor.avatarUrl}
                    alt={tutor.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  tutor.displayName.charAt(0)
                )}
              </div>
              {tutor.verified && (
                <span className="absolute -bottom-1 -right-1 rounded-full bg-[var(--surface)] p-0.5 shadow-[var(--shadow-sm)]">
                  <CheckCircle className="h-5 w-5 fill-[var(--primary-soft)] text-[var(--primary)]" />
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="text-xl font-bold text-[var(--text-primary)] transition group-hover:text-[var(--primary)] sm:text-2xl">
                  {tutor.displayName}
                </span>
                {tutor.verified && (
                  <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--primary-hover)] dark:text-[var(--primary)]">
                    {t("tutorProfile.verified")}
                  </span>
                )}
                {tutor.experienceYears != null && tutor.experienceYears > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-secondary)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                    <Briefcase className="h-3 w-3" />
                    {t("tutorProfile.experienceYears", {
                      count: tutor.experienceYears,
                    })}
                  </span>
                )}
              </div>

              {tutor.education && (
                <p className="mb-2 text-sm font-medium text-[var(--text-muted)]">
                  {tutor.education}
                </p>
              )}

              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--primary)]">
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {tutor.subject}
                </span>
                {(tutor.city || tutor.country) && (
                  <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                    <MapPin className="h-3.5 w-3.5" />
                    {[tutor.city, tutor.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>

              <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                {tutor.bio}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                  <Star className="h-4 w-4 fill-[var(--warning)] text-[var(--warning)]" />
                  {tutor.rating.toFixed(1)}
                </span>
                <span>{t("find.reviews", { count: tutor.reviews })}</span>
                {tutor.lessonsCompleted > 0 && (
                  <span>
                    {tutor.lessonsCompleted} {t("find.lessonsLabel")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div
            className="flex shrink-0 flex-col items-stretch gap-4 border-t border-[var(--border)] pt-5 sm:min-w-[190px] lg:border-t-0 lg:pt-0 lg:items-end"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <div className="lg:text-right">
              <p className="text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                {hourly}
                <span className="ml-1 text-sm font-medium text-[var(--text-muted)]">
                  {t("find.perHour")}
                </span>
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
              <Button
                variant="primary"
                className="w-full lg:min-w-[160px]"
                onClick={() => setContactOpen(true)}
              >
                {t("find.bookSession")}
              </Button>
              <ButtonLink
                href={profileHref}
                variant="secondary"
                className="w-full lg:min-w-[160px]"
              >
                {t("find.viewProfile")}
              </ButtonLink>
            </div>
          </div>
        </div>
      </article>

      <TutorContactOptionsModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        tutor={tutor}
      />
    </>
  )
}
