import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';

export type VerifiedGoogleProfile = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  givenName?: string;
  familyName?: string;
  picture?: string;
  hostedDomain?: string;
};

@Injectable()
export class GoogleAuthService {
  private client: OAuth2Client | null = null;

  constructor(private readonly config: ConfigService) {}

  isEnabled(): boolean {
    return Boolean(this.config.get<string>('GOOGLE_CLIENT_ID'));
  }

  private getClient(): OAuth2Client {
    if (this.client) return this.client;
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured');
    }
    this.client = new OAuth2Client(clientId);
    return this.client;
  }

  async verifyIdToken(credential: string): Promise<VerifiedGoogleProfile> {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google sign-in is not configured');
    }

    let payload;
    try {
      const ticket = await this.getClient().verifyIdToken({
        idToken: credential,
        audience: clientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google credential');
    }

    if (!payload?.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google account');
    }

    const iss = payload.iss;
    if (iss !== 'accounts.google.com' && iss !== 'https://accounts.google.com') {
      throw new UnauthorizedException('Invalid Google token issuer');
    }

    if (payload.email_verified === false) {
      throw new UnauthorizedException('Google email is not verified');
    }

    return {
      sub: payload.sub,
      email: payload.email.toLowerCase(),
      emailVerified: payload.email_verified !== false,
      name: payload.name,
      givenName: payload.given_name,
      familyName: payload.family_name,
      picture: payload.picture,
      hostedDomain: payload.hd,
    };
  }

  isAutoLinkAllowed(profile: VerifiedGoogleProfile): boolean {
    if (!profile.emailVerified) return false;
    if (profile.email.endsWith('@gmail.com') || profile.email.endsWith('@googlemail.com')) {
      return true;
    }
    return Boolean(profile.hostedDomain);
  }
}
