import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react"

const baseControlClass =
  "w-full rounded-[var(--radius-input)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] outline-none transition duration-150 placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-60"

export function FormField({
  label,
  error,
  children,
}: {
  label?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </span>
      )}
      {children}
      {error && <p className="mt-2 text-sm font-medium text-[var(--danger)]">{error}</p>}
    </label>
  )
}

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${baseControlClass} ${className}`.trim()} {...props} />
}

export function Textarea({
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${baseControlClass} ${className}`.trim()} {...props} />
}

export function Select({
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={`${baseControlClass} ${className}`.trim()} {...props} />
}

