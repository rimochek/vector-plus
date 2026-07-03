import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TutorsModule } from './tutors/tutors.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { FavoritesModule } from './favorites/favorites.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StudentsModule } from './students/students.module';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';
import { EnvValidationService } from './config/env-validation.service';

function rootEnvFilePaths(): string[] {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '..', '.env'),
  ];
  return candidates.filter((filePath) => existsSync(filePath));
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: rootEnvFilePaths(),
    }),
    PrismaModule,
    AuthModule,
    TutorsModule,
    StudentsModule,
    AvailabilityModule,
    BookingsModule,
    FavoritesModule,
    ChatModule,
    NotificationsModule,
    StorageModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService, EnvValidationService],
})
export class AppModule {}
