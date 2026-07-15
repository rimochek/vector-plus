import type { Metadata } from "next"
import Script from "next/script"
import "./globals.css"
import { Providers } from "./providers"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Tutora — Find your perfect tutor",
  description:
    "Modern tutoring marketplace. Find verified tutors, book lessons, and learn with confidence.",
  icons: {
    icon: "/tutora-logo.svg",
    apple: "/tutora-logo.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="light h-full max-w-[100vw] antialiased"
    >
      <body className="flex min-h-full max-w-[100vw] flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        <Providers>{children}</Providers>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </body>
    </html>
  )
}
