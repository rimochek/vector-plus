"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { AuthWizardLayout, WizardStepHeader, type WizardStepItem } from "@/app/components/auth-wizard-layout"
import { GoogleSignInButton, GoogleAuthDivider } from "@/app/components/auth/google-sign-in-button"
import { TelegramSignInButton } from "@/app/components/auth/telegram-sign-in-button"
import { useToast } from "@/lib/toast-context"

const steps: WizardStepItem[] = [
  { id: "signin", label: "Безопасный вход", status: "current" },
  { id: "explore", label: "Найдите преподавателя", status: "upcoming" },
  { id: "learn", label: "Начните учиться", status: "upcoming" },
]

export default function LoginPage() {
  const toast = useToast()
  return (
    <AuthWizardLayout
      mode="login"
      sidebarTitle="С возвращением в Tutora"
      sidebarSubtitle="Один аккаунт для занятий, расписания и общения."
      steps={steps}
      footer={<>Впервые здесь? <Link href="/signup" className="font-bold text-[var(--primary-from)]">Создать аккаунт</Link></>}
    >
      <div className="space-y-5">
        <WizardStepHeader
          eyebrow="Быстро и безопасно"
          title="Войдите в Tutora"
          subtitle="Пароли больше не нужны — используйте Google или Telegram."
        />
        <GoogleSignInButton onError={(message) => toast.error(message)} redirectAfterSuccess />
        <GoogleAuthDivider />
        <TelegramSignInButton onError={(message) => toast.error(message)} redirectAfterSuccess />
        <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Мы не храним пароли. Доступ защищён вашим аккаунтом Google или Telegram.</p>
        </div>
      </div>
    </AuthWizardLayout>
  )
}
