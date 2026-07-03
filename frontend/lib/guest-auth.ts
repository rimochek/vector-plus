export function studentSignupPath(returnPath?: string): string {
  if (!returnPath || returnPath.startsWith("/signup") || returnPath.startsWith("/login")) {
    return "/signup/student"
  }
  return `/signup/student?returnTo=${encodeURIComponent(returnPath)}`
}

export function readReturnToParam(): string | null {
  if (typeof window === "undefined") return null
  const value = new URLSearchParams(window.location.search).get("returnTo")
  if (!value || !value.startsWith("/")) return null
  return value
}

export function isAdminUser(
  user: { role?: string; roles?: string[] } | null | undefined,
): boolean {
  if (!user) return false
  const roles = user.roles ?? (user.role ? [user.role] : [])
  return roles.some((role) => role.toLowerCase() === "admin")
}
