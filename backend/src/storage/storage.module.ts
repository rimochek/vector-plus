import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UploadsController],
  providers: [StorageService, UploadsService, JwtAuthGuard, RolesGuard],
  exports: [StorageService, UploadsService],
})
export class StorageModule {}
