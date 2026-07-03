export const STORAGE_CONSTANTS = {
  avatar: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
    maxSizeBytes: Number(process.env.MAX_AVATAR_SIZE_BYTES) || 5 * 1024 * 1024,
    outputMimeType: 'image/webp',
    maxDimension: 1024,
  },
  verification: {
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ] as const,
    maxSizeBytes:
      Number(process.env.MAX_VERIFICATION_FILE_SIZE_BYTES) || 15 * 1024 * 1024,
  },
  uploadUrlTtlSeconds: Number(process.env.R2_UPLOAD_URL_TTL_SECONDS) || 600,
  downloadUrlTtlSeconds: Number(process.env.R2_DOWNLOAD_URL_TTL_SECONDS) || 600,
} as const;

export type PublicAvatarScope = 'users' | 'tutors';
