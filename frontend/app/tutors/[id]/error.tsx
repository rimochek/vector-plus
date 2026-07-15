"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button, ButtonLink } from "@/app/components/ui/button"
import { Container } from "@/app/components/ui/container"

export default function TutorProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Tutor profile render failed", error)
  }, [error])

  return (
    <Container size="content" className="py-16 sm:py-24">
      <div className="mx-auto max-w-xl rounded-[var(--radius-panel)] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-sm)] sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <AlertTriangle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-[var(--text-primary)]">
          Не удалось загрузить профиль
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          Сервис временно недоступен. Попробуйте ещё раз или вернитесь к каталогу репетиторов.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button type="button" className="gap-2" onClick={reset}>
            <RefreshCw className="h-4 w-4" />
            Повторить
          </Button>
          <ButtonLink href="/tutors" variant="secondary">
            Вернуться в каталог
          </ButtonLink>
        </div>
      </div>
    </Container>
  )
}
