import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import {
  AvailabilityRuleType,
  LessonStatus,
  TutorApplicationStatus,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { UpdateTutorProfileDto } from './dto/update-tutor-profile.dto';
import {
  normalizeLessonFormats,
  parseTeachingFormatQuery,
  tutorMatchesTeachingFormatFilters,
} from '../common/utils/tutor-lesson-formats.util';
import {
  normalizePhoneNumber,
  normalizeTelegramUsername,
} from '../common/utils/contact.util';
import { serializeVerificationDocument } from '../storage/verification-document.constants';

type UploadedFilePayload = {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
};

@Injectable()
export class TutorsService {
  constructor(private prisma: PrismaService) {}

  async listTutors(excludeUserId?: string, formatsQuery?: string | string[]) {
    let excludeTutorProfileId: string | undefined;
    if (excludeUserId) {
      const profile = await this.prisma.tutorProfile.findUnique({
        where: { userId: excludeUserId },
        select: { id: true },
      });
      excludeTutorProfileId = profile?.id;
    }

    const tutors = await this.prisma.tutorProfile.findMany({
      where: {
        OR: [
          {
            applicationStatus: TutorApplicationStatus.APPROVED,
            isAcceptingStudents: true,
          },
        ],
        ...(excludeTutorProfileId
          ? { id: { not: excludeTutorProfileId } }
          : {}),
      },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true }, take: 3 },
      },
      orderBy: [{ ratingAvg: 'desc' }, { lessonsCompleted: 'desc' }],
      take: 100,
    });

    const selectedFormats = parseTeachingFormatQuery(formatsQuery);
    const filtered =
      selectedFormats.length === 0
        ? tutors
        : tutors.filter((tutor) => {
            const metadata = this.parseProfileMetadata(tutor.searchDocument);
            return tutorMatchesTeachingFormatFilters(
              normalizeLessonFormats(metadata.lessonFormats),
              selectedFormats,
            );
          });

    return filtered.map((tutor) => this.serializeTutor(tutor));
  }

  async getTutor(
    tutorProfileId: string,
    viewContext?: {
      viewerUserId?: string;
      ip?: string;
      userAgent?: string | string[];
    },
  ) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
        verificationDocuments: {
          where: { status: 'VERIFIED' },
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    const isMarketplaceVisible =
      tutor.applicationStatus === TutorApplicationStatus.APPROVED &&
      tutor.isAcceptingStudents;
    const isSelf = viewContext?.viewerUserId === tutor.userId;
    if (!isMarketplaceVisible && !isSelf) {
      throw new NotFoundException('Tutor not found');
    }

    await this.recordProfileView(tutorProfileId, tutor.userId, viewContext);

    return this.serializeTutor(tutor, isSelf ? 'owner' : 'public');
  }

  async getOwnProfile(user: AuthUser) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
        verificationDocuments: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    return this.serializeTutor(tutor, 'owner');
  }

  async updateOwnProfile(user: AuthUser, dto: UpdateTutorProfileDto) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    const metadata = this.parseProfileMetadata(tutor.searchDocument);
    const nextTags = dto.tags ?? metadata.tags;
    const nextCredentials = dto.credentials ?? metadata.credentials;
    const nextVerificationDocuments =
      dto.verificationDocuments ?? metadata.verificationDocuments;
    const nextLanguages = dto.languages ?? metadata.languages;
    const nextOccupation = dto.occupation ?? metadata.occupation;
    const nextLessonFormats = dto.lessonFormats ?? metadata.lessonFormats;
    const searchDocument = this.buildSearchDocument({
      tags: nextTags,
      credentials: nextCredentials,
      verificationDocuments: nextVerificationDocuments,
      languages: nextLanguages,
      occupation: nextOccupation,
      lessonFormats: nextLessonFormats,
    });

    const updated = await this.prisma.tutorProfile.update({
      where: { id: tutor.id },
      data: {
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName.trim() }
          : {}),
        ...(dto.headline !== undefined
          ? { headline: dto.headline.trim() || null }
          : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio.trim() } : {}),
        ...(dto.defaultHourlyRateCents !== undefined
          ? { defaultHourlyRateCents: dto.defaultHourlyRateCents }
          : {}),
        ...(dto.experienceYears !== undefined
          ? { experienceYears: dto.experienceYears }
          : {}),
        ...(dto.education !== undefined
          ? { education: dto.education.trim() }
          : {}),
        ...(dto.country !== undefined
          ? { country: dto.country.trim() || null }
          : {}),
        ...(dto.city !== undefined ? { city: dto.city.trim() || null } : {}),
        ...(dto.avatarUrl !== undefined
          ? { avatarUrl: dto.avatarUrl.trim() || null }
          : {}),
        ...(dto.tags !== undefined ||
        dto.credentials !== undefined ||
        dto.verificationDocuments !== undefined ||
        dto.languages !== undefined ||
        dto.occupation !== undefined ||
        dto.lessonFormats !== undefined
          ? { searchDocument }
          : {}),
        ...(dto.preferredContactMethod !== undefined
          ? { preferredContactMethod: dto.preferredContactMethod }
          : {}),
        ...(dto.phone !== undefined
          ? {
              phone: dto.phone.trim() ? normalizePhoneNumber(dto.phone) : null,
            }
          : {}),
        ...(dto.telegramUsername !== undefined
          ? {
              telegramUsername: dto.telegramUsername.trim()
                ? normalizeTelegramUsername(dto.telegramUsername)
                : null,
            }
          : {}),
        ...(dto.showTelegramPublicly !== undefined
          ? { showTelegramPublicly: dto.showTelegramPublicly }
          : {}),
        ...(dto.showPhonePublicly !== undefined
          ? { showPhonePublicly: dto.showPhonePublicly }
          : {}),
        ...(dto.acceptsDirectRequests !== undefined
          ? { acceptsDirectRequests: dto.acceptsDirectRequests }
          : {}),
      },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
      },
    });

    return this.serializeTutor(updated, 'owner');
  }

  async uploadAvatar(_user: AuthUser, _file: UploadedFilePayload) {
    throw new BadRequestException(
      'Direct avatar upload is deprecated. Use POST /uploads/avatar/presign and /uploads/avatar/complete.',
    );
  }

  async uploadVerificationDocument(
    _user: AuthUser,
    _file: UploadedFilePayload,
    _documentType: string,
  ) {
    throw new BadRequestException(
      'Direct verification upload is deprecated. Use POST /uploads/verification/presign and /uploads/verification/complete.',
    );
  }

  async submitApplication(user: AuthUser) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    const metadata = this.parseProfileMetadata(tutor.searchDocument);
    const errors: string[] = [];

    if (!tutor.avatarUrl?.trim()) errors.push('Profile photo is required');
    if (!tutor.headline?.trim()) errors.push('Profile headline is required');
    if (!tutor.bio?.trim() || tutor.bio.trim().length < 50) {
      errors.push('Profile description must be at least 50 characters');
    }
    if (!tutor.education?.trim() || tutor.education === 'Pending') {
      errors.push('Education information is required');
    }
    if (!tutor.country?.trim() || !tutor.city?.trim()) {
      errors.push('Location is required');
    }
    if (!metadata.tags?.length)
      errors.push('At least one teaching subject is required');
    if (tutor.defaultHourlyRateCents < 1000) {
      errors.push('Hourly rate is required');
    }

    if (errors.length) {
      throw new BadRequestException(errors.join('. '));
    }

    if (
      tutor.applicationStatus === TutorApplicationStatus.SUBMITTED ||
      tutor.applicationStatus === TutorApplicationStatus.UNDER_REVIEW ||
      tutor.applicationStatus === TutorApplicationStatus.APPROVED
    ) {
      throw new BadRequestException('Your application is already submitted');
    }

    const isResubmit =
      tutor.applicationStatus === TutorApplicationStatus.REJECTED;

    const updated = await this.prisma.tutorProfile.update({
      where: { id: tutor.id },
      data: {
        // List in the marketplace immediately after registration.
        // Verified badge is granted separately by admin review.
        applicationStatus: TutorApplicationStatus.APPROVED,
        verificationStatus: VerificationStatus.UNVERIFIED,
        bio: tutor.bio.trim(),
        isAcceptingStudents: true,
        applicationSubmittedAt: new Date(),
        applicationRejectionReason: isResubmit ? null : undefined,
        applicationReviewedAt: isResubmit ? null : undefined,
        applicationReviewedByUserId: isResubmit ? null : undefined,
      },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
        verificationDocuments: { orderBy: { uploadedAt: 'desc' } },
      },
    });

    return this.serializeTutor(updated, 'owner');
  }

  async getDashboardOverview(user: AuthUser) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { timezone: true } },
        subjects: { include: { subject: true } },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    const [lessons, profileViews, profileViewsThisWeek, rules, conversations] =
      await Promise.all([
        this.prisma.lesson.findMany({
          where: { tutorProfileId: tutor.id },
          include: {
            studentProfile: {
              select: { id: true, displayName: true, avatarUrl: true },
            },
            subject: { select: { name: true } },
          },
          orderBy: { scheduledStartAt: 'asc' },
        }),
        this.prisma.tutorProfileView.count({
          where: { tutorProfileId: tutor.id },
        }),
        this.prisma.tutorProfileView.count({
          where: { tutorProfileId: tutor.id, createdAt: { gte: weekStart } },
        }),
        this.prisma.tutorAvailabilityRule.findMany({
          where: {
            tutorProfileId: tutor.id,
            isActive: true,
            ruleType: AvailabilityRuleType.RECURRING_WEEKLY,
          },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        }),
        this.prisma.conversation.findMany({
          where: {
            tutorProfileId: tutor.id,
            participants: { some: { userId: user.id } },
          },
          include: {
            studentProfile: {
              select: {
                id: true,
                displayName: true,
                avatarUrl: true,
                userId: true,
              },
            },
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            participants: {
              where: { userId: user.id },
              select: { lastReadAt: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
        }),
      ]);

    const activeLessonStatuses: LessonStatus[] = [
      LessonStatus.SCHEDULED,
      LessonStatus.IN_PROGRESS,
      LessonStatus.PENDING_PAYMENT,
    ];
    const countedStudentStatuses: LessonStatus[] = [
      LessonStatus.SCHEDULED,
      LessonStatus.IN_PROGRESS,
      LessonStatus.COMPLETED,
    ];
    const pending = lessons.filter(
      (lesson) => lesson.status === LessonStatus.PENDING_APPROVAL,
    );
    const upcoming = lessons.filter(
      (lesson) =>
        activeLessonStatuses.includes(lesson.status) &&
        lesson.scheduledStartAt >= now,
    );
    const completed = lessons.filter(
      (lesson) => lesson.status === LessonStatus.COMPLETED,
    );
    const totalStudents = new Set(
      lessons
        .filter((lesson) => countedStudentStatuses.includes(lesson.status))
        .map((lesson) => lesson.studentProfileId),
    ).size;
    const hoursTaught = Math.round(
      completed.reduce((sum, lesson) => sum + lesson.durationMinutes, 0) / 60,
    );

    return {
      tutorProfileId: tutor.id,
      displayName: tutor.displayName,
      avatarUrl: tutor.avatarUrl,
      stats: {
        upcomingLessons: upcoming.length,
        pendingRequests: pending.length,
        totalStudents,
        profileViews,
        profileViewsThisWeek,
        profileCompletion: this.calculateProfileCompletion(
          tutor,
          rules.length > 0,
        ),
        hoursTaught,
        avgRating: tutor.ratingCount > 0 ? tutor.ratingAvg : null,
      },
      availability: {
        timezone: rules[0]?.timezone ?? tutor.user.timezone ?? 'UTC',
        days: this.serializeAvailabilityOverview(rules),
      },
      pendingRequests: pending.map((lesson) =>
        this.serializeDashboardLesson(lesson),
      ),
      upcomingLessons: upcoming.map((lesson) =>
        this.serializeDashboardLesson(lesson),
      ),
      recentConversations: conversations.map((conversation) => {
        const lastMessage = conversation.messages[0];
        const lastReadAt = conversation.participants[0]?.lastReadAt;
        const unread =
          lastMessage &&
          lastMessage.senderId !== user.id &&
          (!lastReadAt || lastMessage.createdAt > lastReadAt);

        return {
          id: conversation.id,
          counterpartyName:
            conversation.studentProfile?.displayName ?? 'Unknown',
          counterpartyAvatarUrl: conversation.studentProfile?.avatarUrl ?? null,
          lastMessage: lastMessage?.body ?? null,
          unread: Boolean(unread),
          updatedAt: conversation.updatedAt.toISOString(),
        };
      }),
    };
  }

  private async recordProfileView(
    tutorProfileId: string,
    tutorUserId: string,
    viewContext?: {
      viewerUserId?: string;
      ip?: string;
      userAgent?: string | string[];
    },
  ) {
    if (viewContext?.viewerUserId === tutorUserId) return;

    const ipHash = viewContext?.ip ? this.hashValue(viewContext.ip) : null;
    const userAgent =
      typeof viewContext?.userAgent === 'string'
        ? viewContext.userAgent
        : viewContext?.userAgent?.join(' ');
    const userAgentHash = userAgent ? this.hashValue(userAgent) : null;
    const since = new Date();
    since.setHours(0, 0, 0, 0);

    const existing = await this.prisma.tutorProfileView.findFirst({
      where: {
        tutorProfileId,
        createdAt: { gte: since },
        OR: [
          ...(viewContext?.viewerUserId
            ? [{ viewerUserId: viewContext.viewerUserId }]
            : []),
          ...(ipHash ? [{ ipHash }] : []),
        ],
      },
      select: { id: true },
    });

    if (existing) return;

    await this.prisma.tutorProfileView.create({
      data: {
        tutorProfileId,
        viewerUserId: viewContext?.viewerUserId,
        ipHash,
        userAgentHash,
      },
    });
  }

  private hashValue(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private parseProfileMetadata(searchDocument: string | null) {
    const empty = {
      tags: [] as string[],
      credentials: [] as { label: string; value: string }[],
      verificationDocuments: [] as {
        type: string;
        fileName: string;
        storageKey: string;
      }[],
      languages: [] as string[],
      occupation: null as string | null,
      lessonFormats: [] as ('online' | 'offline')[],
    };

    if (!searchDocument) {
      return empty;
    }

    try {
      const parsed = JSON.parse(searchDocument) as {
        tags?: unknown;
        credentials?: unknown;
        verificationDocuments?: unknown;
        languages?: unknown;
        occupation?: unknown;
        lessonFormats?: unknown;
      };
      const tags = Array.isArray(parsed.tags)
        ? parsed.tags.filter((tag): tag is string => typeof tag === 'string')
        : [];
      const credentials = Array.isArray(parsed.credentials)
        ? parsed.credentials.filter(
            (entry): entry is { label: string; value: string } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { label?: unknown }).label === 'string' &&
              typeof (entry as { value?: unknown }).value === 'string',
          )
        : [];
      const verificationDocuments = Array.isArray(parsed.verificationDocuments)
        ? parsed.verificationDocuments.filter(
            (
              entry,
            ): entry is {
              type: string;
              fileName: string;
              storageKey: string;
            } =>
              typeof entry === 'object' &&
              entry !== null &&
              typeof (entry as { type?: unknown }).type === 'string' &&
              typeof (entry as { fileName?: unknown }).fileName === 'string' &&
              typeof (entry as { storageKey?: unknown }).storageKey ===
                'string',
          )
        : [];
      const languages = Array.isArray(parsed.languages)
        ? parsed.languages.filter(
            (lang): lang is string => typeof lang === 'string',
          )
        : [];
      const occupation =
        typeof parsed.occupation === 'string' ? parsed.occupation : null;
      const lessonFormats = Array.isArray(parsed.lessonFormats)
        ? parsed.lessonFormats.filter(
            (format): format is 'online' | 'offline' =>
              format === 'online' || format === 'offline',
          )
        : [];
      return {
        tags,
        credentials,
        verificationDocuments,
        languages,
        occupation,
        lessonFormats: [...new Set(lessonFormats)],
      };
    } catch {
      return empty;
    }
  }

  private buildSearchDocument(metadata: {
    tags: string[];
    credentials?: { label: string; value: string }[];
    verificationDocuments?: {
      type: string;
      fileName: string;
      storageKey: string;
    }[];
    languages?: string[];
    occupation?: string | null;
    lessonFormats?: ('online' | 'offline')[];
  }) {
    const normalizedTags = [
      ...new Set(metadata.tags.map((tag) => tag.trim()).filter(Boolean)),
    ];
    const normalizedFormats = [
      ...new Set(
        (metadata.lessonFormats ?? []).filter(
          (format) => format === 'online' || format === 'offline',
        ),
      ),
    ];
    return JSON.stringify({
      tags: normalizedTags,
      credentials: metadata.credentials ?? [],
      verificationDocuments: metadata.verificationDocuments ?? [],
      languages: metadata.languages ?? [],
      occupation: metadata.occupation ?? null,
      lessonFormats: normalizedFormats,
    });
  }

  private calculateProfileCompletion(
    tutor: {
      displayName: string;
      headline: string | null;
      bio: string;
      avatarUrl: string | null;
      defaultHourlyRateCents: number;
      experienceYears: number | null;
      education: string | null;
      country: string | null;
      city: string | null;
      searchDocument: string | null;
      subjects: unknown[];
    },
    hasAvailability: boolean,
  ) {
    const metadata = this.parseProfileMetadata(tutor.searchDocument);
    const checks = [
      Boolean(tutor.displayName),
      Boolean(tutor.headline),
      Boolean(tutor.bio),
      Boolean(tutor.avatarUrl),
      tutor.defaultHourlyRateCents > 0,
      tutor.experienceYears != null,
      Boolean(tutor.education),
      Boolean(tutor.country || tutor.city),
      tutor.subjects.length > 0 || metadata.tags.length > 0,
      hasAvailability,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }

  private serializeAvailabilityOverview(
    rules: Array<{
      dayOfWeek: number | null;
      startTime: string | null;
      endTime: string | null;
    }>,
  ) {
    const days = [1, 2, 3, 4, 5, 6, 0];
    return days.map((dayOfWeek) => {
      const dayRules = rules.filter((rule) => rule.dayOfWeek === dayOfWeek);
      return {
        dayOfWeek,
        slotsCount: dayRules.length,
        hasAvailability: dayRules.length > 0,
      };
    });
  }

  private serializeDashboardLesson(lesson: {
    id: string;
    status: LessonStatus;
    scheduledStartAt: Date;
    scheduledEndAt: Date;
    durationMinutes: number;
    subject: { name: string } | null;
    studentProfile: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
  }) {
    return {
      id: lesson.id,
      status: this.mapLessonStatus(lesson.status, lesson.scheduledStartAt),
      scheduledStartAt: lesson.scheduledStartAt.toISOString(),
      scheduledEndAt: lesson.scheduledEndAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      subject: lesson.subject?.name ?? 'General',
      studentName: lesson.studentProfile.displayName,
      studentAvatarUrl: lesson.studentProfile.avatarUrl,
    };
  }

  private mapLessonStatus(
    status: LessonStatus,
    scheduledStartAt: Date,
  ): 'upcoming' | 'completed' | 'cancelled' | 'pending' {
    if (status === LessonStatus.CANCELLED) return 'cancelled';
    if (status === LessonStatus.COMPLETED) return 'completed';
    if (status === LessonStatus.PENDING_APPROVAL) return 'pending';
    return scheduledStartAt < new Date() ? 'completed' : 'upcoming';
  }

  private serializeTutor(
    tutor: {
      id: string;
      userId: string;
      displayName: string;
      headline: string | null;
      bio: string;
      avatarUrl: string | null;
      defaultHourlyRateCents: number;
      defaultCurrency: string;
      ratingAvg: number;
      ratingCount: number;
      lessonsCompleted: number;
      experienceYears: number | null;
      education: string | null;
      country: string | null;
      city: string | null;
      verificationStatus: string;
      searchDocument?: string | null;
      user: { id: string; timezone: string };
      subjects: Array<{
        subject: { id: string; name: string; slug: string };
        hourlyRateCents: number;
      }>;
    },
    visibility: 'public' | 'owner' = 'public',
  ) {
    const primarySubject = tutor.subjects[0]?.subject.name ?? 'General';
    const metadata = this.parseProfileMetadata(tutor.searchDocument ?? null);
    const tagLabels =
      metadata.tags.length > 0
        ? metadata.tags
        : tutor.subjects.map((entry) => entry.subject.slug);

    const dbVerificationDocuments =
      'verificationDocuments' in tutor &&
      Array.isArray(
        (
          tutor as {
            verificationDocuments?: Array<{
              id: string;
              documentType: string;
              displayFileName: string;
              objectKey: string;
              status: string;
              rejectionReason?: string | null;
              uploadedAt?: Date;
              sizeBytes?: number;
              mimeType?: string;
              metadata?: unknown;
            }>;
          }
        ).verificationDocuments,
      )
        ? (
            tutor as {
              verificationDocuments: Array<{
                id: string;
                documentType: string;
                displayFileName: string;
                objectKey: string;
                status: string;
                rejectionReason?: string | null;
                uploadedAt?: Date;
                sizeBytes?: number;
                mimeType?: string;
                metadata?: unknown;
              }>;
            }
          ).verificationDocuments.map((doc) =>
            doc.uploadedAt && doc.sizeBytes != null && doc.mimeType
              ? {
                  ...serializeVerificationDocument({
                    id: doc.id,
                    displayFileName: doc.displayFileName,
                    documentType: doc.documentType,
                    metadata: doc.metadata ?? {},
                    status: doc.status,
                    uploadedAt: doc.uploadedAt,
                    sizeBytes: doc.sizeBytes,
                    mimeType: doc.mimeType,
                  }),
                  rejectionReason: doc.rejectionReason ?? null,
                }
              : {
                  id: doc.id,
                  type: doc.documentType,
                  fileName: doc.displayFileName,
                  storageKey: doc.objectKey,
                  status: doc.status,
                  rejectionReason: doc.rejectionReason ?? null,
                },
          )
        : metadata.verificationDocuments;

    const contactFields = tutor as {
      acceptsDirectRequests?: boolean;
      preferredContactMethod?: string | null;
      showTelegramPublicly?: boolean;
      showPhonePublicly?: boolean;
      telegramUsername?: string | null;
      phone?: string | null;
    };

    return {
      id: tutor.id,
      userId: tutor.userId,
      displayName: tutor.displayName,
      headline: tutor.headline,
      bio: tutor.bio,
      avatarUrl: tutor.avatarUrl,
      subject: primarySubject,
      tags: tagLabels,
      credentials: metadata.credentials,
      verificationDocuments:
        visibility === 'owner' ? dbVerificationDocuments : undefined,
      languages: metadata.languages,
      occupation: metadata.occupation,
      lessonFormats: metadata.lessonFormats,
      applicationStatus:
        'applicationStatus' in tutor
          ? (tutor as { applicationStatus: string }).applicationStatus
          : undefined,
      applicationRejectionReason:
        'applicationRejectionReason' in tutor
          ? (tutor as { applicationRejectionReason: string | null })
              .applicationRejectionReason
          : undefined,
      applicationSubmittedAt:
        'applicationSubmittedAt' in tutor &&
        (tutor as { applicationSubmittedAt: Date | null })
          .applicationSubmittedAt
          ? (
              tutor as { applicationSubmittedAt: Date }
            ).applicationSubmittedAt.toISOString()
          : null,
      subjects: tutor.subjects.map((s) => ({
        id: s.subject.id,
        name: s.subject.name,
        slug: s.subject.slug,
        hourlyRateCents: s.hourlyRateCents,
      })),
      defaultHourlyRateCents: tutor.defaultHourlyRateCents,
      defaultCurrency: tutor.defaultCurrency,
      rating: tutor.ratingAvg,
      reviews: tutor.ratingCount,
      lessonsCompleted: tutor.lessonsCompleted,
      experienceYears: tutor.experienceYears,
      education: tutor.education,
      country: tutor.country,
      city: tutor.city,
      verified: tutor.verificationStatus === 'VERIFIED',
      timezone: tutor.user.timezone,
      acceptsDirectRequests: contactFields.acceptsDirectRequests ?? true,
      preferredContactMethod: contactFields.preferredContactMethod ?? null,
      publicTelegramUsername:
        contactFields.showTelegramPublicly && contactFields.telegramUsername
          ? contactFields.telegramUsername
          : undefined,
      publicPhone:
        contactFields.showPhonePublicly && contactFields.phone
          ? contactFields.phone
          : undefined,
      ...(visibility === 'owner'
        ? {
            fullBio: tutor.bio,
            phone: contactFields.phone ?? null,
            telegramUsername: contactFields.telegramUsername ?? null,
            showTelegramPublicly: contactFields.showTelegramPublicly ?? false,
            showPhonePublicly: contactFields.showPhonePublicly ?? false,
          }
        : {}),
    };
  }
}
