"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { api, type ApiTutor } from "@/lib/api-client"
import { StaggerContainer, StaggerItem } from "@/app/components/landing/animations/stagger"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { TutorPreviewCard } from "@/app/components/landing/shared/tutor-preview-card"
import { TutorCard } from "@/app/components/tutor-card"
import { ButtonLink } from "@/app/components/ui/button"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function FeaturedTutors() {
  const { featured, sampleTutors } = useLandingContent()
  const [tutors, setTutors] = useState<ApiTutor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.tutors
      .list()
      .then((data) => setTutors(data.slice(0, 6)))
      .catch(() => setTutors([]))
      .finally(() => setLoading(false))
  }, [])

  const useLive = tutors.length >= 3
  const displaySamples = sampleTutors.slice(0, 6)

  return (
    <LandingSection>
      <SectionHeading title={featured.title} description={featured.description} />

      {loading ? (
        <div className="mt-12 flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      ) : useLive ? (
        <StaggerContainer className="mt-12 flex flex-col gap-5">
          {tutors.map((tutor) => (
            <StaggerItem key={tutor.id}>
              <TutorCard tutor={tutor} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <StaggerContainer className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {displaySamples.map((tutor) => (
            <StaggerItem key={tutor.id}>
              <TutorPreviewCard tutor={tutor} href="/tutors" />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      <div className="mt-10 text-center">
        <ButtonLink href="/tutors" variant="primary" className="gap-2 px-7 py-3.5">
          {featured.exploreAll}
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
        {!useLive && !loading && (
          <p className="mt-3 text-xs text-[var(--text-muted)]">{featured.sampleNote}</p>
        )}
      </div>
    </LandingSection>
  )
}
