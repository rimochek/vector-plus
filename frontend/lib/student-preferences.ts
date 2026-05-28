import { LEARNING_TOPIC_IDS, type LearningTopicId } from "@/app/components/tutors-data"
import { budgetCentsToTengeRange } from "@/lib/currency"
import type { StoredUser } from "@/lib/auth-client"

const TAGS_SUFFIX = /\[tags:([^\]]+)\]/

export function parseTagsFromLearningGoals(
  goals: string | null | undefined,
): string[] {
  if (!goals) return []
  const match = goals.match(TAGS_SUFFIX)
  if (!match) return []
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function toLearningTopicIds(tags: string[]): LearningTopicId[] {
  const allowed = new Set<string>(LEARNING_TOPIC_IDS)
  return tags.filter((id): id is LearningTopicId => allowed.has(id))
}

export type StudentTutorFilterPrefs = {
  priceMin: number
  priceMax: number
  topics: LearningTopicId[]
  searchHint: string
}

export function getStudentTutorFilterPrefs(
  user: StoredUser | null,
  defaults: StudentTutorFilterPrefs,
): StudentTutorFilterPrefs {
  const profile = user?.studentProfile
  if (!profile) return defaults

  let priceMin = defaults.priceMin
  let priceMax = defaults.priceMax

  if (
    profile.budgetMinCents != null &&
    profile.budgetMaxCents != null
  ) {
    const range = budgetCentsToTengeRange(
      profile.budgetMinCents,
      profile.budgetMaxCents,
      profile.budgetCurrency,
    )
    priceMin = range.min
    priceMax = range.max
  }

  const tags = toLearningTopicIds(
    profile.tags?.length
      ? profile.tags
      : parseTagsFromLearningGoals(profile.learningGoals),
  )

  const goalsText = profile.learningGoals
    ?.replace(TAGS_SUFFIX, "")
    .trim()

  return {
    priceMin,
    priceMax,
    topics: tags.length > 0 ? tags : defaults.topics,
    searchHint: goalsText ?? defaults.searchHint,
  }
}
