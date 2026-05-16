"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { AuthTopBar } from "@/app/components/auth-top-bar"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  GraduationCap,
  UserRound,
  X,
} from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { MessageId } from "@/lib/i18n/messages"

type Role = "student" | "tutor"
type Phase = 1 | 2 | 3 | 4

const TAG_IDS = [
  "sat_act",
  "ielts",
  "nuet",
  "unt",
  "school_prep",
  "math",
  "english",
  "ap_ib",
] as const

type TagId = (typeof TAG_IDS)[number]

const PRESET_TAG_SET = new Set<string>(TAG_IDS)

const WORKPLACE_IDS = [
  "remote",
  "university",
  "office",
  "student_home",
  "coworking",
  "public",
] as const

const AGE_STUDENT_IDS = ["any", "1825", "2635", "3645", "46plus"] as const
const AGE_TUTOR_IDS = [
  "any",
  "k12",
  "undergrad",
  "grad_adult",
  "professionals",
] as const

export default function RegisterPage() {
  const { t } = useTranslations()
  const [phase, setPhase] = useState<Phase>(1)
  const [role, setRole] = useState<Role | null>(null)
  const [about, setAbout] = useState("")
  const [lookingFor, setLookingFor] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [customTag, setCustomTag] = useState("")
  const [workplaceId, setWorkplaceId] = useState<string | null>(null)
  const [ageChoice, setAgeChoice] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const tagLabel = (id: TagId) => t(`register.tag.${id}` as MessageId)

  const workplaceLabel = (id: (typeof WORKPLACE_IDS)[number]) =>
    t(`register.workplace.${id}` as MessageId)

  const ageStudentLabel = (id: (typeof AGE_STUDENT_IDS)[number]) =>
    t(`register.ageStudent.${id}` as MessageId)

  const ageTutorLabel = (id: (typeof AGE_TUTOR_IDS)[number]) =>
    t(`register.ageTutor.${id}` as MessageId)

  const selectRole = (r: Role) => {
    setRole(r)
    setWorkplaceId(null)
    setAgeChoice(null)
  }

  const { displayStep, displayTotal } = useMemo(() => {
    if (!role) return { displayStep: 1, displayTotal: 4 }
    if (role === "student") {
      if (phase === 1) return { displayStep: 1, displayTotal: 3 }
      if (phase === 2) return { displayStep: 2, displayTotal: 3 }
      return { displayStep: 3, displayTotal: 3 }
    }
    return { displayStep: phase, displayTotal: 4 }
  }, [phase, role])

  const progress = useMemo(() => {
    if (!role) return (phase / 4) * 100
    if (role === "student") {
      const map: Record<number, number> = { 1: 33, 2: 66, 4: 100 }
      return map[phase] ?? 0
    }
    return (phase / 4) * 100
  }, [phase, role])

  const toggleTag = (tagId: string) => {
    setTags((prev) =>
      prev.includes(tagId) ? prev.filter((x) => x !== tagId) : [...prev, tagId],
    )
  }

  const addCustomTag = () => {
    const v = customTag.trim()
    if (!v || tags.includes(v)) return
    setTags((prev) => [...prev, v])
    setCustomTag("")
  }

  const canNext = (): boolean => {
    if (phase === 1) return role !== null
    if (phase === 2) {
      return (
        about.trim().length > 0 ||
        lookingFor.trim().length > 0 ||
        tags.length > 0
      )
    }
    if (phase === 3) return role === "tutor" && workplaceId !== null
    if (phase === 4) return ageChoice !== null
    return false
  }

  const goNext = () => {
    if (!canNext()) return
    if (phase === 1) {
      setPhase(2)
      return
    }
    if (phase === 2) {
      if (role === "tutor") setPhase(3)
      else setPhase(4)
      return
    }
    if (phase === 3) {
      setPhase(4)
      return
    }
    if (phase === 4) {
      // finalize registration: call backend signup
      setError(null)
      ;(async () => {
        try {
          const payload: any = {
            email,
            password,
            firstName,
            lastName,
            // additional profile fields may be sent to be stored later
            role,
            about,
            lookingFor,
            tags,
            workplaceId,
            ageChoice,
          }

          const res = await fetch("http://localhost:3000/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            setError(err.message || "Signup failed")
            return
          }

          const data = await res.json()
          if (data.access_token)
            localStorage.setItem("token", data.access_token)
          if (data.user) localStorage.setItem("user", JSON.stringify(data.user))
          setDone(true)
          // redirect to home/dashboard
          window.location.href = "/"
        } catch (err) {
          setError("Network error")
        }
      })()
    }
  }

  const goBack = () => {
    if (phase === 1) return
    if (phase === 2) {
      setPhase(1)
      return
    }
    if (phase === 3) {
      setPhase(2)
      return
    }
    if (phase === 4) {
      if (role === "tutor") setPhase(3)
      else setPhase(2)
    }
  }

  if (done && role) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 text-[#1E293B] dark:text-zinc-100 flex flex-col transition-colors">
        <AuthTopBar title={t("auth.accountTitle")} />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
          <div className="w-full max-w-md text-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-10 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black mb-2">
              {t("register.done.title")}
            </h1>
            <p className="text-slate-500 dark:text-zinc-400 font-medium mb-8">
              {t("register.done.prefix")}{" "}
              <span className="text-[#8B5CF6] font-black">
                {role === "tutor"
                  ? t("register.done.roleTutor")
                  : t("register.done.roleStudent")}
              </span>
              . {t("register.done.note")}
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#8B5CF6] text-white font-black text-sm uppercase tracking-widest"
            >
              {t("register.done.home")}
            </Link>
            <Link
              href="/login"
              className="block mt-4 text-sm font-bold text-[#8B5CF6] hover:underline"
            >
              {t("register.done.login")}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-[#1E293B] dark:text-zinc-100 flex flex-col transition-colors">
      <AuthTopBar title={t("auth.joinTitle")} />

      <div className="flex-1 px-4 py-8 sm:py-12">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-24 right-10 w-[400px] h-[400px] bg-violet-50 dark:bg-violet-950/25 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2">
              <span>
                {t("register.stepOf", {
                  current: displayStep,
                  total: displayTotal,
                })}
              </span>
              <span>{t("register.percent", { n: Math.round(progress) })}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-10 shadow-xl shadow-slate-200/40 dark:shadow-black/40 min-h-[420px] flex flex-col">
            {phase === 1 && (
              <>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  {t("register.role.title")}
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-8">
                  {t("register.role.subtitle")}
                </p>
                <div className="grid gap-4 flex-1">
                  <button
                    type="button"
                    onClick={() => selectRole("student")}
                    className={`flex items-start gap-4 p-6 rounded-[1.5rem] border-2 text-left transition-all ${
                      role === "student"
                        ? "border-[#8B5CF6] bg-violet-50/80 dark:bg-violet-950/30"
                        : "border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <UserRound className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-black text-lg block mb-1">
                        {t("register.role.studentTitle")}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                        {t("register.role.studentDesc")}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => selectRole("tutor")}
                    className={`flex items-start gap-4 p-6 rounded-[1.5rem] border-2 text-left transition-all ${
                      role === "tutor"
                        ? "border-[#8B5CF6] bg-violet-50/80 dark:bg-violet-950/30"
                        : "border-slate-100 dark:border-zinc-800 hover:border-slate-200 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-950/50 text-[#8B5CF6]">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="font-black text-lg block mb-1">
                        {t("register.role.tutorTitle")}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                        {t("register.role.tutorDesc")}
                      </span>
                    </div>
                  </button>
                </div>
              </>
            )}

            {phase === 2 && role === "student" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  {t("register.step2.title")}
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-6">
                  {t("register.step2.subtitle")}
                </p>
                <label className="block mb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                    {t("register.step2.lookingLabel")}
                  </span>
                  <input
                    type="text"
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    placeholder={t("register.step2.lookingPlaceholder")}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 focus:border-[#8B5CF6] outline-none font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  />
                </label>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                  {t("register.step2.tagsHintStudent")}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {TAG_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleTag(id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${
                        tags.includes(id)
                          ? "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                          : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-100 dark:border-zinc-700 hover:border-[#8B5CF6]/50"
                      }`}
                    >
                      {tagLabel(id)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCustomTag()
                      }
                    }}
                    placeholder={t("register.step2.customPlaceholder")}
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-4 py-2.5 rounded-xl bg-[#1E293B] dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black uppercase"
                  >
                    {t("register.step2.add")}
                  </button>
                </div>
                {tags.filter((x) => !PRESET_TAG_SET.has(x)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags
                      .filter((x) => !PRESET_TAG_SET.has(x))
                      .map((x) => (
                        <span
                          key={x}
                          className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-[#8B5CF6] text-xs font-bold"
                        >
                          {x}
                          <button
                            type="button"
                            onClick={() => toggleTag(x)}
                            className="p-0.5 rounded hover:bg-violet-200/50 dark:hover:bg-violet-900/50"
                            aria-label={t("register.removeTag")}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </>
            )}

            {phase === 2 && role === "tutor" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  {t("register.step2.title")}
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-6">
                  {t("register.step2.subtitle")}
                </p>
                <label className="block mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                    {t("register.step2.introLabel")}
                  </span>
                  <textarea
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    rows={3}
                    placeholder={t("register.step2.introPlaceholder")}
                    className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 focus:border-[#8B5CF6] outline-none resize-none font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  />
                </label>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-3">
                  {t("register.step2.tagsHintTutor")}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {TAG_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleTag(id)}
                      className={`px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wide border transition-all ${
                        tags.includes(id)
                          ? "bg-[#8B5CF6] text-white border-[#8B5CF6]"
                          : "bg-slate-50 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-100 dark:border-zinc-700 hover:border-[#8B5CF6]/50"
                      }`}
                    >
                      {tagLabel(id)}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addCustomTag()
                      }
                    }}
                    placeholder={t("register.step2.customPlaceholder")}
                    className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-sm font-medium"
                  />
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-4 py-2.5 rounded-xl bg-[#1E293B] dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-black uppercase"
                  >
                    {t("register.step2.add")}
                  </button>
                </div>
                {tags.filter((x) => !PRESET_TAG_SET.has(x)).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tags
                      .filter((x) => !PRESET_TAG_SET.has(x))
                      .map((x) => (
                        <span
                          key={x}
                          className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-[#8B5CF6] text-xs font-bold"
                        >
                          {x}
                          <button
                            type="button"
                            onClick={() => toggleTag(x)}
                            className="p-0.5 rounded hover:bg-violet-200/50 dark:hover:bg-violet-900/50"
                            aria-label={t("register.removeTag")}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </>
            )}

            {phase === 3 && role === "tutor" && (
              <>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  {t("register.step3.title")}
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-8">
                  {t("register.step3.subtitle")}
                </p>
                <div className="space-y-3 flex-1">
                  {WORKPLACE_IDS.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setWorkplaceId(id)}
                      className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                        workplaceId === id
                          ? "border-[#8B5CF6] bg-violet-50/80 dark:bg-violet-950/30 text-[#8B5CF6]"
                          : "border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:border-slate-200 dark:hover:border-zinc-600"
                      }`}
                    >
                      {workplaceLabel(id)}
                    </button>
                  ))}
                </div>
              </>
            )}

            {phase === 4 && role && (
              <>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  {role === "student"
                    ? t("register.step4.studentTitle")
                    : t("register.step4.tutorTitle")}
                </h1>
                <p className="text-slate-500 dark:text-zinc-400 font-medium mb-8">
                  {role === "student"
                    ? t("register.step4.studentSubtitle")
                    : t("register.step4.tutorSubtitle")}
                </p>
                <div className="space-y-3 flex-1">
                  {(role === "student" ? AGE_STUDENT_IDS : AGE_TUTOR_IDS).map(
                    (id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setAgeChoice(id)}
                        className={`w-full text-left px-5 py-4 rounded-2xl border-2 font-bold text-sm transition-all ${
                          ageChoice === id
                            ? "border-[#8B5CF6] bg-violet-50/80 dark:bg-violet-950/30 text-[#8B5CF6]"
                            : "border-slate-100 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 hover:border-slate-200 dark:hover:border-zinc-600"
                        }`}
                      >
                        {role === "student"
                          ? ageStudentLabel(
                              id as (typeof AGE_STUDENT_IDS)[number],
                            )
                          : ageTutorLabel(id as (typeof AGE_TUTOR_IDS)[number])}
                      </button>
                    ),
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-sm font-black mb-2">
                      {t("auth.firstName")}
                    </span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black mb-2">
                      {t("auth.lastName")}
                    </span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black mb-2">
                      {t("auth.email")}
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-black mb-2">
                      {t("auth.password")}
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950"
                    />
                  </label>
                  {error && (
                    <div className="text-red-600 font-bold">{error}</div>
                  )}
                </div>
              </>
            )}

            <div className="flex gap-3 mt-auto pt-10">
              <button
                type="button"
                onClick={goBack}
                disabled={phase === 1}
                className="flex items-center justify-center gap-2 px-5 py-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-800 font-black text-xs uppercase tracking-widest text-slate-600 dark:text-zinc-300 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {t("register.back")}
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={!canNext()}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#8B5CF6] text-white font-black text-xs uppercase tracking-widest disabled:opacity-40 disabled:pointer-events-none hover:shadow-lg hover:shadow-violet-300/30 dark:hover:shadow-violet-950/40 transition-all"
              >
                {phase === 4 ? t("register.finish") : t("register.continue")}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <p className="text-center mt-8 text-slate-500 dark:text-zinc-400 font-medium text-sm">
            {t("register.alreadyHave")}{" "}
            <Link
              href="/login"
              className="text-[#8B5CF6] font-black hover:underline"
            >
              {t("register.signInLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
