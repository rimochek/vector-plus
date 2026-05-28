"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { AlertCircle, AlertTriangle, CheckCircle2, X } from "lucide-react"

export type ToastType = "error" | "success" | "warning"

type ToastItem = {
  id: string
  type: ToastType
  message: string
  exiting: boolean
}

type ToastApi = {
  error: (message: string) => void
  success: (message: string) => void
  warning: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const TOAST_DURATION_MS = 5500
const TOAST_EXIT_MS = 320
const MAX_TOASTS = 3

function toastStyles(type: ToastType): string {
  switch (type) {
    case "error":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/90 dark:text-red-200"
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/90 dark:text-emerald-200"
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/90 dark:text-amber-200"
  }
}

function progressBarColor(type: ToastType): string {
  switch (type) {
    case "error":
      return "bg-red-400/70 dark:bg-red-500/60"
    case "success":
      return "bg-emerald-400/70 dark:bg-emerald-500/60"
    case "warning":
      return "bg-amber-400/70 dark:bg-amber-500/60"
  }
}

function ToastIcon({ type }: { type: ToastType }) {
  const className = "h-5 w-5 shrink-0"
  if (type === "error") return <AlertCircle className={className} />
  if (type === "success") return <CheckCircle2 className={className} />
  return <AlertTriangle className={className} />
}

function ToastItemView({
  toast,
  index,
  onDismiss,
}: {
  toast: ToastItem
  index: number
  onDismiss: (id: string) => void
}) {
  return (
    <div
      role="alert"
      style={
        {
          "--toast-duration": `${TOAST_DURATION_MS}ms`,
          animationDelay: toast.exiting ? undefined : `${index * 60}ms`,
        } as CSSProperties
      }
      className={`pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-lg ${
        toast.exiting ? "toast-item-exit" : "toast-item-enter"
      } ${toastStyles(toast.type)}`}
    >
      <div className="flex items-start gap-3 px-4 py-3.5">
        <ToastIcon type={toast.type} />
        <p className="min-w-0 flex-1 pt-0.5 text-sm font-semibold leading-snug">
          {toast.message}
        </p>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="shrink-0 rounded-lg p-1 opacity-70 transition hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {!toast.exiting && (
        <div
          className={`toast-progress-bar absolute bottom-0 left-0 h-0.5 w-full ${progressBarColor(toast.type)}`}
        />
      )}
    </div>
  )
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || toasts.length === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[500] flex flex-col items-center gap-2 px-4 pt-4 sm:pt-5"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast, index) => (
        <ToastItemView
          key={toast.id}
          toast={toast}
          index={index}
          onDismiss={onDismiss}
        />
      ))}
    </div>,
    document.body,
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, number>>(new Map())

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const enqueueRemove = useCallback(
    (id: string) => {
      window.setTimeout(() => removeToast(id), TOAST_EXIT_MS)
    },
    [removeToast],
  )

  const dismiss = useCallback(
    (id: string) => {
      setToasts((prev) => {
        const target = prev.find((t) => t.id === id)
        if (!target || target.exiting) return prev
        return prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      })

      const autoTimer = timersRef.current.get(id)
      if (autoTimer) {
        clearTimeout(autoTimer)
        timersRef.current.delete(id)
      }

      enqueueRemove(id)
    },
    [enqueueRemove],
  )

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID()

      setToasts((prev) => {
        const active = prev.filter((t) => !t.exiting)
        let next = [...prev]

        if (active.length >= MAX_TOASTS) {
          const oldest = active[0]
          next = next.map((t) =>
            t.id === oldest.id ? { ...t, exiting: true } : t,
          )
          const oldTimer = timersRef.current.get(oldest.id)
          if (oldTimer) {
            clearTimeout(oldTimer)
            timersRef.current.delete(oldest.id)
          }
          enqueueRemove(oldest.id)
        }

        return [...next, { id, type, message, exiting: false }]
      })

      const autoTimer = window.setTimeout(() => dismiss(id), TOAST_DURATION_MS)
      timersRef.current.set(id, autoTimer)
    },
    [dismiss, enqueueRemove],
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const toast: ToastApi = {
    error: (message) => show("error", message),
    success: (message) => show("success", message),
    warning: (message) => show("warning", message),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return ctx
}
