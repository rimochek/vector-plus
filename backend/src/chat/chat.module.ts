import { Module, forwardRef } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [ChatController],
  providers: [ChatService, JwtAuthGuard],
  exports: [ChatService],
})
export class ChatModule {}
