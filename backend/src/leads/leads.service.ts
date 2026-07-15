import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactEventType,
  LeadContactType,
  LeadSource,
  LeadStatus,
  TutorApplicationStatus,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RateLimitService } from '../common/services/rate-limit.service';
import {
  normalizePhoneNumber,
  normalizeTelegramUsername,
  sanitizeLeadText,
} from '../common/utils/contact.util';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import type { CreateLeadDto, CreateLeadOptions } from './dto/lead.dto';

const GENERIC_SUCCESS = {
  success: true,
  message: 'Request received',
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimit: RateLimitService,
  ) {}

  async createPublicLead(dto: CreateLeadDto, options: CreateLeadOptions) {
    if (dto.website?.trim()) {
      throw new BadRequestException('Invalid submission');
    }

    this.rateLimit.check(`lead:ip:${options.ipHash ?? 'unknown'}`, 10, 60_000);
    this.rateLimit.check(`lead:tutor:${options.tutorId}`, 20, 60_000);

    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: options.tutorId },
    });

    if (
      !tutor ||
      tutor.applicationStatus !== TutorApplicationStatus.APPROVED ||
      !tutor.isAcceptingStudents ||
      !tutor.acceptsDirectRequests
    ) {
      return GENERIC_SUCCESS;
    }

    const studentName = sanitizeLeadText(dto.studentName, 80);
    const contactValue =
      dto.contactType === LeadContactType.TELEGRAM
        ? normalizeTelegramUsername(dto.contactValue)
        : normalizePhoneNumber(dto.contactValue);

    const duplicateSince = new Date(Date.now() - 5 * 60_000);
    const duplicate = await this.prisma.tutorLead.findFirst({
      where: {
        tutorId: tutor.id,
        studentName,
        contactType: dto.contactType,
        contactValue,
        createdAt: { gte: duplicateSince },
      },
      select: { id: true },
    });
    if (duplicate) {
      return GENERIC_SUCCESS;
    }

    await this.prisma.tutorLead.create({
      data: {
        tutorId: tutor.id,
        studentUserId: options.studentUserId,
        studentName,
        contactType: dto.contactType,
        contactValue,
        subject: dto.subject ? sanitizeLeadText(dto.subject, 100) : null,
        goal: dto.goal ? sanitizeLeadText(dto.goal, 300) : null,
        message: dto.message ? sanitizeLeadText(dto.message, 1000) : null,
        preferredTime: dto.preferredTime
          ? sanitizeLeadText(dto.preferredTime, 200)
          : null,
        source: options.source ?? LeadSource.TUTOR_PROFILE,
        ipHash: options.ipHash,
        userAgent: options.userAgent?.slice(0, 500),
      },
    });

    await this.prisma.tutorContactEvent.create({
      data: {
        tutorId: tutor.id,
        type: ContactEventType.LEAD_SUBMITTED,
        ipHash: options.ipHash,
      },
    });

    return GENERIC_SUCCESS;
  }

  async listMyLeads(
    user: AuthUser,
    query: { status?: LeadStatus; page?: number; limit?: number },
  ) {
    const tutor = await this.requireTutor(user.id);
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = {
      tutorId: tutor.id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.tutorLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.tutorLead.count({ where }),
    ]);

    return {
      items: items.map((lead) => this.serializeLead(lead)),
      total,
      page,
      limit,
    };
  }

  async getMyLead(user: AuthUser, leadId: string) {
    const tutor = await this.requireTutor(user.id);
    const lead = await this.prisma.tutorLead.findFirst({
      where: { id: leadId, tutorId: tutor.id },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return this.serializeLead(lead);
  }

  async updateLeadStatus(user: AuthUser, leadId: string, status: LeadStatus) {
    const tutor = await this.requireTutor(user.id);
    const lead = await this.prisma.tutorLead.findFirst({
      where: { id: leadId, tutorId: tutor.id },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    const now = new Date();
    const updated = await this.prisma.tutorLead.update({
      where: { id: lead.id },
      data: {
        status,
        viewedAt:
          status === LeadStatus.VIEWED && !lead.viewedAt ? now : lead.viewedAt,
        contactedAt:
          status === LeadStatus.CONTACTED && !lead.contactedAt
            ? now
            : lead.contactedAt,
        closedAt:
          status === LeadStatus.CLOSED || status === LeadStatus.SPAM
            ? now
            : lead.closedAt,
      },
    });

    return this.serializeLead(updated);
  }

  async getLeadMetrics(user: AuthUser) {
    const tutor = await this.requireTutor(user.id);
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      profileViews,
      telegramClicks,
      phoneClicks,
      totalRequests,
      newRequests,
    ] = await Promise.all([
      this.prisma.tutorProfileView.count({
        where: { tutorProfileId: tutor.id },
      }),
      this.prisma.tutorContactEvent.count({
        where: {
          tutorId: tutor.id,
          type: ContactEventType.TELEGRAM_CLICK,
        },
      }),
      this.prisma.tutorContactEvent.count({
        where: {
          tutorId: tutor.id,
          type: ContactEventType.PHONE_CLICK,
        },
      }),
      this.prisma.tutorLead.count({ where: { tutorId: tutor.id } }),
      this.prisma.tutorLead.count({
        where: { tutorId: tutor.id, status: LeadStatus.NEW },
      }),
    ]);

    return {
      profileViews,
      telegramClicks,
      phoneClicks,
      totalRequests,
      newRequests,
      profileViewsThisWeek: await this.prisma.tutorProfileView.count({
        where: { tutorProfileId: tutor.id, createdAt: { gte: weekStart } },
      }),
    };
  }

  async recordContactClick(
    tutorId: string,
    type: 'TELEGRAM_CLICK' | 'PHONE_CLICK',
    ipHash?: string,
  ) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorId },
      select: {
        id: true,
        applicationStatus: true,
        isAcceptingStudents: true,
        showTelegramPublicly: true,
        showPhonePublicly: true,
        telegramUsername: true,
        phone: true,
      },
    });

    if (
      !tutor ||
      tutor.applicationStatus !== TutorApplicationStatus.APPROVED ||
      !tutor.isAcceptingStudents
    ) {
      throw new NotFoundException('Tutor not found');
    }

    if (
      type === 'TELEGRAM_CLICK' &&
      (!tutor.showTelegramPublicly || !tutor.telegramUsername)
    ) {
      throw new NotFoundException('Contact not available');
    }

    if (
      type === 'PHONE_CLICK' &&
      (!tutor.showPhonePublicly || !tutor.phone)
    ) {
      throw new NotFoundException('Contact not available');
    }

    await this.prisma.tutorContactEvent.create({
      data: { tutorId: tutor.id, type, ipHash },
    });

    return { success: true };
  }

  hashIp(ip?: string) {
    if (!ip) return undefined;
    return createHash('sha256').update(ip).digest('hex');
  }

  private serializeLead(lead: {
    id: string;
    studentName: string;
    contactType: LeadContactType;
    contactValue: string;
    subject: string | null;
    goal: string | null;
    message: string | null;
    preferredTime: string | null;
    status: LeadStatus;
    source: LeadSource;
    createdAt: Date;
    viewedAt: Date | null;
    contactedAt: Date | null;
    closedAt: Date | null;
  }) {
    return {
      id: lead.id,
      studentName: lead.studentName,
      contactType: lead.contactType,
      contactValue: lead.contactValue,
      subject: lead.subject,
      goal: lead.goal,
      message: lead.message,
      preferredTime: lead.preferredTime,
      status: lead.status,
      source: lead.source,
      createdAt: lead.createdAt.toISOString(),
      viewedAt: lead.viewedAt?.toISOString() ?? null,
      contactedAt: lead.contactedAt?.toISOString() ?? null,
      closedAt: lead.closedAt?.toISOString() ?? null,
    };
  }

  private async requireTutor(userId: string) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!tutor) {
      throw new NotFoundException('Tutor profile not found');
    }
    return tutor;
  }
}
