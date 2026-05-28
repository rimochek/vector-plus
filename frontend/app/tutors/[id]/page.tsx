import { Suspense } from "react"
import { TutorProfile } from "@/app/components/tutor-profile"
import { SiteShell } from "@/app/components/site-shell"

export default function TutorProfilePage() {
  return (
    <SiteShell>
      <Suspense fallback={null}>
        <TutorProfile />
      </Suspense>
    </SiteShell>
  )
}
