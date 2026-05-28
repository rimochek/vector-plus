import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  private async getStudentProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ForbiddenException('Student profile required');
    }
    return profile.id;
  }

  async listFavorites(user: AuthUser) {
    const studentProfileId = await this.getStudentProfileId(user.id);

    const favorites = await this.prisma.studentFavorite.findMany({
      where: { studentProfileId },
      include: {
        tutorProfile: {
          include: {
            subjects: { include: { subject: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((f) => ({
      id: f.id,
      tutorProfileId: f.tutorProfileId,
      createdAt: f.createdAt.toISOString(),
      tutor: {
        id: f.tutorProfile.id,
        displayName: f.tutorProfile.displayName,
        bio: f.tutorProfile.bio,
        avatarUrl: f.tutorProfile.avatarUrl,
        subject: f.tutorProfile.subjects[0]?.subject.name ?? 'General',
        defaultHourlyRateCents: f.tutorProfile.defaultHourlyRateCents,
        defaultCurrency: f.tutorProfile.defaultCurrency,
        ratingAvg: f.tutorProfile.ratingAvg,
        ratingCount: f.tutorProfile.ratingCount,
        country: f.tutorProfile.country,
        city: f.tutorProfile.city,
      },
    }));
  }

  async addFavorite(user: AuthUser, tutorProfileId: string) {
    const studentProfileId = await this.getStudentProfileId(user.id);

    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });
    if (!tutor) throw new NotFoundException('Tutor not found');

    await this.prisma.studentFavorite.upsert({
      where: {
        studentProfileId_tutorProfileId: {
          studentProfileId,
          tutorProfileId,
        },
      },
      create: { studentProfileId, tutorProfileId },
      update: {},
    });

    return { favorited: true };
  }

  async removeFavorite(user: AuthUser, tutorProfileId: string) {
    const studentProfileId = await this.getStudentProfileId(user.id);

    await this.prisma.studentFavorite.deleteMany({
      where: { studentProfileId, tutorProfileId },
    });

    return { favorited: false };
  }

  async checkFavorite(user: AuthUser, tutorProfileId: string) {
    const studentProfileId = await this.getStudentProfileId(user.id);

    const favorite = await this.prisma.studentFavorite.findUnique({
      where: {
        studentProfileId_tutorProfileId: {
          studentProfileId,
          tutorProfileId,
        },
      },
    });

    return { favorited: Boolean(favorite) };
  }
}
