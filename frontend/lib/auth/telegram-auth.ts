import { getApiUrl } from "@/lib/api"
import { AUTH_FETCH_INIT, saveAuthSession, type StoredUser } from "@/lib/auth-client"

export type TelegramAuthResponse = {
  access_token: string
  user: StoredUser
  existingAccount?: boolean
}

export type TelegramWidgetUser = {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
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

export async function authenticateWithTelegramWidget(
  user: TelegramWidgetUser,
  intendedRole?: "STUDENT" | "TUTOR",
): Promise<TelegramAuthResponse> {
  const response = await fetch(`${getApiUrl()}/auth/telegram/widget`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...user, intendedRole }),
    ...AUTH_FETCH_INIT,
  })
  const body = (await response.json().catch(() => ({}))) as TelegramAuthResponse & { message?: string }
  if (!response.ok) throw new Error(body.message || "Telegram sign-in failed")
  saveAuthSession(body.access_token, body.user)
  return body
}
