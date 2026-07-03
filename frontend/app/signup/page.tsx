"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  Search,
  UserRound,
} from "lucide-react"
import {
  RegistrationHeader,
  RegistrationShell,
} from "@/app/components/auth/registration-shell"
import {
  StudentSearchPreview,
  TutorProfileBuildPreview,
} from "@/app/components/onboarding/product-mini-preview"
import {
  getSignupRole,
  saveSignupRole,
  type SignupRole,
} from "@/lib/onboarding/signup-session"

function RoleCard({
  role,
  selected,
  onSelect,
  title,
  description,
  cta,
  preview,
}: {
  role: SignupRole
  selected: SignupRole | null
  onSelect: (role: SignupRole) => void
  title: string
  description: string
  cta: string
  preview: React.ReactNode
}) {
  const isSelected = selected === role

  return (
    <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }}>
      <Link
        href={`/signup/${role}`}
        onClick={() => onSelect(role)}
        className={`group block rounded-[1.75rem] border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-from)] sm:p-6 ${
          isSelected
            ? "border-[var(--primary-from)] bg-violet-50 shadow-lg dark:bg-violet-950/20"
            : "border-slate-200 bg-white hover:shadow-md dark:border-[var(--border)] dark:bg-[var(--surface)]"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[var(--text-primary)]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {description}
            </p>
          </div>
          <span className="rounded-full bg-violet-100 p-2 text-[var(--primary-from)] dark:bg-violet-950/40">
            {role === "student" ? (
              <GraduationCap className="h-5 w-5" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
          </span>
        </div>
        <div className="mb-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3 dark:border-[var(--border)] dark:bg-[var(--bg)]">
          {preview}
        </div>
        <span className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--primary-from)] px-5 py-3 text-sm font-semibold text-white group-hover:bg-indigo-700">
          {cta}
        </span>
      </Link>
    </motion.div>
  )
}

export default function SignupRolePage() {
  const [selected, setSelected] = useState<SignupRole | null>(null)

  useEffect(() => {
    setSelected(getSignupRole())
  }, [])

  const handleSelect = (role: SignupRole) => {
    saveSignupRole(role)
    setSelected(role)
  }

  return (
    <RegistrationShell
      header={<RegistrationHeader />}
      preview={
        selected === "tutor" ? (
          <TutorProfileBuildPreview />
        ) : (
          <StudentSearchPreview />
        )
      }
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)] sm:text-3xl">
            How would you like to use Tutora?
          </h1>
          <p className="text-sm text-[var(--text-secondary)] sm:text-base">
            Pick one option to get started.
          </p>
        </div>
        <div className="grid gap-4">
          <RoleCard
            role="student"
            selected={selected}
            onSelect={handleSelect}
            title="I want to learn"
            description="Find tutors, save favorites, and book lessons."
            cta="Continue as a student"
            preview={
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <Search className="h-3.5 w-3.5" /> Subject search
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Math", "IELTS", "English"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold dark:bg-[var(--surface)]"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            }
          />
          <RoleCard
            role="tutor"
            selected={selected}
            onSelect={handleSelect}
            title="I want to teach"
            description="Build your profile and reach students on Tutora."
            cta="Continue as a tutor"
            preview={
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)]">
                  <LayoutDashboard className="h-3.5 w-3.5" /> Profile builder
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                  <CalendarDays className="h-3.5 w-3.5" /> Availability
                  <BookOpen className="h-3.5 w-3.5" /> Subjects
                </div>
              </div>
            }
          />
        </div>
        <p className="text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[var(--primary-from)] hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </RegistrationShell>
  )
}
