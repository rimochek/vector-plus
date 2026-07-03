import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    service = new StorageService(
      new ConfigService({
        R2_ENDPOINT: 'https://example.r2.cloudflarestorage.com',
        R2_ACCESS_KEY_ID: 'key',
        R2_SECRET_ACCESS_KEY: 'secret',
        R2_PUBLIC_BUCKET: 'tutora-public',
        R2_PRIVATE_BUCKET: 'tutora-private',
        R2_PUBLIC_BASE_URL: 'https://media.example.com',
      }),
    );
  });

  it('generates safe avatar keys', () => {
    const key = service.generateAvatarObjectKey('tutors', 'tutor-1', 'webp');
    expect(key).toMatch(/^avatars\/tutors\/tutor-1\/[a-f0-9-]+\.webp$/);
  });

  it('generates safe verification keys', () => {
    const key = service.generateVerificationObjectKey(
      'tutor-1',
      'doc-1',
      'pdf',
    );
    expect(key).toMatch(
      /^verification\/tutors\/tutor-1\/doc-1\/[a-f0-9-]+\.pdf$/,
    );
  });

  it('rejects unsupported mime types', () => {
    expect(() =>
      service.validateMime('text/html', ['image/jpeg']),
    ).toThrow(BadRequestException);
  });

  it('builds public URLs without leaking signed params', () => {
    const url = service.buildPublicUrl('avatars/tutors/id/file.webp');
    expect(url).toBe('https://media.example.com/avatars/tutors/id/file.webp');
    expect(url).not.toContain('X-Amz');
  });
});
