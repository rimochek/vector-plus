"use client"

import { useEffect, useState } from "react"
import { Heart, Loader2, Star } from "lucide-react"
import { useTranslations } from "@/lib/i18n/locale-context"
import { api, type FavoriteEntry } from "@/lib/api-client"
import { Container } from "@/app/components/ui/container"
import { EmptyState } from "@/app/components/ui/empty-state"
import { ButtonLink } from "@/app/components/ui/button"

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
    <Container size="search" className="py-12 sm:py-16">
      <div className="mb-10 max-w-xl">
        <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
          {t("favorites.title")}
        </h2>
        <p className="text-lg font-semibold text-[var(--text-muted)]">
          {t("favorites.subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-from)]" />
        </div>
      ) : favorites.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border-2 border-dashed border-[var(--border)] bg-[var(--surface)] p-10">
          <EmptyState
            icon={Heart}
            title={t("favorites.empty")}
            description={t("favorites.subtitle")}
            action={{
              label: t("favorites.browse"),
              onClick: () => window.location.assign("/tutors"),
            }}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {favorites.map((entry) => (
            <article
              key={entry.id}
              className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center"
            >
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary-from)] to-[var(--primary-to)] text-2xl font-black text-white">
                {entry.tutor.displayName.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                  {entry.tutor.displayName}
                </h3>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--primary-from)]">
                  {entry.tutor.subject}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm font-black text-[var(--text-primary)] dark:text-[var(--text-primary)]">
                <Star className="h-4 w-4 fill-[var(--primary-from)] text-[var(--primary-from)]" />
                {entry.tutor.ratingAvg.toFixed(1)}
              </div>
              <ButtonLink href={`/tutors/${entry.tutorProfileId}`} variant="secondary">
                {t("find.bookSession")}
              </ButtonLink>
            </article>
          ))}
        </div>
      )}
    </Container>
  )
}
