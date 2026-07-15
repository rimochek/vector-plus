import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramController } from './telegram.controller';
import { TelegramAuthService } from './telegram-auth.service';
import { TelegramBotService } from './telegram-bot.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TelegramController],
  providers: [TelegramAuthService, TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramModule {}
