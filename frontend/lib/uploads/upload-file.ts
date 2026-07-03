import { getApiUrl } from "@/lib/api"
import { AUTH_FETCH_INIT } from "@/lib/auth-client"

export type PresignResponse = {
  uploadId: string
  uploadUrl: string
  expiresAt?: string
}

export type UploadProgressHandler = (percent: number) => void

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function parseError(res: Response): Promise<string> {
  const err = (await res.json().catch(() => ({}))) as {
    message?: string | string[]
  }
  const message = err.message
  return Array.isArray(message)
    ? message.join(", ")
    : (message as string) || "Upload failed"
}

export async function presignUpload(
  path: string,
  file: File,
  extra?: Record<string, string | string[] | undefined>,
): Promise<PresignResponse> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      ...extra,
    }),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  return res.json() as Promise<PresignResponse>
}

export function uploadWithProgress(
  uploadUrl: string,
  file: File,
  onProgress?: UploadProgressHandler,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", uploadUrl)
    xhr.setRequestHeader("Content-Type", file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
        return
      }
      reject(new Error("Upload to storage failed"))
    }

    xhr.onerror = () => reject(new Error("Upload to storage failed"))
    xhr.send(file)
  })
}

export async function completeUpload<T>(
  path: string,
  uploadId: string,
): Promise<T> {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ uploadId }),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    throw new Error(await parseError(res))
  }

  return res.json() as Promise<T>
}

export async function directUpload<TComplete>(
  presignPath: string,
  completePath: string,
  file: File,
  onProgress?: UploadProgressHandler,
  presignExtra?: Record<string, string | string[] | undefined>,
): Promise<TComplete> {
  const presign = await presignUpload(presignPath, file, presignExtra)
  await uploadWithProgress(presign.uploadUrl, file, onProgress)
  return completeUpload<TComplete>(completePath, presign.uploadId)
}
