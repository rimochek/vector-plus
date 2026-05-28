import { Injectable, NotFoundException } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async listForUser(userId: string) {
    const items = await this.prisma.notification.findMany({
      where: { userId, channel: NotificationChannel.IN_APP },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return items.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      read: Boolean(n.readAt),
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        channel: NotificationChannel.IN_APP,
        readAt: null,
      },
    });
  }

  async markRead(userId: string, notificationId: string) {
    const item = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!item) throw new NotFoundException('Notification not found');

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });
    return { success: true };
  }

  async createInApp(
    userId: string,
    type: string,
    title: string,
    body?: string,
    data?: Prisma.InputJsonValue,
  ) {
    return this.prisma.notification.create({
      data: {
        userId,
        channel: NotificationChannel.IN_APP,
        status: NotificationStatus.SENT,
        type,
        title,
        body,
        data,
      },
    });
  }

  async notifyLessonCancelled(params: {
    recipientUserId: string;
    cancelledByName: string;
    lessonId: string;
    scheduledStartAt: Date;
    subject: string;
    reasonText: string;
  }) {
    const when = params.scheduledStartAt.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return this.createInApp(
      params.recipientUserId,
      'lesson.cancelled',
      'Lesson cancelled',
      `${params.cancelledByName} cancelled the ${params.subject} lesson on ${when}. Reason: ${params.reasonText}`,
      {
        lessonId: params.lessonId,
        scheduledStartAt: params.scheduledStartAt.toISOString(),
        subject: params.subject,
        reason: params.reasonText,
      },
    );
  }

  private formatLessonWhen(date: Date) {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  async notifyLessonRequested(params: {
    tutorUserId: string;
    studentName: string;
    lessonId: string;
    scheduledStartAt: Date;
    subject: string;
    studentMessage?: string | null;
  }) {
    const when = this.formatLessonWhen(params.scheduledStartAt);
    const note = params.studentMessage?.trim()
      ? ` Message: "${params.studentMessage.trim()}"`
      : '';

    return this.createInApp(
      params.tutorUserId,
      'lesson.requested',
      'New lesson request',
      `${params.studentName} requested a ${params.subject} lesson on ${when}.${note} Please approve or decline.`,
      {
        lessonId: params.lessonId,
        scheduledStartAt: params.scheduledStartAt.toISOString(),
        subject: params.subject,
      },
    );
  }

  async notifyLessonApproved(params: {
    studentUserId: string;
    tutorName: string;
    lessonId: string;
    scheduledStartAt: Date;
    subject: string;
  }) {
    const when = this.formatLessonWhen(params.scheduledStartAt);

    return this.createInApp(
      params.studentUserId,
      'lesson.approved',
      'Lesson confirmed',
      `${params.tutorName} accepted your ${params.subject} lesson on ${when}.`,
      {
        lessonId: params.lessonId,
        scheduledStartAt: params.scheduledStartAt.toISOString(),
        subject: params.subject,
      },
    );
  }

  async notifyLessonRejected(params: {
    studentUserId: string;
    tutorName: string;
    lessonId: string;
    scheduledStartAt: Date;
    subject: string;
  }) {
    const when = this.formatLessonWhen(params.scheduledStartAt);

    return this.createInApp(
      params.studentUserId,
      'lesson.rejected',
      'Lesson request declined',
      `${params.tutorName} is not available for the ${params.subject} lesson on ${when}.`,
      {
        lessonId: params.lessonId,
        scheduledStartAt: params.scheduledStartAt.toISOString(),
        subject: params.subject,
      },
    );
  }
}
