import { Body, Controller, Headers, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { setRefreshTokenCookie } from '../auth/auth-cookies';
import {
  TelegramAuthDto,
  TelegramWidgetAuthDto,
} from './dto/telegram-auth.dto';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramBotService } from './telegram-bot.service';

@Controller('auth/telegram')
export class TelegramController {
  constructor(
    private readonly auth: AuthService,
    private readonly telegramAuth: TelegramAuthService,
    private readonly config: ConfigService,
    private readonly bot: TelegramBotService,
  ) {}

  @Post()
  async authenticate(
    @Body() dto: TelegramAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const telegramUser = this.telegramAuth.validateMiniAppData(dto.initData);
    const result = await this.auth.authenticateWithTelegram(
      telegramUser,
      dto.intendedRole,
    );
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );
    return {
      message: result.message,
      access_token: result.access_token,
      existingAccount: result.existingAccount,
      user: result.user,
    };
  }

  @Post('widget')
  async authenticateWidget(
    @Body() dto: TelegramWidgetAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { intendedRole, ...widgetData } = dto;
    const telegramUser = this.telegramAuth.validateWidgetData(widgetData);
    const result = await this.auth.authenticateWithTelegram(
      telegramUser,
      intendedRole,
    );
    setRefreshTokenCookie(
      res,
      result.refreshToken,
      result.refreshTokenMaxAgeMs,
    );
    return {
      message: result.message,
      access_token: result.access_token,
      existingAccount: result.existingAccount,
      user: result.user,
    };
  }

  @Post('webhook')
  async webhook(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body()
    update: {
      message?: { chat: { id: number }; from?: { id: number }; text?: string };
    },
  ) {
    if (secret !== this.config.get<string>('TELEGRAM_WEBHOOK_SECRET'))
      return { ok: false };
    const message = update.message;
    if (message?.text?.startsWith('/start') && message.from) {
      await this.auth.attachTelegramChat(
        String(message.from.id),
        String(message.chat.id),
      );
      await this.bot.sendWelcome(String(message.chat.id));
    }
    return { ok: true };
  }
}
