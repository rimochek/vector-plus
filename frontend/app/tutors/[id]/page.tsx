import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { TutorProfile } from "@/app/components/tutor-profile"
import { SiteShell } from "@/app/components/site-shell"
import { getPublicTutor } from "@/lib/tutor-public"

type PageProps = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const tutor = await getPublicTutor(id).catch(() => null)
  if (!tutor) return { title: "Репетитор не найден | Tutora" }

  const description = tutor.headline || tutor.bio.slice(0, 155)
  return {
    title: `${tutor.displayName} — репетитор | Tutora`,
    description,
    openGraph: {
      title: `${tutor.displayName} — репетитор`,
      description,
      images: tutor.avatarUrl ? [{ url: tutor.avatarUrl }] : undefined,
    },
  }
}

export default async function TutorProfilePage({ params }: PageProps) {
  const { id } = await params
  const tutor = await getPublicTutor(id)
  if (!tutor) notFound()

  return (
    <SiteShell>
      <TutorProfile initialTutor={tutor} />
    </SiteShell>
  )
}
