import type { MessageId } from "@/lib/i18n/messages"

export function greetingMessageId(prefix: "dash" | "tutorDash"): MessageId {
  const hour = new Date().getHours()
  if (hour < 12) return `${prefix}.greetingMorning` as MessageId
  if (hour < 18) return `${prefix}.greetingAfternoon` as MessageId
  return `${prefix}.greetingEvening` as MessageId
}

export function firstName(displayName: string): string {
  return displayName.trim().split(/\s+/)[0] ?? displayName
}
