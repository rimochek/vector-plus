"use client"

import { Calendar, Clock, BookOpen } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import type { ChatLesson } from "@/lib/api-client"

type LessonChatCardProps = {
  lesson: ChatLesson
  locale: string
  isTutor?: boolean
  onCancel?: (lessonId: string) => void
  onApprove?: (lessonId: string) => void
  onReject?: (lessonId: string) => void
}

function formatWhen(iso: string, locale: string) {
  return new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function LessonChatCard({
  lesson,
  locale,
  isTutor = false,
  onCancel,
  onApprove,
  onReject,
}: LessonChatCardProps) {
  const { t } = useTranslations()
  const isCancelled = lesson.status === "cancelled"
  const isPending = lesson.status === "pending"
  const isUpcoming = lesson.status === "upcoming"

  return (
    <div className="mx-auto w-full max-w-md">
      <div
        className={`rounded-[1.5rem] border p-4 shadow-sm ${
          isCancelled
            ? "border-red-200 bg-red-50/80 dark:border-red-900/40 dark:bg-red-950/20"
            : isPending
              ? "border-amber-200 bg-amber-50/80 dark:border-amber-900/40 dark:bg-amber-950/20"
              : "border-violet-100 bg-white dark:border-violet-900/30 dark:bg-[var(--surface)]"
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[var(--primary-from)]" />
          <p className="text-xs font-black uppercase tracking-widest text-[var(--primary-from)]">
            {t("chat.lessonCard.title")}
          </p>
        </div>

        <p className="text-sm font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          {formatWhen(lesson.scheduledStartAt, locale)}
        </p>

        {isPending && (
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            {t("chat.lessonCard.pending")}
          </p>
        )}

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-start gap-2 text-slate-600 dark:text-zinc-300">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>
              <span className="font-bold">{t("chat.lessonCard.subject")}: </span>
              {lesson.subject}
            </span>
          </div>
          <div className="flex items-start gap-2 text-slate-600 dark:text-zinc-300">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{lesson.durationMinutes} min</span>
          </div>
          {(lesson.studentPreferences.message ||
            lesson.studentPreferences.learningGoals ||
            lesson.studentPreferences.topics.length > 0) && (
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-zinc-800/80">
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                {t("chat.lessonCard.preferences")}
              </p>
              {lesson.studentPreferences.message && (
                <p className="mt-1 font-medium text-slate-600 dark:text-zinc-300">
                  {lesson.studentPreferences.message}
                </p>
              )}
              {lesson.studentPreferences.learningGoals && (
                <p className="mt-1 text-sm text-slate-500 dark:text-[var(--text-muted)]">
                  {lesson.studentPreferences.learningGoals}
                </p>
              )}
              {lesson.studentPreferences.topics.length > 0 && (
                <p className="mt-1 text-xs font-semibold text-[var(--primary-from)]">
                  {t("chat.lessonCard.topics")}: {lesson.studentPreferences.topics.join(", ")}
                </p>
              )}
            </div>
          )}
        </div>

        {isCancelled ? (
          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-2xl border border-red-200 bg-red-100 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          >
            {t("chat.lessonCard.cancelled")}
            {lesson.cancellationReasonLabel
              ? ` · ${lesson.cancellationReasonLabel}`
              : ""}
          </button>
        ) : isPending && isTutor && onApprove && onReject ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onApprove(lesson.id)}
              className="flex-1 rounded-2xl bg-[var(--primary-from)] py-2.5 text-xs font-black uppercase tracking-widest text-white transition hover:bg-[#7C3AED]"
            >
              {t("chat.lessonCard.approve")}
            </button>
            <button
              type="button"
              onClick={() => onReject(lesson.id)}
              className="flex-1 rounded-2xl border border-red-200 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
            >
              {t("chat.lessonCard.reject")}
            </button>
          </div>
        ) : (isUpcoming || isPending) && onCancel ? (
          <button
            type="button"
            onClick={() => onCancel(lesson.id)}
            className="mt-4 w-full rounded-2xl border border-red-200 py-2.5 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30"
          >
            {t("chat.lessonCard.cancelButton")}
          </button>
        ) : null}
      </div>
    </div>
  )
}
