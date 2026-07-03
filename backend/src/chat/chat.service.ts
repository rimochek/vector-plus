import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ConversationType,
  LessonStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { parseLearningGoals } from '../common/learning-goals.util';
import {
  cancelReasonFromPrisma,
  cancelReasonLabel,
} from '../bookings/dto/cancel-booking.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async ensureDirectConversation(
    tutorProfileId: string,
    studentProfileId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const db = tx ?? this.prisma;

    const existing = await db.conversation.findUnique({
      where: {
        tutorProfileId_studentProfileId: {
          tutorProfileId,
          studentProfileId,
        },
      },
    });

    if (existing) return existing;

    const tutor = await db.tutorProfile.findUnique({
      where: { id: tutorProfileId },
    });
    const student = await db.studentProfile.findUnique({
      where: { id: studentProfileId },
    });

    if (!tutor || !student) {
      throw new NotFoundException('Participants not found');
    }

    return db.conversation.create({
      data: {
        type: ConversationType.DIRECT,
        tutorProfileId,
        studentProfileId,
        participants: {
          create: [
            { userId: tutor.userId },
            { userId: student.userId },
          ],
        },
      },
    });
  }

  async listConversations(user: AuthUser) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId: user.id } },
      },
      include: {
        tutorProfile: { select: { id: true, displayName: true, userId: true } },
        studentProfile: { select: { id: true, displayName: true, userId: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        participants: {
          where: { userId: user.id },
          select: { lastReadAt: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((c) => {
      const lastMessage = c.messages[0];
      const isTutor = user.roles.includes(UserRole.TUTOR);
      const counterparty = isTutor ? c.studentProfile : c.tutorProfile;
      const lastReadAt = c.participants[0]?.lastReadAt;
      const unread =
        lastMessage &&
        lastMessage.senderId !== user.id &&
        (!lastReadAt || lastMessage.createdAt > lastReadAt);

      return {
        id: c.id,
        counterpartyName: counterparty?.displayName ?? 'Unknown',
        counterpartyId: counterparty?.id,
        counterpartyUserId: counterparty?.userId,
        lastMessage: lastMessage
          ? {
              content: lastMessage.body,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt.toISOString(),
            }
          : null,
        unread: Boolean(unread),
        updatedAt: c.updatedAt.toISOString(),
      };
    });
  }

  async getOrCreateConversation(user: AuthUser, tutorProfileId: string) {
    if (!user.roles.includes(UserRole.STUDENT)) {
      throw new ForbiddenException('Only students can start conversations');
    }

    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
    });
    if (!studentProfile) {
      throw new ForbiddenException('Student profile required');
    }

    const conversation = await this.ensureDirectConversation(
      tutorProfileId,
      studentProfile.id,
    );

    return { id: conversation.id };
  }

  private async assertParticipant(conversationId: string, userId: string) {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
    });
    if (!participant) {
      throw new ForbiddenException('Access denied');
    }
    return participant;
  }

  async getMessages(user: AuthUser, conversationId: string, since?: string) {
    await this.assertParticipant(conversationId, user.id);

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        ...(since ? { createdAt: { gt: new Date(since) } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: since ? 100 : 200,
    });

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
      data: { lastReadAt: new Date() },
    });

    return messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      content: m.body,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async sendMessage(
    user: AuthUser,
    conversationId: string,
    content: string,
  ) {
    await this.assertParticipant(conversationId, user.id);

    const message = await this.prisma.$transaction(async (tx) => {
      const created = await tx.message.create({
        data: {
          conversationId,
          senderId: user.id,
          body: content.trim(),
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return created;
    });

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        tutorProfile: { select: { userId: true, displayName: true } },
        studentProfile: { select: { userId: true, displayName: true } },
      },
    });

    if (conversation) {
      const isTutorSender = user.roles.includes(UserRole.TUTOR);
      const senderName = isTutorSender
        ? (conversation.tutorProfile?.displayName ?? 'Tutor')
        : (conversation.studentProfile?.displayName ?? 'Student');
      const recipientUserId = isTutorSender
        ? conversation.studentProfile?.userId
        : conversation.tutorProfile?.userId;

      if (recipientUserId) {
        await this.notificationsService.notifyNewMessage({
          recipientUserId,
          senderName,
          conversationId,
          preview: content.trim(),
        });
      }
    }

    return {
      id: message.id,
      senderId: message.senderId,
      content: message.body,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private mapLessonStatus(
    status: LessonStatus,
    scheduledStartAt: Date,
  ): 'upcoming' | 'completed' | 'cancelled' | 'pending' {
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

  async listConversationLessons(user: AuthUser, conversationId: string) {
    await this.assertParticipant(conversationId, user.id);

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation?.tutorProfileId || !conversation.studentProfileId) {
      throw new NotFoundException('Conversation not found');
    }

    const lessons = await this.prisma.lesson.findMany({
      where: {
        tutorProfileId: conversation.tutorProfileId,
        studentProfileId: conversation.studentProfileId,
      },
      include: {
        studentProfile: true,
        tutorProfile: true,
        subject: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const isTutor = user.roles.includes(UserRole.TUTOR);

    return lessons.map((lesson) => {
      const reason = cancelReasonFromPrisma(lesson.cancellationReason ?? null);
      const { text: learningGoalsText, tags } = parseLearningGoals(
        lesson.studentProfile.learningGoals,
      );

      return {
        id: lesson.id,
        kind: 'lesson' as const,
        status: this.mapLessonStatus(lesson.status, lesson.scheduledStartAt),
        dbStatus: lesson.status,
        scheduledStartAt: lesson.scheduledStartAt.toISOString(),
        scheduledEndAt: lesson.scheduledEndAt.toISOString(),
        durationMinutes: lesson.durationMinutes,
        subject: lesson.subject?.name ?? 'General',
        studentMessage: lesson.studentMessage,
        studentPreferences: {
          message: lesson.studentMessage,
          learningGoals: learningGoalsText || null,
          topics: tags,
        },
        cancellationReason: reason,
        cancellationReasonLabel: reason
          ? cancelReasonLabel(reason, lesson.cancellationReasonOther)
          : null,
        cancelledAt: lesson.cancelledAt?.toISOString() ?? null,
        cancelledByUserId: lesson.cancelledByUserId ?? null,
        createdAt: lesson.createdAt.toISOString(),
        tutorName: lesson.tutorProfile.displayName,
        studentName: lesson.studentProfile.displayName,
        counterpartyName: isTutor
          ? lesson.studentProfile.displayName
          : lesson.tutorProfile.displayName,
      };
    });
  }
}
