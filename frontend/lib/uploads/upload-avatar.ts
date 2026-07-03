import { api, type ApiTutor } from "@/lib/api-client"
import { getApiUrl } from "@/lib/api"
import { AUTH_FETCH_INIT } from "@/lib/auth-client"
import { directUpload } from "./upload-file"

export type AvatarUploadResult = {
  avatarUrl: string
  avatarObjectKey: string
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function uploadAvatar(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<AvatarUploadResult> {
  const result = await directUpload<AvatarUploadResult>(
    "/uploads/avatar/presign",
    "/uploads/avatar/complete",
    file,
    onProgress,
  )

  try {
    await api.tutors.ownProfile()
  } catch {
    /* profile refresh is best-effort */
  }

  return result
}

export async function deleteAvatar(): Promise<{ avatarUrl: string | null }> {
  const res = await fetch(`${getApiUrl()}/uploads/avatar`, {
    method: "DELETE",
    headers: authHeaders(),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    throw new Error("Could not remove profile photo")
  }

  return res.json() as Promise<{ avatarUrl: string | null }>
}

export async function uploadAvatarAndRefreshTutorProfile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ApiTutor> {
  await uploadAvatar(file, onProgress)
  return api.tutors.ownProfile()
}
