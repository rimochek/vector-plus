import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TelegramBotService {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendToUser(userId: string, text: string, path?: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const appUrl = this.config.get<string>('FRONTEND_URL');
    if (!token) return;
    const connection = await this.prisma.telegramConnection.findUnique({
      where: { userId },
    });
    if (!connection?.notificationsEnabled) return;

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: connection.telegramChatId,
          text,
          reply_markup:
            appUrl && path
              ? {
                  inline_keyboard: [
                    [
                      {
                        text: 'Открыть в Tutora',
                        web_app: { url: `${appUrl}${path}` },
                      },
                    ],
                  ],
                }
              : undefined,
        }),
      },
    );
    if (!response.ok)
      this.logger.warn(
        `Telegram delivery failed for user ${userId}: ${response.status}`,
      );
  }

  async sendWelcome(chatId: string): Promise<void> {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    const appUrl = this.config.get<string>('FRONTEND_URL');
    if (!token || !appUrl) return;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'Добро пожаловать в Tutora! Откройте приложение, чтобы войти, найти репетитора или управлять уроками.',
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Открыть Tutora', web_app: { url: `${appUrl}/login` } }],
          ],
        },
      }),
    });
  }
}
