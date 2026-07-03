"use client"

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"
import { FriendlyError } from "./friendly-error"

const inputClass =
  "min-h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-[var(--primary-from)] transition focus:border-[var(--primary-from)] focus:ring-2 dark:border-[var(--border)] dark:bg-[var(--surface)]"

type FormFieldProps = {
  label: string
  error?: string
  hint?: string
  inputProps: InputHTMLAttributes<HTMLInputElement>
}

export function FormField({ label, error, hint, inputProps }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={inputProps.id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <input
        {...inputProps}
        aria-invalid={Boolean(error)}
        className={`${inputClass} ${error ? "border-red-300" : ""}`}
      />
      {hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
      <FriendlyError message={error} />
    </div>
  )
}

type TextAreaFieldProps = {
  label: string
  error?: string
  hint?: string
  textareaProps: TextareaHTMLAttributes<HTMLTextAreaElement>
}

export function TextAreaField({
  label,
  error,
  hint,
  textareaProps,
}: TextAreaFieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={textareaProps.id} className="text-sm font-semibold text-[var(--text-primary)]">
        {label}
      </label>
      <textarea
        {...textareaProps}
        aria-invalid={Boolean(error)}
        className={`min-h-[140px] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none ring-[var(--primary-from)] transition focus:border-[var(--primary-from)] focus:ring-2 dark:border-[var(--border)] dark:bg-[var(--surface)] ${error ? "border-red-300" : ""}`}
      />
      {hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
      <FriendlyError message={error} />
    </div>
  )
}
