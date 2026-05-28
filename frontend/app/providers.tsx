"use client"

import { ChatProvider } from "@/lib/chat-context"
import { LocaleProvider } from "@/lib/i18n/locale-context"
import { ToastProvider } from "@/lib/toast-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <ToastProvider>
        <ChatProvider>{children}</ChatProvider>
      </ToastProvider>
    </LocaleProvider>
  )
}
