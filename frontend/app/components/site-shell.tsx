"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useAuthSession } from "@/lib/use-auth-session"
import { Footer } from "@/app/components/footer"
import { LandingNavbar } from "@/app/components/landing/navbar"
import { Navigation } from "@/app/components/site-navigation"

export const SiteShell = ({ children }: { children: ReactNode }) => {
  const pathname = usePathname()
  const { isLoggedIn: loggedIn, ready } = useAuthSession()
  const isAppDashboard =
    pathname.startsWith("/tutor-dashboard") || pathname === "/dashboard"
  // Keep the server render and the first browser render identical. Reading
  // localStorage here before hydration produced two different header trees.
  const showLandingNav = !isAppDashboard && (!ready || !loggedIn)

  return (
    <div className="flex min-h-screen w-full max-w-[100vw] flex-col bg-[var(--bg)] text-[var(--text-primary)] selection:bg-[var(--glow)] selection:text-[var(--text-primary)]">
      {!isAppDashboard &&
        (showLandingNav ? <LandingNavbar /> : <Navigation />)}
      <main
        className={`w-full min-w-0 max-w-full flex-1 overflow-x-clip ${showLandingNav ? "pt-[72px]" : ""}`}
      >
        <div key={pathname} className="tutora-page-enter min-w-0 max-w-full">
          {children}
        </div>
      </main>
      {!isAppDashboard && <Footer />}
    </div>
  )
}
