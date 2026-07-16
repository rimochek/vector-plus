import { getApiUrl } from "./api"
import { handleSessionExpired, tryRefreshAccessToken, AUTH_FETCH_INIT, getAccessToken } from "./auth-client"

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
  return getAccessToken()
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
  tags?: string[]
  subjects?: {
    id: string
    name: string
    slug: string
    hourlyRateCents: number
  }[]
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
  applicationStatus?: string
  applicationRejectionReason?: string | null
  applicationSubmittedAt?: string | null
  credentials?: { label: string; value: string }[]
  verificationDocuments?: Array<{
    id?: string
    type: string
    fileName: string
    storageKey: string
    status?: string
    rejectionReason?: string | null
  }>
  languages?: string[]
  occupation?: string | null
  lessonFormats?: ("online" | "offline")[]
  acceptsDirectRequests?: boolean
  preferredContactMethod?: "TELEGRAM" | "PHONE" | "BOTH" | null
  publicTelegramUsername?: string
  publicPhone?: string
  phone?: string | null
  telegramUsername?: string | null
  showTelegramPublicly?: boolean
  showPhonePublicly?: boolean
}

export type UpdateTutorProfilePayload = {
  displayName?: string
  headline?: string
  bio?: string
  defaultHourlyRateCents?: number
  experienceYears?: number
  education?: string
  country?: string
  city?: string
  avatarUrl?: string
  tags?: string[]
  credentials?: { label: string; value: string }[]
  verificationDocuments?: {
    type: string
    fileName: string
    storageKey: string
  }[]
  languages?: string[]
  occupation?: string
  lessonFormats?: ("online" | "offline")[]
  preferredContactMethod?: "TELEGRAM" | "PHONE" | "BOTH"
  phone?: string
  telegramUsername?: string
  showTelegramPublicly?: boolean
  showPhonePublicly?: boolean
  acceptsDirectRequests?: boolean
}

export type TutorLead = {
  id: string
  studentName: string
  contactType: "TELEGRAM" | "PHONE"
  contactValue: string
  subject: string | null
  goal: string | null
  message: string | null
  preferredTime: string | null
  status: "NEW" | "VIEWED" | "CONTACTED" | "CLOSED" | "SPAM"
  source: string
  createdAt: string
  viewedAt: string | null
  contactedAt: string | null
  closedAt: string | null
}

export type TutorLeadMetrics = {
  profileViews: number
  telegramClicks: number
  phoneClicks: number
  totalRequests: number
  newRequests: number
  profileViewsThisWeek: number
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

export type TutorDashboardLesson = {
  id: string
  status: "upcoming" | "completed" | "cancelled" | "pending"
  scheduledStartAt: string
  scheduledEndAt: string
  durationMinutes: number
  subject: string
  studentName: string
  studentAvatarUrl: string | null
}

export type TutorDashboardOverview = {
  tutorProfileId: string
  displayName: string
  avatarUrl: string | null
  stats: {
    upcomingLessons: number
    pendingRequests: number
    totalStudents: number
    profileViews: number
    profileViewsThisWeek: number
    profileCompletion: number
    hoursTaught: number
    avgRating: number | null
  }
  availability: {
    timezone: string
    days: {
      dayOfWeek: number
      slotsCount: number
      hasAvailability: boolean
    }[]
  }
  pendingRequests: TutorDashboardLesson[]
  upcomingLessons: TutorDashboardLesson[]
  recentConversations: {
    id: string
    counterpartyName: string
    counterpartyAvatarUrl: string | null
    lastMessage: string | null
    unread: boolean
    updatedAt: string
  }[]
}

export type AdminTutorSummary = {
  id: string
  displayName: string
  email: string
  avatarUrl: string | null
  headline: string | null
  subjects: string[]
  lessonFormats: ("online" | "offline")[]
  defaultHourlyRateCents: number
  applicationStatus: string
  verificationStatus: string
  submittedAt: string | null
  reviewedAt: string | null
  rejectionReason: string | null
  documentSummary: {
    total: number
    pending: number
    verified: number
    rejected: number
  }
}

export type AdminTutorDetail = AdminTutorSummary & {
  userId: string
  bio: string
  experienceYears: number | null
  education: string | null
  country: string | null
  city: string | null
  timezone: string
  isAcceptingStudents: boolean
  tags: string[]
  lessonsCompleted: number
  rating: number
  reviews: number
  reviewedByUserId: string | null
  verificationDocuments: Array<{
    id: string
    fileName: string
    documentType: string
    metadata: unknown
    status: string
    uploadedAt: string
    sizeBytes: number
    mimeType: string
    rejectionReason: string | null
  }>
  availabilityRules: Array<{
    id: string
    dayOfWeek: number
    startTime: string
    endTime: string
    ruleType: string
  }>
}

export const api = {
  auth: {
    deleteAccount: () =>
      apiFetch<{ success: boolean; message: string }>("/auth/me", {
        method: "DELETE",
      }),
    linkTelegram: (payload: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      photo_url?: string
      auth_date: number
      hash: string
    }) =>
      apiFetch<{ success: boolean; linked: boolean }>("/auth/telegram/link", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
  },
  tutors: {
    list: (formats?: string) =>
      apiFetch<ApiTutor[]>(
        formats ? `/tutors?formats=${encodeURIComponent(formats)}` : "/tutors",
      ),
    get: (id: string) => apiFetch<ApiTutor>(`/tutors/${id}`),
    ownProfile: () => apiFetch<ApiTutor>("/tutors/profile/me"),
    updateProfile: (payload: UpdateTutorProfilePayload) =>
      apiFetch<ApiTutor>("/tutors/profile/me", {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    submitApplication: () =>
      apiFetch<ApiTutor>("/tutors/profile/me/submit", { method: "POST" }),
    dashboardOverview: () =>
      apiFetch<TutorDashboardOverview>("/tutors/dashboard/overview"),
    slots: (tutorProfileId: string) =>
      apiFetch<AvailabilitySlot[]>(
        `/availability/tutors/${tutorProfileId}/slots`,
      ),
  },
  leads: {
    submit: (
      tutorId: string,
      payload: {
        studentName: string
        contactType: "TELEGRAM" | "PHONE"
        contactValue: string
        subject?: string
        goal?: string
        message?: string
        preferredTime?: string
        website?: string
      },
    ) =>
      apiFetch<{ success: boolean; message: string }>(
        `/public/tutors/${tutorId}/leads`,
        { method: "POST", body: JSON.stringify(payload) },
      ),
    trackTelegramClick: (tutorId: string) =>
      apiFetch<{ success: boolean }>(`/public/tutors/${tutorId}/contact/telegram`, {
        method: "POST",
      }),
    trackPhoneClick: (tutorId: string) =>
      apiFetch<{ success: boolean }>(`/public/tutors/${tutorId}/contact/phone`, {
        method: "POST",
      }),
    list: (params?: { status?: string; page?: number; limit?: number }) => {
      const query = new URLSearchParams()
      if (params?.status) query.set("status", params.status)
      if (params?.page) query.set("page", String(params.page))
      if (params?.limit) query.set("limit", String(params.limit))
      const suffix = query.toString() ? `?${query.toString()}` : ""
      return apiFetch<{ items: TutorLead[]; total: number; page: number; limit: number }>(
        `/tutors/me/leads${suffix}`,
      )
    },
    get: (leadId: string) => apiFetch<TutorLead>(`/tutors/me/leads/${leadId}`),
    updateStatus: (leadId: string, status: TutorLead["status"]) =>
      apiFetch<TutorLead>(`/tutors/me/leads/${leadId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    metrics: () => apiFetch<TutorLeadMetrics>("/tutors/me/leads/metrics"),
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
    reschedule: (id: string, availabilitySlotId: string, studentMessage?: string) =>
      apiFetch<Booking>(`/bookings/${id}/reschedule`, {
        method: "PATCH",
        body: JSON.stringify({ availabilitySlotId, studentMessage }),
      }),
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
    createConversation: (tutorProfileId: string) =>
      apiFetch<{ id: string }>("/chat/conversations", {
        method: "POST",
        body: JSON.stringify({ tutorProfileId }),
      }),
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
  admin: {
    listTutors: (status: "SUBMITTED" | "APPROVED" | "REJECTED" | "ALL" = "SUBMITTED") =>
      apiFetch<AdminTutorSummary[]>(`/admin/tutors?status=${status}`),
    getTutor: (id: string) => apiFetch<AdminTutorDetail>(`/admin/tutors/${id}`),
    approveTutor: (id: string) =>
      apiFetch<AdminTutorDetail>(`/admin/tutors/${id}/approve`, { method: "POST" }),
    rejectTutor: (id: string, reason: string) =>
      apiFetch<AdminTutorDetail>(`/admin/tutors/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    reviewDocument: (
      id: string,
      status: "VERIFIED" | "REJECTED",
      rejectionReason?: string,
    ) =>
      apiFetch(`/admin/verification-documents/${id}/review`, {
        method: "POST",
        body: JSON.stringify({ status, rejectionReason }),
      }),
    documentDownload: (id: string) =>
      apiFetch<{ downloadUrl: string; fileName: string; mimeType: string }>(
        `/admin/verification-documents/${id}/download`,
      ),
  },
}
