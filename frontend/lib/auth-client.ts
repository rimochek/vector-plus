import { getApiUrl } from "./api"

export type UserProfileSlice = {
  id?: string
  displayName?: string | null
  budgetMinCents?: number | null
  budgetMaxCents?: number | null
  budgetCurrency?: string | null
  learningGoals?: string | null
  tags?: string[]
}

export type StoredUser = {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  role?: string
  roles?: string[]
  displayName?: string | null
  studentProfile?: UserProfileSlice | null
  tutorProfile?: UserProfileSlice | null
}

export const AUTH_FETCH_INIT: RequestInit = { credentials: "include" }

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false
  return Boolean(localStorage.getItem("token"))
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem("user")
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function saveAuthSession(accessToken: string, user: StoredUser): void {
  if (typeof window === "undefined") return
  localStorage.setItem("token", accessToken)
  localStorage.setItem("user", JSON.stringify(user))
  handlingSessionExpiry = false
  notifyAuthChange()
}

export function getUserDisplayName(user: StoredUser | null): string {
  if (!user) return ""

  if (user.displayName?.trim()) {
    return user.displayName.trim()
  }

  const profileName =
    user.studentProfile?.displayName?.trim() ||
    user.tutorProfile?.displayName?.trim()
  if (profileName) return profileName

  const fromParts = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
  if (fromParts) return fromParts

  return ""
}

export function getUserInitials(user: StoredUser | null): string {
  const name = getUserDisplayName(user)
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    }
    return parts[0].charAt(0).toUpperCase()
  }
  return user?.email?.trim().charAt(0).toUpperCase() ?? "?"
}

export function getUserRoleLabel(user: StoredUser | null): string {
  if (!user) return ""
  if (user.role) return user.role
  return user.roles?.[0] ?? ""
}

export const DEFAULT_AUTH_ROUTE = "/tutors"

export function getDefaultRouteForUser(user: StoredUser | null): string {
  const role = user?.role ?? user?.roles?.[0]
  return role === "tutor" ? "/tutor-dashboard" : DEFAULT_AUTH_ROUTE
}

export function dashboardTabHref(
  tab: string,
  user: StoredUser | null,
): string {
  const role = user?.role ?? user?.roles?.[0]
  const base = role === "tutor" ? "/tutor-dashboard" : "/dashboard"
  return `${base}?tab=${tab}`
}

export function notifyAuthChange(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event("vector-auth-change"))
}

let handlingSessionExpiry = false
let refreshPromise: Promise<boolean> | null = null

export async function tryRefreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${getApiUrl()}/auth/refresh`, {
        method: "POST",
        ...AUTH_FETCH_INIT,
      })
      if (!res.ok) return false

      const data = (await res.json()) as { access_token?: string }
      if (!data.access_token) return false

      localStorage.setItem("token", data.access_token)
      handlingSessionExpiry = false
      notifyAuthChange()
      return true
    } catch {
      return false
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

/** Clears stored credentials and sends the user to login when refresh fails. */
export function handleSessionExpired(): void {
  if (typeof window === "undefined" || handlingSessionExpiry) return
  const hadSession =
    Boolean(localStorage.getItem("token")) ||
    Boolean(localStorage.getItem("user"))
  if (!hadSession) return

  handlingSessionExpiry = true
  clearLocalSession()

  const path = window.location.pathname
  if (path !== "/login" && path !== "/register") {
    window.location.replace("/login?session=expired")
  } else {
    handlingSessionExpiry = false
  }
}

function clearLocalSession(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("token")
  localStorage.removeItem("user")
  notifyAuthChange()
}

export async function logout(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: "POST",
      ...AUTH_FETCH_INIT,
    })
  } catch {
    /* still clear local session */
  }

  clearLocalSession()
  handlingSessionExpiry = false
}

export async function refreshCurrentUser(): Promise<StoredUser | null> {
  if (typeof window === "undefined") return null

  let token = localStorage.getItem("token")
  if (!token) {
    const refreshed = await tryRefreshAccessToken()
    if (!refreshed) return getStoredUser()
    token = localStorage.getItem("token")
  }

  if (!token) return getStoredUser()

  try {
    let res = await fetch(`${getApiUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      ...AUTH_FETCH_INIT,
    })

    if (res.status === 401) {
      const refreshed = await tryRefreshAccessToken()
      if (!refreshed) {
        handleSessionExpired()
        return null
      }
      token = localStorage.getItem("token")
      if (!token) {
        handleSessionExpired()
        return null
      }
      res = await fetch(`${getApiUrl()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        ...AUTH_FETCH_INIT,
      })
    }

    if (res.ok) {
      const data = await res.json()
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
        notifyAuthChange()
        return data.user as StoredUser
      }
    }

    if (res.status === 401) {
      handleSessionExpired()
      return null
    }
  } catch {
    /* use cached profile */
  }

  return getStoredUser()
}
