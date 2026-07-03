"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Search, Users } from "lucide-react"

export const PageSwitcher = () => {
  const pathname = usePathname()

  const items = [
    { href: "/", key: "home", icon: BookOpen },
    { href: "/tutors", key: "findtutors", icon: Search },
    { href: "/dashboard", key: "dashboard", icon: Users },
  ]

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)

  return (
    <div className="fixed bottom-6 left-6 z-40 hidden md:block">
      <div className="bg-white/80 dark:bg-[var(--surface)] backdrop-blur-md p-2 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-[var(--border)] flex gap-1">
        {items.map((item) => {
          const Icon = item.icon

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all ${
                isActive(item.href)
                  ? "bg-[var(--primary-from)] text-white shadow-lg shadow-violet-200 dark:shadow-violet-950/40 scale-110"
                  : "text-slate-300 dark:text-[var(--text-muted)] hover:text-slate-500 dark:hover:text-zinc-400"
              }`}
            >
              <Icon className="w-5 h-5" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
