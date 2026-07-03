import { Module } from '@nestjs/common';
import { TutorsController } from './tutors.controller';
import { TutorsService } from './tutors.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [TutorsController],
  providers: [TutorsService, OptionalJwtAuthGuard, JwtAuthGuard, RolesGuard],
  exports: [TutorsService],
})
export class TutorsModule {}
