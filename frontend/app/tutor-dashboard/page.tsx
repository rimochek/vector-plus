import { Suspense } from "react"
import { TutorDashboard } from "@/app/components/tutor-dashboard"
import { SiteShell } from "@/app/components/site-shell"

export default function TutorDashboardPage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <TutorDashboard />
      </Suspense>
    </SiteShell>
  )
}
