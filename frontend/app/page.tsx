import type { Metadata } from "next"
import { AuthHomeGate } from "@/app/components/auth-home-gate"
import { LandingPage } from "@/app/components/landing/landing-page"

export const metadata: Metadata = {
  title: "Tutora — Find the right tutor for your goals",
  description:
    "Discover tutors for school subjects, exams, languages, and more. Compare profiles, find the right match, and manage your learning with Tutora.",
  openGraph: {
    title: "Tutora — Find the right tutor for your goals",
    description:
      "Discover tutors for school subjects, exams, languages, and more. Compare profiles, find the right match, and manage your learning with Tutora.",
    type: "website",
    images: [{ url: "/tutora-logo.png", alt: "Tutora" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tutora — Find the right tutor for your goals",
    description:
      "Discover tutors for school subjects, exams, languages, and more. Compare profiles, find the right match, and manage your learning with Tutora.",
    images: ["/tutora-logo.png"],
  },
}

export default function HomePage() {
  return (
    <AuthHomeGate>
      <LandingPage />
    </AuthHomeGate>
  )
}
