export function normalizeTimeString(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return value
  return `${match[1].padStart(2, "0")}:${match[2]}`
}

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

/** Prefer stored timezone unless it is the generic UTC default. */
export function resolveAvailabilityTimeZone(stored?: string): string {
  const browser = getBrowserTimeZone()
  if (!stored || stored === "UTC") return browser
  return stored
}
