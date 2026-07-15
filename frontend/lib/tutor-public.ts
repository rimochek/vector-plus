import "server-only"

import { cache } from "react"
import type { ApiTutor } from "./api-client"

function getServerApiUrl(): string {
  return process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
}

export const getPublicTutor = cache(async (id: string): Promise<ApiTutor | null> => {
  const response = await fetch(`${getServerApiUrl()}/tutors/${encodeURIComponent(id)}`, {
    cache: "no-store",
  })

  if (response.status === 404) return null
  if (!response.ok) throw new Error(`Tutor API failed with ${response.status}`)
  return response.json() as Promise<ApiTutor>
})
