import { redirect } from "next/navigation"

type PageProps = { params: Promise<{ id: string }> }

export default async function LegacyTutorProfilePage({ params }: PageProps) {
  const { id } = await params
  redirect(`/tutors/${encodeURIComponent(id)}`)
}
