import { directUpload } from "./upload-file"
import { getApiUrl } from "@/lib/api"
import { AUTH_FETCH_INIT } from "@/lib/auth-client"
import type {
  VerificationDocumentSummary,
  VerificationOptionsResponse,
  VerificationUploadPayload,
} from "./verification-types"

export type VerificationDownloadUrlResponse = {
  downloadUrl: string
  expiresInSeconds: number
  fileName: string
}

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function getVerificationOptions(): Promise<VerificationOptionsResponse> {
  const res = await fetch(`${getApiUrl()}/uploads/verification/options`, {
    headers: authHeaders(),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    throw new Error("Could not load verification options")
  }

  return res.json() as Promise<VerificationOptionsResponse>
}

export async function uploadVerificationDocument(
  file: File,
  payload: VerificationUploadPayload,
  onProgress?: (percent: number) => void,
): Promise<VerificationDocumentSummary> {
  return directUpload<VerificationDocumentSummary>(
    "/uploads/verification/presign",
    "/uploads/verification/complete",
    file,
    onProgress,
    payload,
  )
}

export async function listVerificationDocuments(): Promise<
  VerificationDocumentSummary[]
> {
  const res = await fetch(`${getApiUrl()}/uploads/verification`, {
    headers: authHeaders(),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    throw new Error("Could not load verification documents")
  }

  return res.json() as Promise<VerificationDocumentSummary[]>
}

export async function getVerificationDownloadUrl(
  documentId: string,
): Promise<VerificationDownloadUrlResponse> {
  const res = await fetch(
    `${getApiUrl()}/uploads/verification/${documentId}/download-url`,
    {
      headers: authHeaders(),
      ...AUTH_FETCH_INIT,
    },
  )

  if (!res.ok) {
    throw new Error("Could not load document preview")
  }

  return res.json() as Promise<VerificationDownloadUrlResponse>
}

export async function deleteVerificationDocument(
  documentId: string,
): Promise<void> {
  const res = await fetch(`${getApiUrl()}/uploads/verification/${documentId}`, {
    method: "DELETE",
    headers: authHeaders(),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    throw new Error("Could not delete document")
  }
}

export type {
  VerificationDocumentSummary,
  VerificationOptionsResponse,
  VerificationUploadPayload,
}
