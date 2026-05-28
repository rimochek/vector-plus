import { ReactNode } from "react"
import { AIChatAssistant } from "@/app/components/ai-chat-assistant"
import { Footer } from "@/app/components/footer"
import { Navigation } from "@/app/components/site-navigation"
import { PageSwitcher } from "@/app/components/page-switcher"

export const SiteShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-white font-sans text-[#1E293B] transition-colors duration-200 selection:bg-[#8B5CF6]/30 selection:text-[#1E293B] dark:bg-zinc-950 dark:text-zinc-100 dark:selection:text-zinc-100">
      <Navigation />

      <main className="w-full min-w-0 max-w-[100vw] overflow-x-hidden">{children}</main>

      <Footer />
      <AIChatAssistant />
      <PageSwitcher />
    </div>
  )
}
