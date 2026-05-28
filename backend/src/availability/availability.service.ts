import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AvailabilityRuleType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateAvailabilityRuleDto,
  CreateAvailabilitySlotDto,
  SaveWeeklyScheduleDto,
} from './dto/availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  private async getTutorProfileId(userId: string): Promise<string> {
    const profile = await this.prisma.tutorProfile.findUnique({
      where: { userId },
    });
    if (!profile) {
      throw new ForbiddenException('Tutor profile required');
    }
    return profile.id;
  }

  async createRule(user: AuthUser, dto: CreateAvailabilityRuleDto) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    this.validateRuleDto(dto);

    const rule = await this.prisma.tutorAvailabilityRule.create({
      data: {
        tutorProfileId,
        ruleType: dto.ruleType,
        timezone: dto.timezone,
        dayOfWeek: dto.dayOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
    });

    if (dto.ruleType === AvailabilityRuleType.ONE_OFF && dto.startsAt && dto.endsAt) {
      const rangeStart = new Date(dto.startsAt);
      const rangeEnd = new Date(dto.endsAt);
      for (const hourly of this.splitIntoHourlySlots(rangeStart, rangeEnd)) {
        await this.createSlotIfFree(
          tutorProfileId,
          hourly.startsAt,
          hourly.endsAt,
          rule.id,
        );
      }
    }

    return rule;
  }

  async listRules(user: AuthUser) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    return this.prisma.tutorAvailabilityRule.findMany({
      where: { tutorProfileId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWeeklySchedule(user: AuthUser) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { timezone: true },
    });

    const rules = await this.prisma.tutorAvailabilityRule.findMany({
      where: {
        tutorProfileId,
        isActive: true,
        ruleType: AvailabilityRuleType.RECURRING_WEEKLY,
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const dayMap = new Map<number, { startTime: string; endTime: string }[]>();
    for (const rule of rules) {
      if (rule.dayOfWeek == null || !rule.startTime || !rule.endTime) continue;
      const list = dayMap.get(rule.dayOfWeek) ?? [];
      list.push({ startTime: rule.startTime, endTime: rule.endTime });
      dayMap.set(rule.dayOfWeek, list);
    }

    const schedule = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      slots: dayMap.get(dayOfWeek) ?? [],
    }));

    const timezone =
      rules[0]?.timezone ??
      dbUser?.timezone ??
      Intl.DateTimeFormat().resolvedOptions().timeZone ??
      'UTC';

    return { timezone, schedule };
  }

  async saveWeeklySchedule(user: AuthUser, dto: SaveWeeklyScheduleDto) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    this.validateWeeklySchedule(dto);

    const weeksAhead = dto.weeksAhead ?? 8;

    await this.prisma.$transaction(async (tx) => {
      await tx.tutorAvailabilityRule.updateMany({
        where: {
          tutorProfileId,
          ruleType: AvailabilityRuleType.RECURRING_WEEKLY,
          isActive: true,
        },
        data: { isActive: false },
      });

      for (const day of dto.schedule) {
        for (const slot of day.slots) {
          await tx.tutorAvailabilityRule.create({
            data: {
              tutorProfileId,
              ruleType: AvailabilityRuleType.RECURRING_WEEKLY,
              timezone: dto.timezone,
              dayOfWeek: day.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
            },
          });
        }
      }

      const now = new Date();
      await tx.availabilitySlot.deleteMany({
        where: {
          tutorProfileId,
          isAvailable: true,
          startsAt: { gte: now },
          lesson: null,
        },
      });
    });

    const generated = await this.generateSlotsFromRules(user, weeksAhead);
    return { success: true, ...generated };
  }

  private validateWeeklySchedule(dto: SaveWeeklyScheduleDto) {
    for (const day of dto.schedule) {
      const sorted = [...day.slots].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );

      for (const slot of sorted) {
        if (slot.endTime <= slot.startTime) {
          throw new BadRequestException(
            `Invalid time range on day ${day.dayOfWeek}: end must be after start`,
          );
        }
      }

      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          throw new BadRequestException(
            `Overlapping slots on day ${day.dayOfWeek}`,
          );
        }
      }
    }
  }

  async deleteRule(user: AuthUser, ruleId: string) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    const rule = await this.prisma.tutorAvailabilityRule.findFirst({
      where: { id: ruleId, tutorProfileId },
    });
    if (!rule) throw new NotFoundException('Rule not found');

    await this.prisma.tutorAvailabilityRule.update({
      where: { id: ruleId },
      data: { isActive: false },
    });
    return { success: true };
  }

  async createSlot(user: AuthUser, dto: CreateAvailabilitySlotDto) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('End time must be after start time');
    }

    const createdSlots: Awaited<ReturnType<typeof this.createSlotIfFree>>[] = [];
    for (const hourly of this.splitIntoHourlySlots(startsAt, endsAt)) {
      const slot = await this.createSlotIfFree(
        tutorProfileId,
        hourly.startsAt,
        hourly.endsAt,
      );
      if (slot) createdSlots.push(slot);
    }

    if (createdSlots.length === 0) {
      throw new BadRequestException('Slot overlaps with an existing booking');
    }

    return createdSlots.length === 1 ? createdSlots[0] : createdSlots;
  }

  async generateSlotsFromRules(user: AuthUser, weeksAhead = 4) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    const rules = await this.prisma.tutorAvailabilityRule.findMany({
      where: {
        tutorProfileId,
        isActive: true,
        ruleType: AvailabilityRuleType.RECURRING_WEEKLY,
      },
    });

    const blocked = await this.prisma.tutorAvailabilityRule.findMany({
      where: {
        tutorProfileId,
        isActive: true,
        ruleType: AvailabilityRuleType.BLOCKED,
      },
    });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + weeksAhead * 7);

    let created = 0;

    for (const rule of rules) {
      if (rule.dayOfWeek == null || !rule.startTime || !rule.endTime) continue;

      const cursor = new Date(now);
      cursor.setHours(0, 0, 0, 0);

      while (cursor <= endDate) {
        if (cursor.getDay() === rule.dayOfWeek) {
          const [sh, sm] = rule.startTime.split(':').map(Number);
          const [eh, em] = rule.endTime.split(':').map(Number);
          const rangeStart = new Date(cursor);
          rangeStart.setHours(sh, sm ?? 0, 0, 0);
          const rangeEnd = new Date(cursor);
          rangeEnd.setHours(eh, em ?? 0, 0, 0);

          for (const hourly of this.splitIntoHourlySlots(rangeStart, rangeEnd)) {
            if (
              hourly.startsAt > now &&
              !this.isBlocked(hourly.startsAt, hourly.endsAt, blocked)
            ) {
              const result = await this.createSlotIfFree(
                tutorProfileId,
                hourly.startsAt,
                hourly.endsAt,
                rule.id,
              );
              if (result) created++;
            }
          }
        }
        cursor.setDate(cursor.getDate() + 1);
      }
    }

    return { created };
  }

  async listTutorSlots(user: AuthUser) {
    const tutorProfileId = await this.getTutorProfileId(user.id);
    return this.getAvailableSlots(tutorProfileId);
  }

  async listPublicSlots(tutorProfileId: string) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });
    if (!tutor) throw new NotFoundException('Tutor not found');
    return this.getAvailableSlots(tutorProfileId);
  }

  private async getAvailableSlots(tutorProfileId: string) {
    await this.normalizeMultiHourSlots(tutorProfileId);

    const now = new Date();
    const slots = await this.prisma.availabilitySlot.findMany({
      where: {
        tutorProfileId,
        isAvailable: true,
        startsAt: { gte: now },
        lesson: null,
      },
      orderBy: { startsAt: 'asc' },
      take: 500,
    });

    return slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      durationMinutes: Math.round(
        (s.endsAt.getTime() - s.startsAt.getTime()) / 60000,
      ),
    }));
  }

  private splitIntoHourlySlots(
    rangeStart: Date,
    rangeEnd: Date,
  ): Array<{ startsAt: Date; endsAt: Date }> {
    const hourly: Array<{ startsAt: Date; endsAt: Date }> = [];
    const cursor = new Date(rangeStart);
    const oneHourMs = 60 * 60 * 1000;

    while (cursor.getTime() + oneHourMs <= rangeEnd.getTime()) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + oneHourMs);
      hourly.push({ startsAt: slotStart, endsAt: slotEnd });
      cursor.setTime(cursor.getTime() + oneHourMs);
    }

    return hourly;
  }

  private async normalizeMultiHourSlots(tutorProfileId: string) {
    const now = new Date();
    const multiHourSlots = await this.prisma.availabilitySlot.findMany({
      where: {
        tutorProfileId,
        isAvailable: true,
        lesson: null,
        startsAt: { gte: now },
      },
    });

    for (const slot of multiHourSlots) {
      const durationMs = slot.endsAt.getTime() - slot.startsAt.getTime();
      if (durationMs <= 60 * 60 * 1000) continue;

      const hourlySlots = this.splitIntoHourlySlots(slot.startsAt, slot.endsAt);
      if (hourlySlots.length === 0) continue;

      await this.prisma.$transaction(async (tx) => {
        await tx.availabilitySlot.delete({ where: { id: slot.id } });
        for (const hourly of hourlySlots) {
          const overlap = await tx.availabilitySlot.findFirst({
            where: {
              tutorProfileId,
              startsAt: { lt: hourly.endsAt },
              endsAt: { gt: hourly.startsAt },
            },
          });
          if (overlap) continue;

          await tx.availabilitySlot.create({
            data: {
              tutorProfileId,
              ruleId: slot.ruleId,
              startsAt: hourly.startsAt,
              endsAt: hourly.endsAt,
              isAvailable: true,
            },
          });
        }
      });
    }
  }

  private validateRuleDto(dto: CreateAvailabilityRuleDto) {
    if (dto.ruleType === AvailabilityRuleType.RECURRING_WEEKLY) {
      if (dto.dayOfWeek == null || !dto.startTime || !dto.endTime) {
        throw new BadRequestException(
          'Recurring rules require dayOfWeek, startTime, and endTime',
        );
      }
    }
    if (
      dto.ruleType === AvailabilityRuleType.ONE_OFF ||
      dto.ruleType === AvailabilityRuleType.BLOCKED
    ) {
      if (!dto.startsAt || !dto.endsAt) {
        throw new BadRequestException(
          'One-off and blocked rules require startsAt and endsAt',
        );
      }
    }
  }

  private isBlocked(
    startsAt: Date,
    endsAt: Date,
    blocked: Array<{ startsAt: Date | null; endsAt: Date | null }>,
  ): boolean {
    return blocked.some((b) => {
      if (!b.startsAt || !b.endsAt) return false;
      return startsAt < b.endsAt && endsAt > b.startsAt;
    });
  }

  private async createSlotIfFree(
    tutorProfileId: string,
    startsAt: Date,
    endsAt: Date,
    ruleId?: string,
  ) {
    const overlap = await this.prisma.availabilitySlot.findFirst({
      where: {
        tutorProfileId,
        startsAt: { lt: endsAt },
        endsAt: { gt: startsAt },
      },
    });

    if (overlap) return null;

    return this.prisma.availabilitySlot.create({
      data: {
        tutorProfileId,
        ruleId,
        startsAt,
        endsAt,
        isAvailable: true,
      },
    });
  }
}
