import { getApiUrl } from "@/lib/api"
import { api, type ApiTutor, type UpdateTutorProfilePayload } from "@/lib/api-client"
import {
  AUTH_FETCH_INIT,
  saveAuthSession,
  type StoredUser,
} from "@/lib/auth-client"
import { uploadAvatarAndRefreshTutorProfile } from "@/lib/uploads/upload-avatar"
import {
  listVerificationDocuments,
  uploadVerificationDocument as uploadVerificationToR2,
  type VerificationDocumentSummary,
} from "@/lib/uploads/upload-verification"
import type { VerificationDocumentCategory } from "@/lib/uploads/verification-types"
import {
  parseLegacyDocumentCategory,
  VERIFICATION_DOCUMENT_CATEGORIES,
} from "@/lib/uploads/verification-types"

export type MinimalSignupPayload = {
  email: string
  password: string
  firstName: string
  lastName: string
  role: "student" | "tutor"
}

export async function signupMinimal(payload: MinimalSignupPayload) {
  const res = await fetch(`${getApiUrl()}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, minimal: true }),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = err.message
    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : (message as string) || "Signup failed",
    )
  }

  const data = (await res.json()) as {
    access_token: string
    user: StoredUser
  }

  if (data.access_token && data.user) {
    saveAuthSession(data.access_token, data.user)
  }

  return data
}

export type StudentProfileUpdate = {
  displayName?: string
  lookingFor?: string
  tags?: string[]
  learningLevel?: string
  budgetMinCents?: number
  budgetMaxCents?: number
  budgetCurrency?: string
  preferredLessonFormat?: string
  preferredTimes?: string
  city?: string
  onboardingCompleted?: boolean
}

export async function updateStudentProfile(payload: StudentProfileUpdate) {
  return apiFetchStudent<Record<string, unknown>>("/students/profile/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

async function apiFetchStudent<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  const res = await fetch(`${getApiUrl()}${path}`, {
    ...AUTH_FETCH_INIT,
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = err.message
    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : (message as string) || "Request failed",
    )
  }
  return res.json() as Promise<T>
}

export async function updateTutorProfile(payload: UpdateTutorProfilePayload & {
  credentials?: { label: string; value: string }[]
  verificationDocuments?: {
    type: string
    fileName: string
    storageKey: string
  }[]
  languages?: string[]
  occupation?: string
}) {
  return api.tutors.updateProfile(payload)
}

export async function submitTutorApplication() {
  return apiFetchStudent<ApiTutor>("/tutors/profile/me/submit", {
    method: "POST",
  })
}

export async function uploadTutorAvatar(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ApiTutor> {
  return uploadAvatarAndRefreshTutorProfile(file, onProgress)
}

export async function uploadVerificationDocument(
  file: File,
  documentType: string,
  onProgress?: (percent: number) => void,
): Promise<ApiTutor> {
  await uploadVerificationDocumentDirect(file, documentType, onProgress)
  return api.tutors.ownProfile()
}

export async function uploadVerificationDocumentDirect(
  file: File,
  documentType: VerificationDocumentCategory | string,
  onProgress?: (percent: number) => void,
): Promise<VerificationDocumentSummary> {
  const category =
    typeof documentType === "string" &&
    VERIFICATION_DOCUMENT_CATEGORIES.includes(
      documentType as VerificationDocumentCategory,
    )
      ? (documentType as VerificationDocumentCategory)
      : parseLegacyDocumentCategory(documentType)

  return uploadVerificationToR2(
    file,
    { documentCategory: category },
    onProgress,
  )
}

export { listVerificationDocuments }
