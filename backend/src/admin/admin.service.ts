import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  TutorApplicationStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { StorageService } from '../storage/storage.service';
import {
  normalizeLessonFormats,
  parseTeachingFormatQuery,
  tutorMatchesTeachingFormatFilters,
} from '../common/utils/tutor-lesson-formats.util';
import { serializeVerificationDocument } from '../storage/verification-document.constants';
import { NotificationsService } from '../notifications/notifications.service';

type ApplicationFilter = 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ALL';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
  ) {}

  private parseMetadata(searchDocument: string | null) {
    if (!searchDocument) {
      return {
        tags: [] as string[],
        lessonFormats: normalizeLessonFormats([]),
      };
    }
    try {
      const parsed = JSON.parse(searchDocument) as {
        tags?: unknown;
        lessonFormats?: unknown;
      };
      return {
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((tag): tag is string => typeof tag === 'string')
          : [],
        lessonFormats: normalizeLessonFormats(parsed.lessonFormats),
      };
    } catch {
      return {
        tags: [] as string[],
        lessonFormats: normalizeLessonFormats([]),
      };
    }
  }

  async listTutorApplications(status: ApplicationFilter = 'SUBMITTED') {
    const where =
      status === 'ALL'
        ? {}
        : { applicationStatus: status as TutorApplicationStatus };

    const tutors = await this.prisma.tutorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true } },
        subjects: { include: { subject: true } },
        verificationDocuments: { orderBy: { uploadedAt: 'desc' } },
      },
      orderBy: [{ applicationSubmittedAt: 'desc' }, { updatedAt: 'desc' }],
    });

    return tutors.map((tutor) => this.serializeAdminTutorSummary(tutor));
  }

  async getTutorApplication(tutorProfileId: string) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: {
        user: { select: { id: true, email: true, timezone: true } },
        subjects: { include: { subject: true } },
        verificationDocuments: { orderBy: { uploadedAt: 'desc' } },
        availabilityRules: true,
      },
    });

    if (!tutor) throw new NotFoundException('Tutor not found');
    return this.serializeAdminTutorDetail(tutor);
  }

  async approveTutor(admin: AuthUser, tutorProfileId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const tutor = await tx.tutorProfile.findUnique({
        where: { id: tutorProfileId },
      });
      if (!tutor) throw new NotFoundException('Tutor not found');

      if (
        tutor.applicationStatus !== TutorApplicationStatus.SUBMITTED &&
        tutor.applicationStatus !== TutorApplicationStatus.UNDER_REVIEW &&
        tutor.applicationStatus !== TutorApplicationStatus.REJECTED &&
        tutor.applicationStatus !== TutorApplicationStatus.APPROVED
      ) {
        throw new BadRequestException(
          'Only submitted, approved, or rejected applications can be verified',
        );
      }

      const updated = await tx.tutorProfile.update({
        where: { id: tutorProfileId },
        data: {
          applicationStatus: TutorApplicationStatus.APPROVED,
          isAcceptingStudents: true,
          applicationRejectionReason: null,
          applicationReviewedAt: new Date(),
          applicationReviewedByUserId: admin.id,
          // Admin approval grants the verified badge (listing is already open on register).
          verificationStatus: VerificationStatus.VERIFIED,
        },
        include: {
          user: { select: { id: true, email: true, timezone: true } },
          subjects: { include: { subject: true } },
          verificationDocuments: { orderBy: { uploadedAt: 'desc' } },
        },
      });

      return {
        updated,
        shouldNotify: tutor.verificationStatus !== VerificationStatus.VERIFIED,
      };
    });

    if (result.shouldNotify) {
      await this.notifications.notifyTutorVerified({
        tutorUserId: result.updated.user.id,
      });
    }
    return this.serializeAdminTutorDetail(result.updated);
  }

  async rejectTutor(admin: AuthUser, tutorProfileId: string, reason: string) {
    const trimmed = reason.trim();
    if (!trimmed) {
      throw new BadRequestException('Rejection reason is required');
    }

    return this.prisma.$transaction(async (tx) => {
      const tutor = await tx.tutorProfile.findUnique({
        where: { id: tutorProfileId },
      });
      if (!tutor) throw new NotFoundException('Tutor not found');

      const updated = await tx.tutorProfile.update({
        where: { id: tutorProfileId },
        data: {
          applicationStatus: TutorApplicationStatus.REJECTED,
          isAcceptingStudents: false,
          applicationRejectionReason: trimmed,
          applicationReviewedAt: new Date(),
          applicationReviewedByUserId: admin.id,
        },
        include: {
          user: { select: { id: true, email: true, timezone: true } },
          subjects: { include: { subject: true } },
          verificationDocuments: { orderBy: { uploadedAt: 'desc' } },
        },
      });

      return this.serializeAdminTutorDetail(updated);
    });
  }

  async reviewVerificationDocument(
    admin: AuthUser,
    documentId: string,
    status: VerificationStatus,
    rejectionReason?: string,
  ) {
    if (
      status !== VerificationStatus.VERIFIED &&
      status !== VerificationStatus.REJECTED
    ) {
      throw new BadRequestException('Invalid review status');
    }

    if (status === VerificationStatus.REJECTED && !rejectionReason?.trim()) {
      throw new BadRequestException(
        'Rejection reason is required when rejecting a document',
      );
    }

    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Document not found');

    const updated = await this.prisma.verificationDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason:
          status === VerificationStatus.REJECTED
            ? (rejectionReason?.trim() ?? null)
            : null,
        reviewedAt: new Date(),
        reviewerUserId: admin.id,
      },
    });

    return serializeVerificationDocument(updated);
  }

  async getVerificationDocumentDownload(documentId: string) {
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new NotFoundException('Document not found');

    const downloadUrl = await this.storage.createPresignedGetUrl({
      bucket: this.storage.getPrivateBucket(),
      objectKey: document.objectKey,
      downloadFileName: document.displayFileName,
    });

    return {
      downloadUrl,
      fileName: document.displayFileName,
      mimeType: document.mimeType,
    };
  }

  filterMarketplaceTutors<T extends { searchDocument: string | null }>(
    tutors: T[],
    formatsQuery?: string | string[],
  ) {
    const selectedFormats = parseTeachingFormatQuery(formatsQuery);
    if (selectedFormats.length === 0) return tutors;

    return tutors.filter((tutor) => {
      const metadata = this.parseMetadata(tutor.searchDocument);
      return tutorMatchesTeachingFormatFilters(
        metadata.lessonFormats,
        selectedFormats,
      );
    });
  }

  private serializeAdminTutorSummary(tutor: {
    id: string;
    displayName: string;
    headline: string | null;
    avatarUrl: string | null;
    defaultHourlyRateCents: number;
    applicationStatus: TutorApplicationStatus;
    verificationStatus: VerificationStatus;
    applicationSubmittedAt: Date | null;
    applicationReviewedAt: Date | null;
    applicationRejectionReason: string | null;
    searchDocument: string | null;
    user: { email: string };
    subjects: { subject: { name: string } }[];
    verificationDocuments: { status: VerificationStatus }[];
  }) {
    const metadata = this.parseMetadata(tutor.searchDocument);
    return {
      id: tutor.id,
      displayName: tutor.displayName,
      email: tutor.user.email,
      avatarUrl: tutor.avatarUrl,
      headline: tutor.headline,
      subjects: tutor.subjects.map((entry) => entry.subject.name),
      lessonFormats: metadata.lessonFormats,
      defaultHourlyRateCents: tutor.defaultHourlyRateCents,
      applicationStatus: tutor.applicationStatus,
      verificationStatus: tutor.verificationStatus,
      submittedAt: tutor.applicationSubmittedAt?.toISOString() ?? null,
      reviewedAt: tutor.applicationReviewedAt?.toISOString() ?? null,
      rejectionReason: tutor.applicationRejectionReason,
      documentSummary: {
        total: tutor.verificationDocuments.length,
        pending: tutor.verificationDocuments.filter(
          (doc) => doc.status === VerificationStatus.PENDING,
        ).length,
        verified: tutor.verificationDocuments.filter(
          (doc) => doc.status === VerificationStatus.VERIFIED,
        ).length,
        rejected: tutor.verificationDocuments.filter(
          (doc) => doc.status === VerificationStatus.REJECTED,
        ).length,
      },
    };
  }

  private serializeAdminTutorDetail(tutor: {
    id: string;
    userId: string;
    displayName: string;
    headline: string | null;
    bio: string;
    avatarUrl: string | null;
    defaultHourlyRateCents: number;
    experienceYears: number | null;
    education: string | null;
    country: string | null;
    city: string | null;
    applicationStatus: TutorApplicationStatus;
    verificationStatus: VerificationStatus;
    isAcceptingStudents: boolean;
    applicationSubmittedAt: Date | null;
    applicationReviewedAt: Date | null;
    applicationReviewedByUserId: string | null;
    applicationRejectionReason: string | null;
    searchDocument: string | null;
    lessonsCompleted: number;
    ratingAvg: number;
    ratingCount: number;
    user: { id: string; email: string; timezone?: string };
    subjects: { subject: { id: string; name: string; slug: string } }[];
    verificationDocuments: Array<{
      id: string;
      objectKey: string;
      originalFileName: string;
      displayFileName: string;
      mimeType: string;
      sizeBytes: number;
      documentType: string;
      metadata: unknown;
      status: VerificationStatus;
      uploadedAt: Date;
      reviewedAt: Date | null;
      reviewerUserId: string | null;
      rejectionReason: string | null;
    }>;
    availabilityRules?: Array<{
      id: string;
      dayOfWeek: number | null;
      startTime: string | null;
      endTime: string | null;
      ruleType: string;
    }>;
  }) {
    const metadata = this.parseMetadata(tutor.searchDocument);
    return {
      ...this.serializeAdminTutorSummary(tutor),
      userId: tutor.userId,
      bio: tutor.bio,
      experienceYears: tutor.experienceYears,
      education: tutor.education,
      country: tutor.country,
      city: tutor.city,
      timezone: tutor.user.timezone ?? 'UTC',
      isAcceptingStudents: tutor.isAcceptingStudents,
      tags: metadata.tags,
      lessonFormats: metadata.lessonFormats,
      lessonsCompleted: tutor.lessonsCompleted,
      rating: tutor.ratingAvg,
      reviews: tutor.ratingCount,
      reviewedByUserId: tutor.applicationReviewedByUserId,
      verificationDocuments: tutor.verificationDocuments.map((doc) =>
        serializeVerificationDocument(doc),
      ),
      availabilityRules: (tutor.availabilityRules ?? []).map((rule) => ({
        id: rule.id,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        ruleType: rule.ruleType,
      })),
    };
  }
}
