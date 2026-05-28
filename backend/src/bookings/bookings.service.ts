import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { LessonStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CancelBookingDto,
  CancelBookingReason,
  cancelReasonFromPrisma,
  cancelReasonLabel,
  cancelReasonToPrisma,
  STUDENT_CANCEL_REASONS,
  TUTOR_CANCEL_REASONS,
} from './dto/cancel-booking.dto';
import { parseLearningGoals } from '../common/learning-goals.util';

export type BookingViewStatus = 'upcoming' | 'completed' | 'cancelled' | 'pending';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
    private notificationsService: NotificationsService,
  ) {}

  private mapStatus(
    status: LessonStatus,
    scheduledStartAt: Date,
  ): BookingViewStatus {
    if (status === LessonStatus.CANCELLED) return 'cancelled';
    if (status === LessonStatus.COMPLETED) return 'completed';
    if (status === LessonStatus.PENDING_APPROVAL) return 'pending';
    if (
      status === LessonStatus.SCHEDULED ||
      status === LessonStatus.IN_PROGRESS ||
      status === LessonStatus.PENDING_PAYMENT
    ) {
      return scheduledStartAt < new Date() && status !== LessonStatus.IN_PROGRESS
        ? 'completed'
        : 'upcoming';
    }
    return 'upcoming';
  }

  private serializeBooking(
    lesson: {
      id: string;
      status: LessonStatus;
      scheduledStartAt: Date;
      scheduledEndAt: Date;
      durationMinutes: number;
      priceCents: number;
      currency: string;
      studentMessage: string | null;
      meetingUrl: string | null;
      cancellationReason?: string | null;
      cancellationReasonOther?: string | null;
      cancelledAt?: Date | null;
      cancelledByUserId?: string | null;
      studentProfile: { id: string; displayName: string; userId: string; learningGoals?: string | null };
      tutorProfile: { id: string; displayName: string; userId: string };
      subject: { name: string } | null;
    },
    perspective: 'tutor' | 'student',
  ) {
    const reason = cancelReasonFromPrisma(lesson.cancellationReason ?? null);
    const { text: learningGoalsText, tags } = parseLearningGoals(
      lesson.studentProfile.learningGoals,
    );

    return {
      id: lesson.id,
      status: this.mapStatus(lesson.status, lesson.scheduledStartAt),
      dbStatus: lesson.status,
      scheduledStartAt: lesson.scheduledStartAt.toISOString(),
      scheduledEndAt: lesson.scheduledEndAt.toISOString(),
      durationMinutes: lesson.durationMinutes,
      priceCents: lesson.priceCents,
      currency: lesson.currency,
      studentMessage: lesson.studentMessage,
      meetingUrl: lesson.meetingUrl,
      subject: lesson.subject?.name ?? 'General',
      cancellationReason: reason,
      cancellationReasonOther: lesson.cancellationReasonOther ?? null,
      cancellationReasonLabel: reason
        ? cancelReasonLabel(reason, lesson.cancellationReasonOther)
        : null,
      cancelledAt: lesson.cancelledAt?.toISOString() ?? null,
      cancelledByUserId: lesson.cancelledByUserId ?? null,
      studentPreferences: {
        message: lesson.studentMessage,
        learningGoals: learningGoalsText || null,
        topics: tags,
      },
      counterpartyName:
        perspective === 'tutor'
          ? lesson.studentProfile.displayName
          : lesson.tutorProfile.displayName,
      counterpartyId:
        perspective === 'tutor'
          ? lesson.studentProfile.id
          : lesson.tutorProfile.id,
      counterpartyUserId:
        perspective === 'tutor'
          ? lesson.studentProfile.userId
          : lesson.tutorProfile.userId,
      studentName: lesson.studentProfile.displayName,
      tutorName: lesson.tutorProfile.displayName,
    };
  }

  async createBooking(user: AuthUser, dto: CreateBookingDto) {
    if (!user.roles.includes(UserRole.STUDENT)) {
      throw new ForbiddenException('Only students can book sessions');
    }

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });
    if (!studentProfile) {
      throw new ForbiddenException('Student profile required');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: dto.availabilitySlotId },
        include: { tutorProfile: true, lesson: true },
      });

      if (!slot || !slot.isAvailable || slot.lesson) {
        throw new BadRequestException('Slot is no longer available');
      }

      const durationMinutes = Math.round(
        (slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000,
      );

      const lesson = await tx.lesson.create({
        data: {
          tutorProfileId: slot.tutorProfileId,
          studentProfileId: studentProfile.id,
          availabilitySlotId: slot.id,
          status: LessonStatus.PENDING_APPROVAL,
          scheduledStartAt: slot.startsAt,
          scheduledEndAt: slot.endsAt,
          durationMinutes,
          priceCents: slot.tutorProfile.defaultHourlyRateCents,
          currency: slot.tutorProfile.defaultCurrency,
          studentMessage: dto.studentMessage?.trim() || null,
        },
        include: {
          studentProfile: true,
          tutorProfile: true,
          subject: true,
        },
      });

      await tx.availabilitySlot.update({
        where: { id: slot.id },
        data: { isAvailable: false },
      });

      await this.chatService.ensureDirectConversation(
        slot.tutorProfileId,
        studentProfile.id,
        tx,
      );

      return { lesson, tutorUserId: slot.tutorProfile.userId, slotStart: slot.startsAt };
    });

    await this.notificationsService.notifyLessonRequested({
      tutorUserId: result.tutorUserId,
      studentName: studentProfile.displayName,
      lessonId: result.lesson.id,
      scheduledStartAt: result.slotStart,
      subject: result.lesson.subject?.name ?? 'General',
      studentMessage: dto.studentMessage?.trim() || null,
    });

    return this.serializeBooking(result.lesson, 'student');
  }

  async approveBooking(user: AuthUser, bookingId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });
    if (!tutorProfile) {
      throw new ForbiddenException('Tutor profile required');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: bookingId },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
      },
    });

    if (!lesson || lesson.tutorProfileId !== tutorProfile.id) {
      throw new NotFoundException('Booking not found');
    }

    if (lesson.status !== LessonStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Booking is not awaiting approval');
    }

    const updated = await this.prisma.lesson.update({
      where: { id: bookingId },
      data: { status: LessonStatus.SCHEDULED },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
      },
    });

    await this.notificationsService.notifyLessonApproved({
      studentUserId: lesson.studentProfile.userId,
      tutorName: lesson.tutorProfile.displayName,
      lessonId: lesson.id,
      scheduledStartAt: lesson.scheduledStartAt,
      subject: lesson.subject?.name ?? 'General',
    });

    return this.serializeBooking(updated, 'tutor');
  }

  async rejectBooking(user: AuthUser, bookingId: string) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });
    if (!tutorProfile) {
      throw new ForbiddenException('Tutor profile required');
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: bookingId },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
        availabilitySlot: true,
      },
    });

    if (!lesson || lesson.tutorProfileId !== tutorProfile.id) {
      throw new NotFoundException('Booking not found');
    }

    if (lesson.status !== LessonStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Booking is not awaiting approval');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lesson.update({
        where: { id: bookingId },
        data: { status: LessonStatus.CANCELLED, cancelledAt: new Date(), cancelledByUserId: user.id },
        include: {
          studentProfile: true,
          tutorProfile: true,
          subject: true,
        },
      });

      if (lesson.availabilitySlotId) {
        await tx.availabilitySlot.update({
          where: { id: lesson.availabilitySlotId },
          data: { isAvailable: true },
        });
      }

      return result;
    });

    await this.notificationsService.notifyLessonRejected({
      studentUserId: lesson.studentProfile.userId,
      tutorName: lesson.tutorProfile.displayName,
      lessonId: lesson.id,
      scheduledStartAt: lesson.scheduledStartAt,
      subject: lesson.subject?.name ?? 'General',
    });

    return this.serializeBooking(updated, 'tutor');
  }

  async listTutorBookings(user: AuthUser) {
    const tutorProfile = await this.prisma.tutorProfile.findUnique({
      where: { userId: user.id },
    });
    if (!tutorProfile) {
      throw new ForbiddenException('Tutor profile required');
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { tutorProfileId: tutorProfile.id },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
      },
      orderBy: { scheduledStartAt: 'desc' },
    });

    return lessons.map((l) => this.serializeBooking(l, 'tutor'));
  }

  async listStudentBookings(user: AuthUser) {
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });
    if (!studentProfile) {
      throw new ForbiddenException('Student profile required');
    }

    const lessons = await this.prisma.lesson.findMany({
      where: { studentProfileId: studentProfile.id },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
      },
      orderBy: { scheduledStartAt: 'desc' },
    });

    return lessons.map((l) => this.serializeBooking(l, 'student'));
  }

  async getBooking(user: AuthUser, bookingId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: bookingId },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
      },
    });

    if (!lesson) throw new NotFoundException('Booking not found');

    const isTutor = lesson.tutorProfile.userId === user.id;
    const isStudent = lesson.studentProfile.userId === user.id;

    if (!isTutor && !isStudent) {
      throw new ForbiddenException('Access denied');
    }

    return this.serializeBooking(lesson, isTutor ? 'tutor' : 'student');
  }

  async cancelBooking(user: AuthUser, bookingId: string, dto: CancelBookingDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: bookingId },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
        availabilitySlot: true,
      },
    });

    if (!lesson) throw new NotFoundException('Booking not found');

    const isTutor = lesson.tutorProfile.userId === user.id;
    const isStudent = lesson.studentProfile.userId === user.id;
    if (!isTutor && !isStudent) {
      throw new ForbiddenException('Access denied');
    }

    if (lesson.status === LessonStatus.CANCELLED) {
      throw new BadRequestException('Booking already cancelled');
    }

    if (lesson.status === LessonStatus.COMPLETED) {
      throw new BadRequestException('Completed lessons cannot be cancelled');
    }

    if (dto.reason === CancelBookingReason.OTHER && !dto.otherText?.trim()) {
      throw new BadRequestException('Please provide a cancellation reason');
    }

    const allowedReasons = isTutor
      ? TUTOR_CANCEL_REASONS
      : STUDENT_CANCEL_REASONS;
    if (!allowedReasons.includes(dto.reason)) {
      throw new BadRequestException('Invalid cancellation reason');
    }

    const reasonText = cancelReasonLabel(dto.reason, dto.otherText?.trim());

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.lesson.update({
        where: { id: bookingId },
        data: {
          status: LessonStatus.CANCELLED,
          cancellationReason: cancelReasonToPrisma(dto.reason),
          cancellationReasonOther:
            dto.reason === CancelBookingReason.OTHER ? dto.otherText?.trim() : null,
          cancelledAt: new Date(),
          cancelledByUserId: user.id,
        },
        include: {
          studentProfile: true,
          tutorProfile: true,
          subject: true,
        },
      });

      if (lesson.availabilitySlotId) {
        await tx.availabilitySlot.update({
          where: { id: lesson.availabilitySlotId },
          data: { isAvailable: true },
        });
      }

      return result;
    });

    const recipientUserId = isTutor
      ? lesson.studentProfile.userId
      : lesson.tutorProfile.userId;
    const cancelledByName = isTutor
      ? lesson.tutorProfile.displayName
      : lesson.studentProfile.displayName;

    await this.notificationsService.notifyLessonCancelled({
      recipientUserId,
      cancelledByName,
      lessonId: lesson.id,
      scheduledStartAt: lesson.scheduledStartAt,
      subject: lesson.subject?.name ?? 'General',
      reasonText,
    });

    return this.serializeBooking(updated, isTutor ? 'tutor' : 'student');
  }
}
