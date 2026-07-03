const ROLE_KEY = "tutora-signup-role"

export type SignupRole = "student" | "tutor"

export function saveSignupRole(role: SignupRole): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(ROLE_KEY, role)
}

export function getSignupRole(): SignupRole | null {
  if (typeof window === "undefined") return null
  const value = sessionStorage.getItem(ROLE_KEY)
  return value === "student" || value === "tutor" ? value : null
}

const STUDENT_DRAFT_KEY = "tutora-student-onboarding"

export type StudentOnboardingDraft = {
  topicId?: string
  lookingFor?: string
  lessonFormat?: "online" | "offline" | "either" | "unsure"
  budgetPresetId?: string
  city?: string
}

export function saveStudentDraft(draft: StudentOnboardingDraft): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(STUDENT_DRAFT_KEY, JSON.stringify(draft))
}

export function loadStudentDraft(): StudentOnboardingDraft | null {
  if (typeof window === "undefined") return null
  const raw = sessionStorage.getItem(STUDENT_DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StudentOnboardingDraft
  } catch {
    return null
  }
}

export function clearStudentDraft(): void {
  if (typeof window === "undefined") return
  sessionStorage.removeItem(STUDENT_DRAFT_KEY)
}

const TUTOR_STEP_KEY = "tutora-tutor-onboarding-step"

export function saveTutorStep(step: string): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(TUTOR_STEP_KEY, step)
}

export function loadTutorStep(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(TUTOR_STEP_KEY)
}
