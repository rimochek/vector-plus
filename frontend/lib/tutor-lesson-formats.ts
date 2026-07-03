export type TutorLessonFormat = "online" | "offline"

export type LessonFormatChoice = TutorLessonFormat | "both"

export function lessonFormatsFromChoice(
  choice: LessonFormatChoice,
): TutorLessonFormat[] {
  if (choice === "both") return ["online", "offline"]
  return [choice]
}

export function choiceFromLessonFormats(
  formats: TutorLessonFormat[] | undefined,
): LessonFormatChoice | null {
  if (!formats || formats.length === 0) return null
  const hasOnline = formats.includes("online")
  const hasOffline = formats.includes("offline")
  if (hasOnline && hasOffline) return "both"
  if (hasOnline) return "online"
  if (hasOffline) return "offline"
  return null
}

export function normalizeLessonFormats(
  formats: TutorLessonFormat[] | undefined,
): TutorLessonFormat[] {
  if (!formats?.length) return ["online"]
  const normalized = formats.filter(
    (format): format is TutorLessonFormat =>
      format === "online" || format === "offline",
  )
  return normalized.length > 0 ? [...new Set(normalized)] : ["online"]
}

export type TeachingFormatFilter = "online" | "inPerson" | "hybrid"

export function tutorMatchesTeachingFormatFilters(
  tutorFormats: TutorLessonFormat[] | undefined,
  selectedFilters: TeachingFormatFilter[],
): boolean {
  if (selectedFilters.length === 0) return true
  const normalized = normalizeLessonFormats(tutorFormats)
  const hasOnline = normalized.includes("online")
  const hasOffline = normalized.includes("offline")
  const offersBoth = hasOnline && hasOffline

  return selectedFilters.some((filter) => {
    if (filter === "hybrid") return offersBoth
    if (filter === "online") return hasOnline
    if (filter === "inPerson") return hasOffline
    return false
  })
}
