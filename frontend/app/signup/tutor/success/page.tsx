"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import {
  RegistrationHeader,
  RegistrationShell,
} from "@/app/components/auth/registration-shell"
import { ButtonLink } from "@/app/components/ui/button"

const TIMELINE = [
  "Profile published",
  "Available to students",
  "Optional verified badge review",
]

export default function TutorSignupSuccessPage() {
  return (
    <RegistrationShell header={<RegistrationHeader />}>
      <div className="space-y-6 text-center sm:text-left">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:mx-0">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black sm:text-3xl">
            Your tutor profile is live
          </h1>
          <p className="text-sm text-[var(--text-secondary)] sm:text-base">
            Students can now find your profile and request lessons. An administrator
            may review it separately to grant the verified badge.
          </p>
        </div>
        <ol className="space-y-3 text-left">
          {TIMELINE.map((item, index) => (
            <li
              key={item}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                index === 0
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                  : "border-slate-200 dark:border-[var(--border)]"
              }`}
            >
              <span>{index === 0 ? "✓" : index + 1}</span>
              {item}
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/tutor-dashboard">Go to tutor dashboard</ButtonLink>
          <ButtonLink href="/signup/tutor/review" variant="secondary">
            View application
          </ButtonLink>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Need to make changes?{" "}
          <Link href="/tutor-dashboard" className="font-semibold text-[var(--primary-from)] hover:underline">
            Open your dashboard
          </Link>
        </p>
      </div>
    </RegistrationShell>
  )
}
