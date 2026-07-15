import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LeadsModule } from '../leads/leads.module';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { PublicLeadsController } from './public-leads.controller';

@Module({
  imports: [AuthModule, LeadsModule],
  controllers: [PublicLeadsController],
  providers: [OptionalJwtAuthGuard],
})
export class PublicModule {}
