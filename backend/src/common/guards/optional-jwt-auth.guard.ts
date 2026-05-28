import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthUser } from '../decorators/current-user.decorator';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: AuthUser;
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return true;
    }

    const token = authHeader.slice(7);
    try {
      const payload = this.jwtService.verify<{ id: string; email: string }>(
        token,
      );
      const user = await this.prisma.user.findUnique({
        where: { id: payload.id },
        include: { roles: true },
      });

      if (user && !user.deletedAt) {
        request.user = {
          id: user.id,
          email: user.email,
          roles: user.roles.map((r) => r.role),
        };
      }
    } catch {
      /* ignore invalid token for optional auth */
    }

    return true;
  }
}
