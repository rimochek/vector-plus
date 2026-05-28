import { Suspense } from "react"
import { Dashboard } from "@/app/components/dashboard"
import { SiteShell } from "@/app/components/site-shell"

export default function DashboardPage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <Dashboard />
      </Suspense>
    </SiteShell>
  )
}
