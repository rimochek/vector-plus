import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CurrencyCode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { UpdateStudentProfileDto } from './dto/update-student-profile.dto';

function buildLearningGoals(
  lookingFor?: string,
  tags?: string[],
  city?: string,
): string | undefined {
  const parts: string[] = [];
  const text = lookingFor?.trim();
  if (text) parts.push(text);
  if (tags?.length) {
    parts.push(`[tags:${tags.join(',')}]`);
  }
  if (city?.trim()) {
    parts.push(`[city:${city.trim()}]`);
  }
  return parts.length > 0 ? parts.join('\n') : undefined;
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async getOwnProfile(user: AuthUser) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }
    return profile;
  }

  async updateOwnProfile(user: AuthUser, dto: UpdateStudentProfileDto) {
    const profile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    if (
      dto.budgetMinCents != null &&
      dto.budgetMaxCents != null &&
      dto.budgetMaxCents < dto.budgetMinCents
    ) {
      throw new BadRequestException(
        'Maximum budget must be greater than or equal to minimum',
      );
    }

    const learningGoals =
      dto.lookingFor !== undefined ||
      dto.tags !== undefined ||
      dto.city !== undefined
        ? buildLearningGoals(
            dto.lookingFor ?? profile.learningGoals?.split('\n')[0],
            dto.tags,
            dto.city,
          )
        : undefined;

    return this.prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        ...(dto.displayName !== undefined
          ? { displayName: dto.displayName.trim() }
          : {}),
        ...(learningGoals !== undefined ? { learningGoals } : {}),
        ...(dto.learningLevel !== undefined
          ? { learningLevel: dto.learningLevel }
          : {}),
        ...(dto.budgetMinCents !== undefined
          ? { budgetMinCents: dto.budgetMinCents }
          : {}),
        ...(dto.budgetMaxCents !== undefined
          ? { budgetMaxCents: dto.budgetMaxCents }
          : {}),
        ...(dto.budgetCurrency !== undefined
          ? { budgetCurrency: dto.budgetCurrency as CurrencyCode }
          : {}),
        ...(dto.preferredLessonFormat !== undefined
          ? { preferredLessonFormat: dto.preferredLessonFormat }
          : {}),
        ...(dto.preferredTimes !== undefined
          ? { preferredTimes: dto.preferredTimes }
          : {}),
        ...(dto.onboardingCompleted !== undefined
          ? { onboardingCompleted: dto.onboardingCompleted }
          : {}),
      },
    });
  }
}
