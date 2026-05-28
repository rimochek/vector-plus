"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type ChatContextValue = {
  isOpen: boolean
  openChat: () => void
  closeChat: () => void
  toggleChat: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleChat = useCallback(() => setIsOpen((prev) => !prev), [])

  const value = useMemo(
    () => ({ isOpen, openChat, closeChat, toggleChat }),
    [isOpen, openChat, closeChat, toggleChat],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error("useChat must be used within ChatProvider")
  }
  return ctx
}
