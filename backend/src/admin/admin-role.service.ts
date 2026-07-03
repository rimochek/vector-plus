import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private adminEmails(): Set<string> {
    const raw = this.config.get<string>('ADMIN_EMAILS') ?? '';
    return new Set(
      raw
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean),
    );
  }

  isConfiguredAdminEmail(email: string): boolean {
    return this.adminEmails().has(email.trim().toLowerCase());
  }

  async syncAdminRoleForUser(userId: string, email: string): Promise<void> {
    const shouldBeAdmin = this.isConfiguredAdminEmail(email);
    const existing = await this.prisma.userRoleMap.findUnique({
      where: { userId_role: { userId, role: UserRole.ADMIN } },
    });

    if (shouldBeAdmin && !existing) {
      await this.prisma.userRoleMap.create({
        data: { userId, role: UserRole.ADMIN },
      });
      return;
    }

    if (!shouldBeAdmin && existing) {
      await this.prisma.userRoleMap.delete({
        where: { userId_role: { userId, role: UserRole.ADMIN } },
      });
    }
  }
}
