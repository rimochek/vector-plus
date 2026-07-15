import { getApiUrl } from "@/lib/api"
import {
  AUTH_FETCH_INIT,
  getAccessToken,
  saveAuthSession,
  type StoredUser,
} from "@/lib/auth-client"

export type GoogleAuthRequest = {
  credential: string
  intendedRole?: "STUDENT" | "TUTOR"
}

export type GoogleAuthResponse = {
  access_token: string
  user: StoredUser
  message?: string
  existingAccount?: boolean
}

export class GoogleAuthError extends Error {
  code?: string

  constructor(message: string, code?: string) {
    super(message)
    this.name = "GoogleAuthError"
    this.code = code
  }
}

export async function authenticateWithGoogle(
  payload: GoogleAuthRequest,
): Promise<GoogleAuthResponse> {
  const res = await fetch(`${getApiUrl()}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      message?: string | { message?: string; code?: string }
      code?: string
    }
    const nested =
      typeof err.message === "object" && err.message !== null
        ? err.message
        : null
    const message =
      (typeof err.message === "string" ? err.message : nested?.message) ||
      "We couldn't sign you in with Google. Please try again."
    const code = nested?.code ?? err.code
    throw new GoogleAuthError(message, code)
  }

  const data = (await res.json()) as GoogleAuthResponse
  if (data.access_token && data.user) {
    saveAuthSession(data.access_token, data.user)
  }
  return data
}

export async function linkGoogleAccount(credential: string): Promise<void> {
  const token = getAccessToken()
  const res = await fetch(`${getApiUrl()}/auth/google/link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ credential }),
    ...AUTH_FETCH_INIT,
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string }
    throw new GoogleAuthError(
      err.message || "Could not link your Google account.",
    )
  }
}
