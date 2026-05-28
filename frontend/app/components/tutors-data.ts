export const LEARNING_TOPIC_IDS = [
  "sat_act",
  "ielts",
  "nuet",
  "unt",
  "school_prep",
  "math",
  "english",
  "ap_ib",
  "programming",
] as const

export type LearningTopicId = (typeof LEARNING_TOPIC_IDS)[number]

export const TIME_SLOT_IDS = [
  "morning",
  "afternoon",
  "evening",
  "weekend",
] as const

export type TimeSlotId = (typeof TIME_SLOT_IDS)[number]

export type TutorSortOption =
  | "recommendation"
  | "price_asc"
  | "price_desc"
  | "popularity"
  | "reviews"
  | "rating"

export const TUTORS_PRICE_PRESET = {
  min: 1000,
  max: 15000,
  step: 500,
  defaultMin: 3500,
  defaultMax: 15000,
} as const

export type Tutor = {
  id: number
  name: string
  subject: string
  expertise: string[]
  topics: LearningTopicId[]
  timeSlots: TimeSlotId[]
  rating: number
  reviews: number
  popularity: number
  recommendationScore: number
  priceKzt: number
  image: string
  bio: string
  availability: string
  verified: boolean
}

export function getTutorPrice(tutor: Tutor): number {
  return tutor.priceKzt
}

export const TUTORS_DATA: Tutor[] = [
  {
    id: 1,
    name: "Dr. Sarah Jenkins",
    subject: "Mathematics",
    expertise: ["Calculus", "Linear Algebra", "Statistics"],
    topics: ["math", "sat_act", "ap_ib", "school_prep"],
    timeSlots: ["afternoon", "evening"],
    rating: 4.9,
    reviews: 124,
    popularity: 94,
    recommendationScore: 97,
    priceKzt: 20250,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    bio: "PhD in Mathematics with 10+ years of teaching experience. I simplify complex concepts.",
    availability: "Today, 4:00 PM",
    verified: true,
  },
  {
    id: 2,
    name: "James Wilson",
    subject: "Computer Science",
    expertise: ["React", "Python", "Data Structures"],
    topics: ["programming", "ap_ib", "math"],
    timeSlots: ["morning", "afternoon"],
    rating: 4.8,
    reviews: 89,
    popularity: 88,
    recommendationScore: 91,
    priceKzt: 2000,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    bio: "Senior Software Engineer. I help students build real-world projects while learning theory.",
    availability: "Tomorrow, 10:00 AM",
    verified: true,
  },
  {
    id: 3,
    name: "Elena Rodriguez",
    subject: "Languages",
    expertise: ["Spanish", "French", "ESL"],
    topics: ["english", "ielts", "sat_act"],
    timeSlots: ["morning", "weekend"],
    rating: 5.0,
    reviews: 210,
    popularity: 96,
    recommendationScore: 95,
    priceKzt: 15000,
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    bio: "Native speaker and certified linguist. My lessons are interactive and culture-focused.",
    availability: "Monday, 2:00 PM",
    verified: true,
  },
  {
    id: 4,
    name: "Michael Chen",
    subject: "Physics",
    expertise: ["Quantum Mechanics", "Thermodynamics"],
    topics: ["ap_ib", "math", "school_prep"],
    timeSlots: ["evening", "weekend"],
    rating: 4.7,
    reviews: 45,
    popularity: 72,
    recommendationScore: 84,
    priceKzt: 3000,
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    bio: "Passionate educator focusing on visual learning and practical experiments.",
    availability: "Wednesday, 5:00 PM",
    verified: false,
  },
  {
    id: 5,
    name: "Amina Kassymova",
    subject: "Mathematics",
    expertise: ["NUET Prep", "UNT Math", "Algebra"],
    topics: ["nuet", "unt", "math", "school_prep"],
    timeSlots: ["afternoon", "weekend"],
    rating: 4.9,
    reviews: 156,
    popularity: 90,
    recommendationScore: 93,
    priceKzt: 10100,
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    bio: "Specialized in Kazakh national exams with a structured weekly study plan.",
    availability: "Today, 6:30 PM",
    verified: true,
  },
  {
    id: 6,
    name: "David Park",
    subject: "Computer Science",
    expertise: ["Algorithms", "Java", "Interview Prep"],
    topics: ["programming", "ap_ib", "sat_act"],
    timeSlots: ["evening"],
    rating: 4.6,
    reviews: 62,
    popularity: 78,
    recommendationScore: 80,
    priceKzt: 5600,
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
    bio: "Former FAANG engineer focused on fundamentals and coding interview readiness.",
    availability: "Friday, 7:00 PM",
    verified: true,
  },
]
