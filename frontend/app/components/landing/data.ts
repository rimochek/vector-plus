import type { LucideIcon } from "lucide-react"
import {
  BookOpen,
  Calculator,
  Code2,
  Globe,
  GraduationCap,
  Languages,
  Sparkles,
} from "lucide-react"

export type SampleTutor = {
  id: string
  displayName: string
  subject: string
  headline: string
  experienceYears: number
  rating: number
  reviews: number
  priceKzt: number
  verified: boolean
  initials: string
  accent: string
}

export const LANDING_NAV = [
  { href: "/tutors", label: "Find tutors" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#for-tutors", label: "For tutors" },
  { href: "#subjects", label: "Subjects" },
] as const

export const TRUST_POINTS = [
  "Verified tutor profiles",
  "Flexible lesson formats",
  "Transparent pricing",
] as const

export const METRICS = [
  { value: "50+", label: "Active tutors", numeric: false },
  { value: "20+", label: "Subjects & exams", numeric: false },
  { value: "Flexible", label: "Online & offline lessons", numeric: false },
  { value: "One place", label: "To manage your learning", numeric: false },
] as const

export type CategoryItem = {
  id: string
  name: string
  description: string
  href: string
  icon: LucideIcon
  tint: string
}

export const CATEGORIES: CategoryItem[] = [
  {
    id: "math",
    name: "Mathematics",
    description: "From algebra to calculus and exam prep.",
    href: "/tutors?q=Mathematics",
    icon: Calculator,
    tint: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
  },
  {
    id: "english",
    name: "English",
    description: "Conversation, grammar, and academic writing.",
    href: "/tutors?q=English",
    icon: Languages,
    tint: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
  {
    id: "ielts",
    name: "IELTS",
    description: "Structured prep for every band score goal.",
    href: "/tutors?q=IELTS",
    icon: Globe,
    tint: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  {
    id: "sat",
    name: "SAT",
    description: "Focused practice for SAT Math and Reading.",
    href: "/tutors?q=SAT",
    icon: GraduationCap,
    tint: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  {
    id: "programming",
    name: "Programming",
    description: "Python, web dev, and computer science basics.",
    href: "/tutors?q=Programming",
    icon: Code2,
    tint: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  {
    id: "school",
    name: "School subjects",
    description: "Physics, chemistry, history, and more.",
    href: "/tutors",
    icon: BookOpen,
    tint: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
  },
]

export const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Tell us your goal",
    description:
      "Select your subject, current level, budget, and preferred lesson format.",
    preview: "Pick IELTS · Evening · Online · ₸5,000–10,000/hr",
  },
  {
    step: "02",
    title: "Choose the right tutor",
    description:
      "Compare experience, pricing, availability, reviews, and teaching style.",
    preview: "Compare 12 tutors · Filter by rating & price",
  },
  {
    step: "03",
    title: "Start learning",
    description:
      "Book lessons and manage your progress from your Tutora dashboard.",
    preview: "Upcoming lesson · Tue 6:00 PM · Confirmed",
  },
] as const

export const PRODUCT_SCROLL_STORY = [
  {
    id: "find",
    label: "Find",
    title: "Find the right tutor",
    description:
      "Find tutors based on your subject, goal, budget, and preferred lesson format.",
  },
  {
    id: "compare",
    label: "Compare",
    title: "Compare with confidence",
    description:
      "Compare tutors by experience, pricing, availability, reviews, and teaching style.",
  },
  {
    id: "book",
    label: "Book",
    title: "Book without friction",
    description:
      "Choose a convenient time and organize your lessons without leaving Tutora.",
  },
  {
    id: "learn",
    label: "Learn",
    title: "Learn in one place",
    description:
      "Keep upcoming lessons, tutors, favorites, and learning activity in one dashboard.",
  },
] as const

export type ProductScrollStepId = (typeof PRODUCT_SCROLL_STORY)[number]["id"]

export const PRODUCT_FEATURES = [
  {
    id: "find",
    title: "Find the right tutor",
    description: "Search and filter by subject, exam, price, and availability.",
  },
  {
    id: "book",
    title: "Book lessons",
    description: "Choose a time slot that fits your schedule and confirm in seconds.",
  },
  {
    id: "message",
    title: "Message your tutor",
    description: "Ask questions and coordinate details before each lesson.",
  },
  {
    id: "track",
    title: "Track upcoming lessons",
    description: "See what's next on your dashboard with clear lesson status.",
  },
  {
    id: "favorites",
    title: "Manage favorites",
    description: "Save tutors you like and compare them side by side.",
  },
  {
    id: "dashboard",
    title: "View your learning dashboard",
    description: "Lessons, chats, and notifications — all in one place.",
  },
] as const

export const BENEFITS = [
  {
    title: "Tutor profiles with useful details",
    description: "See experience, subjects, rates, and availability before you reach out.",
    icon: Sparkles,
  },
  {
    title: "Search built around your goal",
    description: "Filter by exam, subject, price range, and lesson format.",
    icon: GraduationCap,
  },
  {
    title: "Transparent pricing",
    description: "Hourly rates shown upfront — no guessing what a lesson costs.",
    icon: Calculator,
  },
  {
    title: "Online and offline options",
    description: "Find tutors who teach online, in person, or both.",
    icon: Globe,
  },
  {
    title: "Favorites and easy comparison",
    description: "Shortlist tutors and return when you're ready to book.",
    icon: BookOpen,
  },
  {
    title: "One dashboard for lessons",
    description: "Bookings, messages, and notifications stay organized in Tutora.",
    icon: Languages,
  },
] as const

/** Sample testimonials — replace with real reviews when available. */
export const TESTIMONIALS = [
  {
    id: "1",
    name: "Dana M.",
    goal: "IELTS Band 7",
    subject: "IELTS",
    quote:
      "I compared three tutors by price and reviews, booked within a day, and finally had a clear study plan.",
    initials: "DM",
  },
  {
    id: "2",
    name: "Arman T.",
    goal: "SAT Math",
    subject: "Mathematics",
    quote:
      "The tutor profile showed exactly what I needed — experience with SAT and evening availability.",
    initials: "AT",
  },
  {
    id: "3",
    name: "Sofia L.",
    goal: "English conversation",
    subject: "English",
    quote:
      "Saving favorites helped me narrow down tutors without losing track of who I liked.",
    initials: "SL",
  },
  {
    id: "4",
    name: "Timur K.",
    goal: "NUET prep",
    subject: "School subjects",
    quote:
      "Everything from search to booking happened in one place. Much easier than messaging random tutors.",
    initials: "TK",
  },
  {
    id: "5",
    name: "Maria P.",
    goal: "Python basics",
    subject: "Programming",
    quote:
      "I could see hourly rates and lesson format before signing up — no awkward surprises.",
    initials: "MP",
  },
] as const

export const FAQ_ITEMS = [
  {
    id: "choose",
    question: "How do I choose the right tutor?",
    answer:
      "Start with your goal — subject, exam, or skill level. Use filters for price, availability, and lesson format, then compare profiles, reviews, and experience before booking or messaging.",
  },
  {
    id: "format",
    question: "Can I study online and offline?",
    answer:
      "Yes. Many tutors offer online lessons, in-person sessions, or both. You can filter by teaching format on the Find tutors page.",
  },
  {
    id: "verification",
    question: "How does tutor verification work?",
    answer:
      "Tutors complete a detailed profile with education, experience, and subjects. Verified badges highlight tutors whose profiles meet Tutora's review standards.",
  },
  {
    id: "favorites",
    question: "Can I save tutors and compare them later?",
    answer:
      "Yes. Save tutors to favorites when you're signed in, then return anytime to compare options before booking.",
  },
  {
    id: "tutor-profile",
    question: "How do tutors create their profiles?",
    answer:
      "Tutors register on Tutora, add their subjects, rates, bio, and availability, then manage lessons and students from the tutor dashboard.",
  },
  {
    id: "payments",
    question: "Does Tutora process lesson payments?",
    answer:
      "No. Payment is arranged directly between the student and tutor. Tutora helps you discover tutors, request lessons, and coordinate scheduling.",
  },
] as const

export const SAMPLE_TUTORS: SampleTutor[] = [
  {
    id: "sample-1",
    displayName: "Amina Kasymova",
    subject: "IELTS",
    headline: "Band 8.5 · writing & speaking specialist",
    experienceYears: 6,
    rating: 4.9,
    reviews: 84,
    priceKzt: 8500,
    verified: true,
    initials: "AK",
    accent: "from-violet-500 to-purple-600",
  },
  {
    id: "sample-2",
    displayName: "James Wilson",
    subject: "Mathematics",
    headline: "Calculus, algebra & exam strategies",
    experienceYears: 8,
    rating: 4.8,
    reviews: 62,
    priceKzt: 7000,
    verified: true,
    initials: "JW",
    accent: "from-indigo-500 to-blue-600",
  },
  {
    id: "sample-3",
    displayName: "Elena Rodriguez",
    subject: "SAT Math",
    headline: "Structured SAT prep with weekly milestones",
    experienceYears: 5,
    rating: 4.9,
    reviews: 51,
    priceKzt: 9500,
    verified: true,
    initials: "ER",
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    id: "sample-4",
    displayName: "David Park",
    subject: "English",
    headline: "Conversation, grammar & academic writing",
    experienceYears: 4,
    rating: 4.7,
    reviews: 39,
    priceKzt: 6000,
    verified: false,
    initials: "DP",
    accent: "from-sky-500 to-cyan-600",
  },
  {
    id: "sample-5",
    displayName: "Maria Chen",
    subject: "Programming",
    headline: "Python, algorithms & project-based learning",
    experienceYears: 7,
    rating: 4.8,
    reviews: 47,
    priceKzt: 8000,
    verified: true,
    initials: "MC",
    accent: "from-emerald-500 to-teal-600",
  },
  {
    id: "sample-6",
    displayName: "Nurbol S.",
    subject: "NUET",
    headline: "National exam prep with clear weekly plans",
    experienceYears: 5,
    rating: 4.9,
    reviews: 73,
    priceKzt: 7500,
    verified: true,
    initials: "NS",
    accent: "from-amber-500 to-orange-600",
  },
]

export const HERO_SUBJECT_BADGES = ["IELTS", "SAT", "Mathematics", "English"] as const

export const FOOTER_LINKS = {
  product: [
    { href: "/tutors", label: "Find tutors" },
    { href: "#subjects", label: "Subjects" },
    { href: "#how-it-works", label: "How it works" },
    { href: "/favorites", label: "Favorites" },
  ],
  tutors: [
    { href: "/signup/tutor", label: "Become a tutor" },
    { href: "/tutor-dashboard", label: "Tutor dashboard" },
    { href: "/signup/tutor", label: "Tutor resources" },
  ],
  company: [
    { href: "#", label: "About" },
    { href: "#", label: "Contact" },
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
  ],
} as const
