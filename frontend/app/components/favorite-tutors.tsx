"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart, Loader2, Star } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type FavoriteEntry } from "@/lib/api-client"
import { formatTenge } from "@/lib/currency"

export const FavoriteTutors = () => {
  const { t } = useTranslations()
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.favorites
      .list()
      .then(setFavorites)
      .catch(() => setFavorites([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-xl">
        <h2 className="mb-3 text-5xl font-black tracking-tight text-[#1E293B] dark:text-zinc-50">
          {t("favorites.title")}
        </h2>
        <p className="text-lg font-semibold text-slate-400 dark:text-zinc-500">
          {t("favorites.subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/80 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <Heart className="mx-auto mb-4 h-10 w-10 text-slate-300 dark:text-zinc-600" />
          <p className="font-semibold text-slate-500 dark:text-zinc-400">
            {t("favorites.empty")}
          </p>
          <Link
            href="/tutors"
            className="mt-6 inline-flex rounded-2xl bg-[#8B5CF6] px-6 py-3 text-sm font-black uppercase tracking-widest text-white"
          >
            {t("favorites.browse")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {favorites.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-4 rounded-[2rem] border border-slate-100 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-2xl font-black text-white">
                {entry.tutor.displayName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-[#1E293B] dark:text-zinc-100">
                  {entry.tutor.displayName}
                </h3>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8B5CF6]">
                  {entry.tutor.subject}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-black text-[#1E293B] dark:text-zinc-100">
                <Star className="h-4 w-4 fill-[#8B5CF6] text-[#8B5CF6]" />
                {entry.tutor.ratingAvg.toFixed(1)}
              </div>
              <Link
                href={`/tutors/${entry.tutorProfileId}`}
                className="rounded-2xl bg-[#F1F5F9] px-5 py-3 text-sm font-black text-[#1E293B] transition hover:bg-[#8B5CF6] hover:text-white dark:bg-zinc-800 dark:text-zinc-100"
              >
                {t("find.bookSession")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
