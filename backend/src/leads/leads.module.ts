import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RateLimitService } from '../common/services/rate-limit.service';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LeadsController],
  providers: [
    LeadsService,
    RateLimitService,
    JwtAuthGuard,
    RolesGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [LeadsService],
})
export class LeadsModule {}
