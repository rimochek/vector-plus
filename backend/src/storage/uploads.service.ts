import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  AvatarSource,
  StorageUploadKind,
  StorageUploadStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { STORAGE_CONSTANTS } from './storage.constants';
import { StorageService } from './storage.service';
import { PresignUploadDto } from './dto/upload.dto';
import {
  buildExamProofOptions,
  isVerificationDocumentCategory,
  normalizeLegacyDocumentType,
  parseTeachingTags,
  serializeVerificationDocument,
  validateVerificationUploadInput,
  VERIFICATION_DOCUMENT_CATEGORIES,
  type VerificationDocumentMetadata,
} from './verification-document.constants';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private ensureStorageReady(): void {
    if (!this.storage.isConfigured()) {
      throw new BadRequestException('File storage is not configured');
    }
  }

  async presignAvatar(user: AuthUser, dto: PresignUploadDto) {
    this.ensureStorageReady();
    this.storage.validateMime(
      dto.mimeType,
      STORAGE_CONSTANTS.avatar.allowedMimeTypes,
    );
    this.storage.validateSize(dto.size, STORAGE_CONSTANTS.avatar.maxSizeBytes);

    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    const scope = tutorProfile ? 'tutors' : 'users';
    const ownerId = tutorProfile?.id ?? studentProfile?.id ?? user.id;
    const ext = this.storage.extensionForMime(dto.mimeType);
    const objectKey = this.storage.generateAvatarObjectKey(scope, ownerId, ext);
    this.storage.assertObjectKeySafe(objectKey);

    const bucket = this.storage.getPublicBucket();
    const expiresAt = new Date(
      Date.now() + STORAGE_CONSTANTS.uploadUrlTtlSeconds * 1000,
    );

    const upload = await this.prisma.storageUpload.create({
      data: {
        userId: user.id,
        kind: StorageUploadKind.AVATAR,
        status: StorageUploadStatus.PENDING,
        objectKey,
        bucket,
        mimeType: dto.mimeType,
        maxSizeBytes: dto.size,
        originalFileName: dto.fileName,
        expiresAt,
        metadata: { scope, ownerId },
      },
    });

    const uploadUrl = await this.storage.createPresignedPutUrl({
      bucket,
      objectKey,
      mimeType: dto.mimeType,
    });

    return { uploadId: upload.id, uploadUrl, objectKey, expiresAt };
  }

  async completeAvatar(user: AuthUser, uploadId: string) {
    this.ensureStorageReady();
    const upload = await this.getPendingUpload(user.id, uploadId, StorageUploadKind.AVATAR);

    const head = await this.storage.headObject(upload.bucket, upload.objectKey);
    if (head.contentLength <= 0 || head.contentLength > upload.maxSizeBytes) {
      throw new BadRequestException('Uploaded avatar size is invalid');
    }

    const metadata = (upload.metadata ?? {}) as {
      scope?: 'users' | 'tutors';
      ownerId?: string;
    };
    const scope = metadata.scope ?? 'users';
    const processedKey = this.storage.generateAvatarObjectKey(
      scope,
      metadata.ownerId ?? user.id,
      'webp',
    );

    const processed = await this.storage.processAvatarObject({
      bucket: upload.bucket,
      sourceKey: upload.objectKey,
      targetKey: processedKey,
    });

    const publicUrl = this.storage.buildPublicUrl(processedKey);
    let previousKey: string | null = null;

    if (scope === 'tutors') {
      const tutor = await this.prisma.tutorProfile.findUnique({
        where: { userId: user.id },
      });
      if (!tutor) throw new NotFoundException('Tutor profile not found');
      previousKey = tutor.avatarObjectKey;

      await this.prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          avatarUrl: publicUrl,
          avatarObjectKey: processedKey,
          avatarSource: AvatarSource.UPLOAD,
          avatarMimeType: processed.mimeType,
          avatarSizeBytes: processed.sizeBytes,
        },
      });
    } else {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });
      if (student) {
        previousKey = student.avatarObjectKey;
        await this.prisma.studentProfile.update({
          where: { id: student.id },
          data: {
            avatarUrl: publicUrl,
            avatarObjectKey: processedKey,
            avatarSource: AvatarSource.UPLOAD,
            avatarMimeType: processed.mimeType,
            avatarSizeBytes: processed.sizeBytes,
          },
        });
      }
    }

    await this.prisma.storageUpload.update({
      where: { id: upload.id },
      data: {
        status: StorageUploadStatus.COMPLETED,
        completedAt: new Date(),
        objectKey: processedKey,
      },
    });

    if (previousKey && previousKey !== processedKey) {
      await this.storage.deleteObject(upload.bucket, previousKey);
    }

    return { avatarUrl: publicUrl, avatarObjectKey: processedKey };
  }

  async deleteAvatar(user: AuthUser) {
    this.ensureStorageReady();

    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });

    if (tutor) {
      if (tutor.avatarObjectKey) {
        await this.storage.deleteObject(
          this.storage.getPublicBucket(),
          tutor.avatarObjectKey,
        );
      }

      await this.prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          avatarUrl: null,
          avatarObjectKey: null,
          avatarSource: AvatarSource.DEFAULT,
          avatarMimeType: null,
          avatarSizeBytes: null,
        },
      });

      return { avatarUrl: null as string | null };
    }

    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });

    if (!student) {
      throw new NotFoundException('Profile not found');
    }

    if (student.avatarObjectKey) {
      await this.storage.deleteObject(
        this.storage.getPublicBucket(),
        student.avatarObjectKey,
      );
    }

    await this.prisma.studentProfile.update({
      where: { id: student.id },
      data: {
        avatarUrl: null,
        avatarObjectKey: null,
        avatarSource: AvatarSource.DEFAULT,
        avatarMimeType: null,
        avatarSizeBytes: null,
      },
    });

    return { avatarUrl: null as string | null };
  }

  async presignVerification(user: AuthUser, dto: PresignUploadDto) {
    this.ensureStorageReady();
    if (!user.roles.includes(UserRole.TUTOR)) {
      throw new ForbiddenException('Only tutors can upload verification documents');
    }

    this.storage.validateMime(
      dto.mimeType,
      STORAGE_CONSTANTS.verification.allowedMimeTypes,
    );
    this.storage.validateSize(
      dto.size,
      STORAGE_CONSTANTS.verification.maxSizeBytes,
    );

    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });
    if (!tutor) throw new NotFoundException('Tutor profile not found');

    const teachingTags = parseTeachingTags(tutor.searchDocument);
    const documentCategory = this.resolveDocumentCategory(dto);
    let verificationMetadata: VerificationDocumentMetadata;

    try {
      verificationMetadata = validateVerificationUploadInput({
        teachingTags,
        documentCategory,
        examType: dto.examType,
        relatedSubjectIds: dto.relatedSubjectIds,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid verification document',
      );
    }

    let replaceDocumentId: string | undefined;
    if (dto.replaceDocumentId) {
      const existing = await this.prisma.verificationDocument.findUnique({
        where: { id: dto.replaceDocumentId },
        include: { tutorProfile: { select: { userId: true } } },
      });
      if (!existing || existing.tutorProfile.userId !== user.id) {
        throw new ForbiddenException('You cannot replace this document');
      }
      replaceDocumentId = existing.id;
    }

    const documentId = replaceDocumentId ?? randomUUID();
    const ext = this.storage.extensionForMime(dto.mimeType);
    const objectKey = this.storage.generateVerificationObjectKey(
      tutor.id,
      documentId,
      ext,
    );
    this.storage.assertObjectKeySafe(objectKey);

    const bucket = this.storage.getPrivateBucket();
    const expiresAt = new Date(
      Date.now() + STORAGE_CONSTANTS.uploadUrlTtlSeconds * 1000,
    );

    const upload = await this.prisma.storageUpload.create({
      data: {
        userId: user.id,
        kind: StorageUploadKind.VERIFICATION,
        status: StorageUploadStatus.PENDING,
        objectKey,
        bucket,
        mimeType: dto.mimeType,
        maxSizeBytes: dto.size,
        originalFileName: dto.fileName,
        expiresAt,
        metadata: {
          tutorProfileId: tutor.id,
          documentId,
          replaceDocumentId,
          verificationMetadata,
        },
      },
    });

    const uploadUrl = await this.storage.createPresignedPutUrl({
      bucket,
      objectKey,
      mimeType: dto.mimeType,
    });

    return { uploadId: upload.id, uploadUrl, expiresAt };
  }

  async completeVerification(user: AuthUser, uploadId: string) {
    this.ensureStorageReady();
    const upload = await this.getPendingUpload(
      user.id,
      uploadId,
      StorageUploadKind.VERIFICATION,
    );

    const head = await this.storage.headObject(upload.bucket, upload.objectKey);
    if (head.contentLength <= 0 || head.contentLength > upload.maxSizeBytes) {
      throw new BadRequestException('Uploaded document size is invalid');
    }

    const metadata = (upload.metadata ?? {}) as {
      tutorProfileId?: string;
      documentId?: string;
      replaceDocumentId?: string;
      verificationMetadata?: VerificationDocumentMetadata;
    };

    if (!metadata.tutorProfileId || !metadata.documentId) {
      throw new BadRequestException('Invalid upload metadata');
    }

    const verificationMetadata = metadata.verificationMetadata;
    if (!verificationMetadata?.documentCategory) {
      throw new BadRequestException('Invalid verification metadata');
    }

    const safeDisplayName = (upload.originalFileName ?? 'document')
      .replace(/[^\w.\-() ]+/g, '_')
      .slice(0, 180);

    if (metadata.replaceDocumentId) {
      const existing = await this.prisma.verificationDocument.findUnique({
        where: { id: metadata.replaceDocumentId },
        include: { tutorProfile: { select: { userId: true, id: true } } },
      });

      if (!existing || existing.tutorProfile.userId !== user.id) {
        throw new ForbiddenException('You cannot replace this document');
      }

      const previousObjectKey = existing.objectKey;
      const wasVerified = existing.status === VerificationStatus.VERIFIED;

      const document = await this.prisma.verificationDocument.update({
        where: { id: existing.id },
        data: {
          objectKey: upload.objectKey,
          originalFileName: upload.originalFileName ?? safeDisplayName,
          displayFileName: safeDisplayName,
          mimeType: upload.mimeType,
          sizeBytes: head.contentLength,
          documentType: verificationMetadata.documentCategory,
          metadata: verificationMetadata,
          status: VerificationStatus.PENDING,
          reviewedAt: null,
          reviewerUserId: null,
          rejectionReason: null,
        },
      });

      if (wasVerified) {
        await this.refreshTutorVerificationStatus(existing.tutorProfileId);
      }

      await this.prisma.storageUpload.update({
        where: { id: upload.id },
        data: {
          status: StorageUploadStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      if (previousObjectKey !== upload.objectKey) {
        await this.storage.deleteObject(upload.bucket, previousObjectKey);
      }

      return serializeVerificationDocument(document);
    }

    const document = await this.prisma.verificationDocument.create({
      data: {
        id: metadata.documentId,
        tutorProfileId: metadata.tutorProfileId,
        objectKey: upload.objectKey,
        originalFileName: upload.originalFileName ?? safeDisplayName,
        displayFileName: safeDisplayName,
        mimeType: upload.mimeType,
        sizeBytes: head.contentLength,
        documentType: verificationMetadata.documentCategory,
        metadata: verificationMetadata,
        status: VerificationStatus.PENDING,
      },
    });

    await this.prisma.storageUpload.update({
      where: { id: upload.id },
      data: {
        status: StorageUploadStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    return serializeVerificationDocument(document);
  }

  async deleteVerificationDocument(user: AuthUser, documentId: string) {
    this.ensureStorageReady();

    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
      include: { tutorProfile: { select: { userId: true, id: true } } },
    });

    if (!document) throw new NotFoundException('Document not found');
    if (document.tutorProfile.userId !== user.id) {
      throw new ForbiddenException('You cannot delete this document');
    }

    await this.storage.deleteObject(
      this.storage.getPrivateBucket(),
      document.objectKey,
    );

    await this.prisma.verificationDocument.delete({
      where: { id: document.id },
    });

    await this.refreshTutorVerificationStatus(document.tutorProfileId);

    return { success: true };
  }

  async getVerificationOptions(user: AuthUser) {
    if (!user.roles.includes(UserRole.TUTOR)) {
      throw new ForbiddenException('Only tutors can access verification options');
    }

    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      select: { searchDocument: true },
    });
    if (!tutor) throw new NotFoundException('Tutor profile not found');

    const teachingSubjectIds = parseTeachingTags(tutor.searchDocument);
    const examOptions = buildExamProofOptions(teachingSubjectIds);

    return {
      teachingSubjectIds,
      categories: VERIFICATION_DOCUMENT_CATEGORIES.map((value) => ({
        value,
        requiresExamType: value === 'EXAM_RESULT',
      })),
      examOptions,
    };
  }

  private resolveDocumentCategory(dto: PresignUploadDto) {
    if (dto.documentCategory && isVerificationDocumentCategory(dto.documentCategory)) {
      return dto.documentCategory;
    }
    if (dto.documentType) {
      return normalizeLegacyDocumentType(dto.documentType);
    }
    throw new BadRequestException('Document category is required');
  }

  private async refreshTutorVerificationStatus(tutorProfileId: string) {
    const verifiedCount = await this.prisma.verificationDocument.count({
      where: {
        tutorProfileId,
        status: VerificationStatus.VERIFIED,
      },
    });

    await this.prisma.tutorProfile.update({
      where: { id: tutorProfileId },
      data: {
        verificationStatus:
          verifiedCount > 0
            ? VerificationStatus.VERIFIED
            : VerificationStatus.PENDING,
      },
    });
  }

  async getVerificationDownloadUrl(user: AuthUser, documentId: string) {
    this.ensureStorageReady();
    const document = await this.prisma.verificationDocument.findUnique({
      where: { id: documentId },
      include: { tutorProfile: { select: { userId: true } } },
    });

    if (!document) throw new NotFoundException('Document not found');

    const isOwner = document.tutorProfile.userId === user.id;
    const isAdmin = user.roles.includes(UserRole.ADMIN);
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You cannot access this document');
    }

    const downloadUrl = await this.storage.createPresignedGetUrl({
      bucket: this.storage.getPrivateBucket(),
      objectKey: document.objectKey,
      downloadFileName: document.displayFileName,
    });

    return {
      downloadUrl,
      expiresInSeconds: STORAGE_CONSTANTS.downloadUrlTtlSeconds,
      fileName: document.displayFileName,
    };
  }

  async listVerificationDocuments(user: AuthUser) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
      include: {
        verificationDocuments: {
          orderBy: { uploadedAt: 'desc' },
        },
      },
    });
    if (!tutor) throw new NotFoundException('Tutor profile not found');

    return tutor.verificationDocuments.map((doc) =>
      serializeVerificationDocument(doc),
    );
  }

  private async getPendingUpload(
    userId: string,
    uploadId: string,
    kind: StorageUploadKind,
  ) {
    const upload = await this.prisma.storageUpload.findFirst({
      where: { id: uploadId, userId, kind },
    });

    if (!upload) throw new NotFoundException('Upload not found');
    if (upload.status !== StorageUploadStatus.PENDING) {
      throw new BadRequestException('Upload has already been completed');
    }
    if (upload.expiresAt < new Date()) {
      await this.prisma.storageUpload.update({
        where: { id: upload.id },
        data: { status: StorageUploadStatus.EXPIRED },
      });
      throw new BadRequestException('Upload URL has expired');
    }

    return upload;
  }
}
