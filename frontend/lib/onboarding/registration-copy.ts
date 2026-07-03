export const STUDENT_PROGRESS_STAGES = [
  "Your account",
  "Your subject",
  "Your goal",
  "Your preferences",
  "Find tutors",
] as const

export const TUTOR_PROGRESS_STAGES = [
  "Your account",
  "About you",
  "Your teaching",
  "Your profile",
  "Review",
] as const

export const STUDENT_GOALS = [
  "Improve my grades",
  "Prepare for an exam",
  "Reach a target score",
  "Understand difficult topics",
  "Practice speaking",
  "Start from the beginning",
] as const

export const BUDGET_PRESETS = [
  { id: "up_to_4k", label: "Up to ₸4,000", min: 1000, max: 4000 },
  { id: "4k_7k", label: "₸4,000–₸7,000", min: 4000, max: 7000 },
  { id: "7k_10k", label: "₸7,000–₸10,000", min: 7000, max: 10000 },
  { id: "10k_plus", label: "₸10,000+", min: 10000, max: 15000 },
  { id: "unsure", label: "I'm not sure yet", min: null, max: null },
] as const

export const EXPERIENCE_OPTIONS = [
  { id: "new", label: "Just getting started", years: 0 },
  { id: "under_1", label: "Less than 1 year", years: 0 },
  { id: "1_3", label: "1–3 years", years: 2 },
  { id: "3_5", label: "3–5 years", years: 4 },
  { id: "5_plus", label: "5+ years", years: 6 },
] as const

export const AVAILABILITY_BROAD = [
  { id: "weekday_morning", label: "Weekday mornings" },
  { id: "weekday_afternoon", label: "Weekday afternoons" },
  { id: "weekday_evening", label: "Weekday evenings" },
  { id: "weekends", label: "Weekends" },
] as const

export const EXAM_TOPIC_IDS = new Set([
  "ielts",
  "sat_act",
  "nuet",
  "unt",
  "nis",
  "nspm",
  "bil",
  "ap",
  "ib",
])
