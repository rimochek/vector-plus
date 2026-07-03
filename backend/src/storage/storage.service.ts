import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { STORAGE_CONSTANTS, type PublicAvatarScope } from './storage.constants';

export type HeadObjectResult = {
  contentLength: number;
  contentType?: string;
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: S3Client | null = null;

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(
      this.config.get('R2_ENDPOINT') &&
        this.config.get('R2_ACCESS_KEY_ID') &&
        this.config.get('R2_SECRET_ACCESS_KEY') &&
        this.config.get('R2_PUBLIC_BUCKET') &&
        this.config.get('R2_PRIVATE_BUCKET'),
    );
  }

  private getClient(): S3Client {
    if (this.client) return this.client;

    const endpoint = this.config.get<string>('R2_ENDPOINT');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new BadRequestException('Object storage is not configured');
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
      // Browser PUT uploads cannot compute SDK checksums; presigned URLs must not require them.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });

    return this.client;
  }

  getPublicBucket(): string {
    const bucket = this.config.get<string>('R2_PUBLIC_BUCKET');
    if (!bucket) throw new BadRequestException('Public bucket is not configured');
    return bucket;
  }

  getPrivateBucket(): string {
    const bucket = this.config.get<string>('R2_PRIVATE_BUCKET');
    if (!bucket) throw new BadRequestException('Private bucket is not configured');
    return bucket;
  }

  getPublicBaseUrl(): string {
    const base = this.config.get<string>('R2_PUBLIC_BASE_URL');
    if (!base) throw new BadRequestException('Public media base URL is not configured');
    return base.replace(/\/$/, '');
  }

  buildPublicUrl(objectKey: string): string {
    return `${this.getPublicBaseUrl()}/${objectKey.replace(/^\//, '')}`;
  }

  generateAvatarObjectKey(scope: PublicAvatarScope, ownerId: string, ext: string): string {
    const safeExt = ext.replace(/[^a-z0-9.]/gi, '').toLowerCase() || 'webp';
    return `avatars/${scope}/${ownerId}/${randomUUID()}.${safeExt}`;
  }

  generateVerificationObjectKey(
    tutorProfileId: string,
    documentId: string,
    ext: string,
  ): string {
    const safeExt = ext.replace(/[^a-z0-9.]/gi, '').toLowerCase() || 'bin';
    return `verification/tutors/${tutorProfileId}/${documentId}/${randomUUID()}.${safeExt}`;
  }

  extensionForMime(mimeType: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'application/pdf':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  validateMime(
    mimeType: string,
    allowed: readonly string[],
  ): void {
    if (!allowed.includes(mimeType)) {
      throw new BadRequestException('Unsupported file type');
    }
  }

  validateSize(size: number, maxBytes: number): void {
    if (!Number.isFinite(size) || size <= 0) {
      throw new BadRequestException('Invalid file size');
    }
    if (size > maxBytes) {
      throw new BadRequestException('File is too large');
    }
  }

  async createPresignedPutUrl(params: {
    bucket: string;
    objectKey: string;
    mimeType: string;
  }): Promise<string> {
    const client = this.getClient();
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.objectKey,
      ContentType: params.mimeType,
    });

    return getSignedUrl(client, command, {
      expiresIn: STORAGE_CONSTANTS.uploadUrlTtlSeconds,
      signableHeaders: new Set(['content-type']),
    });
  }

  async createPresignedGetUrl(params: {
    bucket: string;
    objectKey: string;
    downloadFileName?: string;
  }): Promise<string> {
    const client = this.getClient();
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.objectKey,
      ...(params.downloadFileName
        ? {
            ResponseContentDisposition: `attachment; filename="${params.downloadFileName.replace(/"/g, '')}"`,
          }
        : {}),
    });

    return getSignedUrl(client, command, {
      expiresIn: STORAGE_CONSTANTS.downloadUrlTtlSeconds,
    });
  }

  async headObject(bucket: string, objectKey: string): Promise<HeadObjectResult> {
    const client = this.getClient();
    try {
      const result = await client.send(
        new HeadObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
      return {
        contentLength: Number(result.ContentLength ?? 0),
        contentType: result.ContentType,
      };
    } catch {
      throw new NotFoundException('Uploaded file was not found');
    }
  }

  async deleteObject(bucket: string, objectKey: string): Promise<void> {
    const client = this.getClient();
    try {
      await client.send(
        new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete object ${objectKey}: ${String(error)}`);
    }
  }

  async processAvatarObject(params: {
    bucket: string;
    sourceKey: string;
    targetKey: string;
  }): Promise<{ sizeBytes: number; mimeType: string }> {
    const client = this.getClient();
    const object = await client.send(
      new GetObjectCommand({ Bucket: params.bucket, Key: params.sourceKey }),
    );

    const chunks: Buffer[] = [];
    const body = object.Body;
    if (!body) throw new BadRequestException('Uploaded avatar is empty');

    if (typeof (body as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === 'function') {
      for await (const chunk of body as AsyncIterable<Uint8Array>) {
        chunks.push(Buffer.from(chunk));
      }
    } else if (body instanceof Uint8Array) {
      chunks.push(Buffer.from(body));
    } else {
      throw new BadRequestException('Could not read uploaded avatar');
    }

    const input = Buffer.concat(chunks);
    const processed = await sharp(input)
      .rotate()
      .resize(STORAGE_CONSTANTS.avatar.maxDimension, STORAGE_CONSTANTS.avatar.maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    await client.send(
      new PutObjectCommand({
        Bucket: params.bucket,
        Key: params.targetKey,
        Body: processed,
        ContentType: STORAGE_CONSTANTS.avatar.outputMimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    if (params.sourceKey !== params.targetKey) {
      await this.deleteObject(params.bucket, params.sourceKey);
    }

    return {
      sizeBytes: processed.length,
      mimeType: STORAGE_CONSTANTS.avatar.outputMimeType,
    };
  }

  assertObjectKeySafe(objectKey: string): void {
    if (
      !objectKey ||
      objectKey.includes('..') ||
      objectKey.startsWith('/') ||
      objectKey.includes('\\')
    ) {
      throw new ForbiddenException('Invalid object key');
    }
  }
}
