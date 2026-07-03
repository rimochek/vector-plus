import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from './google-auth.service';

const mockVerifyIdToken = jest.fn();

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

describe('GoogleAuthService', () => {
  let service: GoogleAuthService;

  beforeEach(() => {
    mockVerifyIdToken.mockReset();
    service = new GoogleAuthService(
      new ConfigService({
        GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
      }),
    );
  });

  it('rejects invalid tokens', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('bad token'));
    await expect(service.verifyIdToken('bad')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('accepts valid Google payload', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-1',
        email: 'student@gmail.com',
        email_verified: true,
        iss: 'accounts.google.com',
        name: 'Student User',
      }),
    });

    const profile = await service.verifyIdToken('valid-token');
    expect(profile.sub).toBe('google-sub-1');
    expect(profile.email).toBe('student@gmail.com');
  });

  it('allows auto-link for verified Gmail accounts', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        sub: 'google-sub-2',
        email: 'tutor@gmail.com',
        email_verified: true,
        iss: 'accounts.google.com',
      }),
    });

    const profile = await service.verifyIdToken('valid-token');
    expect(service.isAutoLinkAllowed(profile)).toBe(true);
  });

  it('does not auto-link unverified non-workspace emails', async () => {
    const profile = {
      sub: 'x',
      email: 'user@example.com',
      emailVerified: false,
    };
    expect(service.isAutoLinkAllowed(profile)).toBe(false);
  });
});
