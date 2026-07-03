"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { StaggerContainer, StaggerItem, InteractiveCard } from "@/app/components/landing/animations/stagger"
import { LandingSection, SectionHeading } from "@/app/components/landing/shared/section-heading"
import { useLandingContent } from "@/app/components/landing/use-landing-content"

export function CategoryGrid() {
  const { categories, categoriesSection } = useLandingContent()

  return (
    <LandingSection id="subjects">
      <SectionHeading
        eyebrow={categoriesSection.eyebrow}
        title={categoriesSection.title}
        description={categoriesSection.description}
      />

      <StaggerContainer className="mt-12 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0 xl:grid-cols-3">
        {categories.map((category) => {
          const Icon = category.icon
          return (
            <StaggerItem key={category.id} className="min-w-[16rem] snap-start lg:min-w-0">
              <InteractiveCard>
                <Link
                  href={category.href}
                  className="group flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]"
                >
                  <div
                    className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${category.tint}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{category.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                    {category.description}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)]">
                    {categoriesSection.explore}
                    <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </span>
                </Link>
              </InteractiveCard>
            </StaggerItem>
          )
        })}
      </StaggerContainer>
    </LandingSection>
  )
}
