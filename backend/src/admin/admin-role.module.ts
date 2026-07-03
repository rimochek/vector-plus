import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminRoleService } from './admin-role.service';

@Module({
  imports: [PrismaModule],
  providers: [AdminRoleService],
  exports: [AdminRoleService],
})
export class AdminRoleModule {}
