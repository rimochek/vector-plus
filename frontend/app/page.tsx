import { AuthHomeGate } from "@/app/components/auth-home-gate"
import { LandingPage } from "@/app/components/landing-page"
import { SiteShell } from "@/app/components/site-shell"

export default function HomePage() {
  return (
    <SiteShell>
      <AuthHomeGate>
        <LandingPage />
      </AuthHomeGate>
    </SiteShell>
  )
}
