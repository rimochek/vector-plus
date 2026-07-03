import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
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
      className={`${inter.variable} light h-full max-w-[100vw] antialiased`}
    >
      <body className="flex min-h-full max-w-[100vw] flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
