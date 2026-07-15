import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EnvValidationService implements OnModuleInit {
  private readonly logger = new Logger(EnvValidationService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const requiredAlways = ['JWT_SECRET', 'DATABASE_URL'];
    const missing = requiredAlways.filter((key) => !this.config.get(key));
    if (missing.length) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    if (this.config.get('NODE_ENV') === 'production') {
      const prodRequired = [
        'GOOGLE_CLIENT_ID',
        'FRONTEND_URL',
        'R2_ENDPOINT',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_PUBLIC_BUCKET',
        'R2_PRIVATE_BUCKET',
        'R2_PUBLIC_BASE_URL',
        'TELEGRAM_BOT_TOKEN',
        'TELEGRAM_BOT_USERNAME',
        'TELEGRAM_WEBHOOK_SECRET',
      ];
      const prodMissing = prodRequired.filter((key) => !this.config.get(key));
      if (prodMissing.length) {
        throw new Error(
          `Missing required production environment variables: ${prodMissing.join(', ')}`,
        );
      }
    }

    if (!this.config.get('GOOGLE_CLIENT_ID')) {
      this.logger.warn('GOOGLE_CLIENT_ID is not set — Google sign-in will be disabled');
    }

    if (!this.config.get('R2_ENDPOINT')) {
      this.logger.warn('R2 storage is not configured — presigned uploads will fail until configured');
    }
  }
}
