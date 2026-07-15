import { EXAM_IDS, LANGUAGE_IDS, type ExamId, type LanguageId } from "@/app/components/tutors-data"

const SCORE_EXAM_IDS = new Set<ExamId>(["ielts", "sat_act", "nuet", "unt"])
const SKIP_GOAL_EXAM_IDS = new Set<ExamId>(["nis", "nspm", "bil"])
const SUBJECT_TOPIC_IDS = new Set(["math", "programming"])

export type StudentGoalOption = {
  id: string
  label: string
  asksForScore?: boolean
}

export function resolveStudentTopicId(topicId?: string, customTopic?: string): string {
  const custom = customTopic?.trim()
  if (custom) return custom
  return topicId?.trim() ?? ""
}

export function shouldSkipGoalStep(topicId?: string, customTopic?: string): boolean {
  const id = resolveStudentTopicId(topicId, customTopic)
  return SKIP_GOAL_EXAM_IDS.has(id as ExamId)
}

export function needsTargetScore(topicId?: string, customTopic?: string): boolean {
  const id = resolveStudentTopicId(topicId, customTopic)
  return SCORE_EXAM_IDS.has(id as ExamId)
}

export function getStudentGoalOptions(
  topicId?: string,
  customTopic?: string,
): StudentGoalOption[] {
  const id = resolveStudentTopicId(topicId, customTopic)

  if (SCORE_EXAM_IDS.has(id as ExamId)) {
    return [
      { id: "target_score", label: "Reach a target score", asksForScore: true },
      { id: "prepare_exam", label: "Prepare for the exam" },
      { id: "understand_topics", label: "Understand difficult topics" },
    ]
  }

  if (LANGUAGE_IDS.includes(id as LanguageId)) {
    return [
      { id: "higher_level", label: "Reach a higher level" },
      { id: "practice_speaking", label: "Practice speaking" },
      { id: "start_beginning", label: "Start from the beginning" },
    ]
  }

  if (SUBJECT_TOPIC_IDS.has(id) || id === "custom") {
    return [
      { id: "improve_grades", label: "Improve my grades" },
      { id: "understand_topics", label: "Understand difficult topics" },
      { id: "prepare_exam", label: "Prepare for an exam" },
    ]
  }

  if (EXAM_IDS.includes(id as ExamId)) {
    return [
      { id: "prepare_exam", label: "Prepare for the exam" },
      { id: "understand_topics", label: "Understand difficult topics" },
      { id: "improve_grades", label: "Improve my grades" },
    ]
  }

  return [
    { id: "improve_grades", label: "Improve my grades" },
    { id: "understand_topics", label: "Understand difficult topics" },
    { id: "prepare_exam", label: "Prepare for an exam" },
    { id: "practice_speaking", label: "Practice speaking" },
    { id: "start_beginning", label: "Start from the beginning" },
  ]
}

export function formatStudentLookingFor(
  goalId: string,
  goalLabel: string,
  targetScore?: string,
): string {
  if (goalId === "target_score" && targetScore?.trim()) {
    return `${goalLabel}: ${targetScore.trim()}`
  }
  return goalLabel
}
