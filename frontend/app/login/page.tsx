"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthTopBar } from "@/app/components/auth-top-bar"
import { ArrowRight, Mail, Lock } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"

export default function LoginPage() {
  const { t } = useTranslations()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    ;(async () => {
      try {
        const res = await fetch("http://localhost:3000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          setError(err.message || "Login failed")
          return
        }

        const data = await res.json()
        if (data.access_token) {
          localStorage.setItem("token", data.access_token)
        }
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }
        router.push("/")
      } catch (err) {
        setError("Network error")
      }
    })()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-[#1E293B] dark:text-zinc-100 flex flex-col transition-colors">
      <AuthTopBar title={t("auth.signInTitle")} />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-0 w-[420px] h-[420px] bg-violet-50 dark:bg-violet-950/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[360px] h-[360px] bg-indigo-50 dark:bg-indigo-950/20 rounded-full blur-[90px]" />
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            {t("auth.welcomeBack")}
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 font-medium mb-10">
            {t("auth.signInSubtitle")}
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-[2rem] p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-black/40"
          >
            {error && (
              <div className="text-red-600 font-bold text-sm">{error}</div>
            )}
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                {t("auth.email")}
              </span>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-zinc-600" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 focus:border-[#8B5CF6] outline-none transition-colors font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-2 block">
                {t("auth.password")}
              </span>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-zinc-600" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 focus:border-[#8B5CF6] outline-none transition-colors font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                  placeholder="••••••••"
                />
              </div>
            </label>

            <div className="flex items-center justify-between text-sm gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-600 dark:text-zinc-400">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-zinc-600 text-[#8B5CF6] focus:ring-[#8B5CF6]"
                />
                {t("auth.rememberMe")}
              </label>
              <button
                type="button"
                className="font-bold text-[#8B5CF6] hover:underline text-sm"
              >
                {t("auth.forgotPassword")}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-[#8B5CF6] text-white font-black text-sm uppercase tracking-widest hover:shadow-lg hover:shadow-violet-300/40 dark:hover:shadow-violet-950/50 transition-all flex items-center justify-center gap-2"
            >
              {t("auth.signIn")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center mt-8 text-slate-500 dark:text-zinc-400 font-medium">
            {t("auth.noAccount")}{" "}
            <Link
              href="/register"
              className="text-[#8B5CF6] font-black hover:underline"
            >
              {t("auth.createOne")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
