import { getApiUrl } from "./api"
import { handleSessionExpired, tryRefreshAccessToken, AUTH_FETCH_INIT } from "./auth-client"

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

function shouldAttemptTokenRefresh(path: string): boolean {
  return !path.startsWith("/auth/login") &&
    !path.startsWith("/auth/signup") &&
    !path.startsWith("/auth/refresh") &&
    !path.startsWith("/auth/logout")
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${getApiUrl()}${path}`, {
    ...AUTH_FETCH_INIT,
    ...options,
    headers,
  })

  if (
    res.status === 401 &&
    !retried &&
    shouldAttemptTokenRefresh(path)
  ) {
    const refreshed = await tryRefreshAccessToken()
    if (refreshed) {
      return apiFetch<T>(path, options, true)
    }
    if (token || localStorage.getItem("user")) {
      handleSessionExpired()
    }
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.message ?? body.error ?? message
      if (Array.isArray(message)) message = message.join(", ")
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export type ApiTutor = {
  id: string
  userId: string
  displayName: string
  headline: string | null
  bio: string
  avatarUrl: string | null
  subject: string
  defaultHourlyRateCents: number
  defaultCurrency: string
  rating: number
  reviews: number
  lessonsCompleted: number
  experienceYears: number | null
  education: string | null
  country: string | null
  city: string | null
  verified: boolean
  timezone: string
}

export type AvailabilitySlot = {
  id: string
  startsAt: string
  endsAt: string
  durationMinutes: number
}

export type Booking = {
  id: string
  status: "upcoming" | "completed" | "cancelled" | "pending"
  dbStatus: string
  scheduledStartAt: string
  scheduledEndAt: string
  durationMinutes: number
  priceCents: number
  currency: string
  studentMessage: string | null
  meetingUrl: string | null
  subject: string
  cancellationReason?: CancelBookingReason | null
  cancellationReasonOther?: string | null
  cancellationReasonLabel?: string | null
  cancelledAt?: string | null
  cancelledByUserId?: string | null
  studentPreferences?: {
    message: string | null
    learningGoals: string | null
    topics: string[]
  }
  counterpartyName: string
  counterpartyId: string
  counterpartyUserId: string
  studentName: string
  tutorName: string
}

export type CancelBookingReason =
  | "family"
  | "cant_at_time"
  | "found_another"
  | "schedule_conflict"
  | "other"

export type CancelBookingPayload = {
  reason: CancelBookingReason
  otherText?: string
}

export type ChatLesson = {
  id: string
  kind: "lesson"
  status: "upcoming" | "completed" | "cancelled" | "pending"
  dbStatus: string
  scheduledStartAt: string
  scheduledEndAt: string
  durationMinutes: number
  subject: string
  studentMessage: string | null
  studentPreferences: {
    message: string | null
    learningGoals: string | null
    topics: string[]
  }
  cancellationReason?: CancelBookingReason | null
  cancellationReasonLabel?: string | null
  cancelledAt?: string | null
  cancelledByUserId?: string | null
  createdAt: string
  tutorName: string
  studentName: string
  counterpartyName: string
}

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string | null
  data: unknown
  read: boolean
  createdAt: string
}

export type FavoriteEntry = {
  id: string
  tutorProfileId: string
  createdAt: string
  tutor: {
    id: string
    displayName: string
    bio: string
    avatarUrl: string | null
    subject: string
    defaultHourlyRateCents: number
    defaultCurrency: string
    ratingAvg: number
    ratingCount: number
    country: string | null
    city: string | null
  }
}

export type ConversationSummary = {
  id: string
  counterpartyName: string
  counterpartyId: string | undefined
  counterpartyUserId: string | undefined
  lastMessage: {
    content: string
    senderId: string
    createdAt: string
  } | null
  unread: boolean
  updatedAt: string
}

export type ChatMessage = {
  id: string
  senderId: string
  content: string
  createdAt: string
}

export type WeeklyDaySchedule = {
  dayOfWeek: number
  slots: { startTime: string; endTime: string }[]
}

export type WeeklyScheduleResponse = {
  timezone: string
  schedule: WeeklyDaySchedule[]
}

export const api = {
  tutors: {
    list: () => apiFetch<ApiTutor[]>("/tutors"),
    get: (id: string) => apiFetch<ApiTutor>(`/tutors/${id}`),
    slots: (tutorProfileId: string) =>
      apiFetch<AvailabilitySlot[]>(
        `/availability/tutors/${tutorProfileId}/slots`,
      ),
  },
  bookings: {
    create: (availabilitySlotId: string, studentMessage?: string) =>
      apiFetch<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify({ availabilitySlotId, studentMessage }),
      }),
    tutorList: () => apiFetch<Booking[]>("/bookings/tutor"),
    studentList: () => apiFetch<Booking[]>("/bookings/student"),
    get: (id: string) => apiFetch<Booking>(`/bookings/${id}`),
    cancel: (id: string, payload: CancelBookingPayload) =>
      apiFetch<Booking>(`/bookings/${id}/cancel`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    approve: (id: string) =>
      apiFetch<Booking>(`/bookings/${id}/approve`, { method: "PATCH" }),
    reject: (id: string) =>
      apiFetch<Booking>(`/bookings/${id}/reject`, { method: "PATCH" }),
  },
  notifications: {
    list: () => apiFetch<AppNotification[]>("/notifications"),
    unreadCount: () =>
      apiFetch<{ count: number }>("/notifications/unread-count"),
    markRead: (id: string) =>
      apiFetch<{ success: boolean }>(`/notifications/${id}/read`, {
        method: "PATCH",
      }),
    markAllRead: () =>
      apiFetch<{ success: boolean }>("/notifications/read-all", {
        method: "PATCH",
      }),
  },
  favorites: {
    list: () => apiFetch<FavoriteEntry[]>("/favorites"),
    check: (tutorProfileId: string) =>
      apiFetch<{ favorited: boolean }>(`/favorites/check/${tutorProfileId}`),
    add: (tutorProfileId: string) =>
      apiFetch<FavoriteEntry>(`/favorites/${tutorProfileId}`, {
        method: "POST",
      }),
    remove: (tutorProfileId: string) =>
      apiFetch<{ success: boolean }>(`/favorites/${tutorProfileId}`, {
        method: "DELETE",
      }),
  },
  chat: {
    conversations: () => apiFetch<ConversationSummary[]>("/chat/conversations"),
    messages: (conversationId: string, since?: string) => {
      const query = since ? `?since=${encodeURIComponent(since)}` : ""
      return apiFetch<ChatMessage[]>(
        `/chat/conversations/${conversationId}/messages${query}`,
      )
    },
    send: (conversationId: string, content: string) =>
      apiFetch<ChatMessage>(`/chat/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    lessons: (conversationId: string) =>
      apiFetch<ChatLesson[]>(`/chat/conversations/${conversationId}/lessons`),
  },
  availability: {
    getWeeklySchedule: () =>
      apiFetch<WeeklyScheduleResponse>("/availability/weekly-schedule"),
    saveWeeklySchedule: (payload: {
      timezone: string
      schedule: WeeklyDaySchedule[]
      weeksAhead?: number
    }) =>
      apiFetch<WeeklyScheduleResponse>("/availability/weekly-schedule", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
}
