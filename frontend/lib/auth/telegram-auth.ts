import { getApiUrl } from "@/lib/api"
import { AUTH_FETCH_INIT, saveAuthSession, type StoredUser } from "@/lib/auth-client"

export type TelegramAuthResponse = {
  access_token: string
  user: StoredUser
  existingAccount?: boolean
}

export async function authenticateWithTelegram(
  initData: string,
  intendedRole?: "STUDENT" | "TUTOR",
): Promise<TelegramAuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/telegram`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, intendedRole }),
    ...AUTH_FETCH_INIT,
  })
  const body = (await response.json().catch(() => ({}))) as TelegramAuthResponse & { message?: string }
  if (!response.ok) throw new Error(body.message || "Telegram sign-in failed")
  saveAuthSession(body.access_token, body.user)
  return body
}
