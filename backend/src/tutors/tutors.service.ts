import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TutorsService {
  constructor(private prisma: PrismaService) {}

  async listTutors(excludeUserId?: string) {
    let excludeTutorProfileId: string | undefined;
    if (excludeUserId) {
      const profile = await this.prisma.tutorProfile.findUnique({
        where: { userId: excludeUserId },
        select: { id: true },
      });
      excludeTutorProfileId = profile?.id;
    }

    const tutors = await this.prisma.tutorProfile.findMany({
      where: {
        isAcceptingStudents: true,
        ...(excludeTutorProfileId
          ? { id: { not: excludeTutorProfileId } }
          : {}),
      },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true }, take: 3 },
      },
      orderBy: [{ ratingAvg: 'desc' }, { lessonsCompleted: 'desc' }],
    });

    return tutors.map((tutor) => this.serializeTutor(tutor));
  }

  async getTutor(tutorProfileId: string) {
    const tutor = await this.prisma.tutorProfile.findUnique({
      where: { id: tutorProfileId },
      include: {
        user: { select: { id: true, timezone: true } },
        subjects: { include: { subject: true } },
      },
    });

    if (!tutor) {
      throw new NotFoundException('Tutor not found');
    }

    return this.serializeTutor(tutor, true);
  }

  private serializeTutor(
    tutor: {
      id: string;
      userId: string;
      displayName: string;
      headline: string | null;
      bio: string;
      avatarUrl: string | null;
      defaultHourlyRateCents: number;
      defaultCurrency: string;
      ratingAvg: number;
      ratingCount: number;
      lessonsCompleted: number;
      experienceYears: number | null;
      education: string | null;
      country: string | null;
      city: string | null;
      verificationStatus: string;
      user: { id: string; timezone: string };
      subjects: Array<{
        subject: { id: string; name: string; slug: string };
        hourlyRateCents: number;
      }>;
    },
    detailed = false,
  ) {
    const primarySubject = tutor.subjects[0]?.subject.name ?? 'General';

    return {
      id: tutor.id,
      userId: tutor.userId,
      displayName: tutor.displayName,
      headline: tutor.headline,
      bio: tutor.bio,
      avatarUrl: tutor.avatarUrl,
      subject: primarySubject,
      subjects: tutor.subjects.map((s) => ({
        id: s.subject.id,
        name: s.subject.name,
        slug: s.subject.slug,
        hourlyRateCents: s.hourlyRateCents,
      })),
      defaultHourlyRateCents: tutor.defaultHourlyRateCents,
      defaultCurrency: tutor.defaultCurrency,
      rating: tutor.ratingAvg,
      reviews: tutor.ratingCount,
      lessonsCompleted: tutor.lessonsCompleted,
      experienceYears: tutor.experienceYears,
      education: tutor.education,
      country: tutor.country,
      city: tutor.city,
      verified: tutor.verificationStatus === 'VERIFIED',
      timezone: tutor.user.timezone,
      ...(detailed ? { fullBio: tutor.bio } : {}),
    };
  }
}
