import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type TelegramUserData = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
};

@Injectable()
export class TelegramAuthService {
  constructor(private readonly config: ConfigService) {}

  validateMiniAppData(initData: string): TelegramUserData {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token)
      throw new UnauthorizedException('Telegram login is not configured');

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    const authDate = Number(params.get('auth_date'));
    const rawUser = params.get('user');
    if (!hash || !authDate || !rawUser) {
      throw new UnauthorizedException('Invalid Telegram authorization data');
    }
    if (Math.abs(Date.now() / 1000 - authDate) > 5 * 60) {
      throw new UnauthorizedException('Telegram authorization has expired');
    }

    const fields: string[] = [];
    params.forEach((value, key) => {
      if (key !== 'hash' && key !== 'signature') fields.push(`${key}=${value}`);
    });
    fields.sort();
    const secret = createHmac('sha256', 'WebAppData').update(token).digest();
    const expected = createHmac('sha256', secret)
      .update(fields.join('\n'))
      .digest();
    const received = Buffer.from(hash, 'hex');
    if (
      received.length !== expected.length ||
      !timingSafeEqual(received, expected)
    ) {
      throw new UnauthorizedException('Invalid Telegram signature');
    }

    try {
      return JSON.parse(rawUser) as TelegramUserData;
    } catch {
      throw new UnauthorizedException('Invalid Telegram user data');
    }
  }
}
