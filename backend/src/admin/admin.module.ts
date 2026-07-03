import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRoleModule } from './admin-role.module';
import { StorageModule } from '../storage/storage.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [AdminRoleModule, StorageModule, AuthModule, PrismaModule],
  controllers: [AdminController],
  providers: [AdminService, JwtAuthGuard, RolesGuard],
  exports: [AdminService, AdminRoleModule],
})
export class AdminModule {}
