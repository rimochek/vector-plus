"use client"

import type { ReactNode } from "react"
import { StepHeader } from "./step-header"
import { StepNavigation } from "./animated-step"
import { BenefitList } from "./onboarding-interstitial"

type CompactInterstitialProps = {
  title: string
  description: string
  benefits?: string[]
  preview?: ReactNode
  primaryLabel: string
  secondaryLabel?: string
  onPrimary: () => void
  onSecondary?: () => void
  onBack?: () => void
}

export function CompactInterstitial({
  title,
  description,
  benefits,
  preview,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  onBack,
}: CompactInterstitialProps) {
  return (
    <div className="space-y-6">
      <StepHeader title={title} description={description} />
      {benefits && benefits.length > 0 ? <BenefitList items={benefits.slice(0, 3)} /> : null}
      {preview ? <div className="lg:hidden">{preview}</div> : null}
      <StepNavigation
        onBack={onBack}
        onContinue={onPrimary}
        continueLabel={primaryLabel}
        secondaryAction={
          onSecondary && secondaryLabel ? (
            <button
              type="button"
              onClick={onSecondary}
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--chip)]"
            >
              {secondaryLabel}
            </button>
          ) : undefined
        }
      />
    </div>
  )
}
