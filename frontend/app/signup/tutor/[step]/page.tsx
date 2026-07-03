"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  TUTOR_STEPS,
  type TutorStep,
} from "@/app/components/tutor-onboarding/tutor-signup-flow"
import { saveTutorStep } from "@/lib/onboarding/signup-session"

export default function TutorStepLegacyRedirect() {
  const params = useParams<{ step: string }>()
  const router = useRouter()

  useEffect(() => {
    const step = params.step as TutorStep
    if (TUTOR_STEPS.includes(step)) {
      saveTutorStep(step)
    }
    router.replace("/signup/tutor")
  }, [params.step, router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F8FAFC] text-sm text-[var(--text-muted)]">
      Loading…
    </div>
  )
}
