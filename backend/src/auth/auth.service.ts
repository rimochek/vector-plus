import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import {
  AccountStatus,
  AuthProvider,
  AvatarSource,
  CurrencyCode,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  GOOGLE_EMAIL_LINK_REQUIRED,
  GoogleAuthDto,
} from './dto/google-auth.dto';
import { GoogleAuthService } from './google-auth.service';
import {
  createRefreshTokenValue,
  hashRefreshToken,
} from './refresh-token.util';
import { AdminRoleService } from '../admin/admin-role.service';

function buildLearningGoals(
  lookingFor?: string,
  tags?: string[],
): string | undefined {
  const parts: string[] = [];
  const text = lookingFor?.trim();
  if (text) parts.push(text);
  if (tags?.length) {
    parts.push(`[tags:${tags.join(',')}]`);
  }
  return parts.length > 0 ? parts.join('\n') : undefined;
}

function parseLearningGoals(raw: string | null | undefined): {
  text: string;
  tags: string[];
} {
  if (!raw) return { text: '', tags: [] };
  const match = raw.match(/\[tags:([^\]]+)\]/);
  if (!match) return { text: raw.trim(), tags: [] };
  const tags = match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const text = raw.replace(/\n?\[tags:[^\]]+\]/, '').trim();
  return { text, tags };
}

function serializeAgeChoices(choices?: string[]): string | undefined {
  const ids = choices?.map((s) => s.trim()).filter(Boolean) ?? [];
  return ids.length > 0 ? ids.join(',') : undefined;
}

function parseAgeChoices(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private googleAuthService: GoogleAuthService,
    private adminRoleService: AdminRoleService,
  ) {}

  private get accessTokenTtlSeconds(): number {
    const raw = this.configService.get<string>('JWT_ACCESS_EXPIRATION');
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 900;
  }

  private get refreshTokenTtlMs(): number {
    const raw = this.configService.get<string>('REFRESH_TOKEN_EXPIRATION_DAYS');
    const days = Number(raw);
    const validDays = Number.isFinite(days) && days > 0 ? days : 30;
    return validDays * 24 * 60 * 60 * 1000;
  }

  private signAccessToken(userId: string, email: string): string {
    return this.jwtService.sign(
      { id: userId, email },
      { expiresIn: this.accessTokenTtlSeconds },
    );
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const { raw, hash } = createRefreshTokenValue();
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + this.refreshTokenTtlMs),
      },
    });
    return raw;
  }

  private async issueAuthResponse(userId: string, roleHint?: string) {
    const user = await this.getById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.issueTokenPair(user.id, user.email);
    const userResponse = await this.buildUserResponse(user.id);

    return {
      message: 'Authentication successful',
      access_token: tokens.accessToken,
      refreshTokenMaxAgeMs: tokens.refreshTokenMaxAgeMs,
      refreshToken: tokens.refreshToken,
      user: userResponse
        ? {
            ...userResponse,
            role:
              roleHint ??
              userResponse.role ??
              (user.roles[0]?.role.toLowerCase() as string),
          }
        : null,
    };
  }

  private displayNameFromGoogle(profile: {
    name?: string;
    givenName?: string;
    familyName?: string;
    email: string;
  }): string {
    const fromName = profile.name?.trim();
    if (fromName) return fromName;
    const fromParts = `${profile.givenName ?? ''} ${profile.familyName ?? ''}`.trim();
    if (fromParts) return fromParts;
    return profile.email.split('@')[0] ?? 'Tutora user';
  }

  async authenticateWithGoogle(dto: GoogleAuthDto) {
    const googleProfile = await this.googleAuthService.verifyIdToken(dto.credential);

    const existingIdentity = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.GOOGLE,
          providerAccountId: googleProfile.sub,
        },
      },
      include: { user: true },
    });

    if (existingIdentity?.user && !existingIdentity.user.deletedAt) {
      await this.prisma.user.update({
        where: { id: existingIdentity.userId },
        data: { lastLoginAt: new Date(), emailVerifiedAt: new Date() },
      });
      return this.issueAuthResponse(existingIdentity.userId);
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: googleProfile.email },
      include: { roles: true, authIdentities: true },
    });

    if (existingUser && !existingUser.deletedAt) {
      const hasGoogle = existingUser.authIdentities.some(
        (identity) => identity.provider === AuthProvider.GOOGLE,
      );
      if (hasGoogle) {
        return this.issueAuthResponse(existingUser.id);
      }

      if (this.googleAuthService.isAutoLinkAllowed(googleProfile)) {
        await this.prisma.authIdentity.create({
          data: {
            provider: AuthProvider.GOOGLE,
            providerAccountId: googleProfile.sub,
            providerEmail: googleProfile.email,
            userId: existingUser.id,
          },
        });
        await this.applyGoogleAvatarIfMissing(existingUser.id, googleProfile.picture);
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLoginAt: new Date(), emailVerifiedAt: new Date() },
        });
        return this.issueAuthResponse(existingUser.id);
      }

      throw new ConflictException({
        message:
          'This Google account matches an existing Tutora account. Sign in with email first, then connect Google in account settings.',
        code: GOOGLE_EMAIL_LINK_REQUIRED,
      });
    }

    const intendedRole = dto.intendedRole === 'TUTOR' ? UserRole.TUTOR : UserRole.STUDENT;
    if (
      dto.intendedRole &&
      !['STUDENT', 'TUTOR'].includes(dto.intendedRole)
    ) {
      throw new BadRequestException('Invalid signup role');
    }

    const displayName = this.displayNameFromGoogle(googleProfile);
    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: googleProfile.email,
          passwordHash: null,
          accountStatus: AccountStatus.ACTIVE,
          emailVerifiedAt: new Date(),
          roles: { create: { role: intendedRole } },
          authIdentities: {
            create: {
              provider: AuthProvider.GOOGLE,
              providerAccountId: googleProfile.sub,
              providerEmail: googleProfile.email,
            },
          },
        },
      });

      if (intendedRole === UserRole.STUDENT) {
        await tx.studentProfile.create({
          data: {
            userId: created.id,
            displayName,
            avatarUrl: googleProfile.picture ?? null,
            avatarSource: googleProfile.picture
              ? AvatarSource.GOOGLE
              : AvatarSource.DEFAULT,
            onboardingCompleted: false,
          },
        });
      } else {
        await tx.tutorProfile.create({
          data: {
            userId: created.id,
            displayName,
            bio: 'Profile in progress.',
            defaultHourlyRateCents: 500000,
            defaultCurrency: CurrencyCode.KZT,
            experienceYears: 0,
            education: 'Pending',
            avatarUrl: googleProfile.picture ?? null,
            avatarSource: googleProfile.picture
              ? AvatarSource.GOOGLE
              : AvatarSource.DEFAULT,
            applicationStatus: 'DRAFT',
            isAcceptingStudents: false,
          },
        });
      }

      return created;
    });

    return this.issueAuthResponse(
      user.id,
      intendedRole === UserRole.TUTOR ? 'tutor' : 'student',
    );
  }

  async linkGoogleAccount(userId: string, credential: string) {
    const googleProfile = await this.googleAuthService.verifyIdToken(credential);

    const taken = await this.prisma.authIdentity.findUnique({
      where: {
        provider_providerAccountId: {
          provider: AuthProvider.GOOGLE,
          providerAccountId: googleProfile.sub,
        },
      },
    });

    if (taken && taken.userId !== userId) {
      throw new ConflictException('This Google account is already linked to another user');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { authIdentities: true },
    });
    if (!user || user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    const alreadyLinked = user.authIdentities.some(
      (identity) => identity.provider === AuthProvider.GOOGLE,
    );
    if (alreadyLinked) {
      return { success: true, linked: true };
    }

    await this.prisma.authIdentity.create({
      data: {
        provider: AuthProvider.GOOGLE,
        providerAccountId: googleProfile.sub,
        providerEmail: googleProfile.email,
        userId,
      },
    });

    await this.applyGoogleAvatarIfMissing(userId, googleProfile.picture);

    return { success: true, linked: true };
  }

  private async applyGoogleAvatarIfMissing(userId: string, picture?: string) {
    if (!picture) return;

    const [student, tutor] = await Promise.all([
      this.prisma.studentProfile.findUnique({ where: { userId } }),
      this.prisma.tutorProfile.findUnique({ where: { userId } }),
    ]);

    if (
      student &&
      (!student.avatarUrl || student.avatarSource === AvatarSource.DEFAULT)
    ) {
      await this.prisma.studentProfile.update({
        where: { id: student.id },
        data: {
          avatarUrl: picture,
          avatarSource: AvatarSource.GOOGLE,
        },
      });
    }

    if (
      tutor &&
      (!tutor.avatarUrl || tutor.avatarSource === AvatarSource.DEFAULT)
    ) {
      await this.prisma.tutorProfile.update({
        where: { id: tutor.id },
        data: {
          avatarUrl: picture,
          avatarSource: AvatarSource.GOOGLE,
        },
      });
    }
  }

  private async issueTokenPair(userId: string, email: string) {
    const accessToken = this.signAccessToken(userId, email);
    const refreshToken = await this.createRefreshToken(userId);
    return {
      accessToken,
      refreshToken,
      refreshTokenMaxAgeMs: this.refreshTokenTtlMs,
    };
  }

  async refreshAccessToken(rawRefreshToken: string) {
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt < new Date() ||
      stored.user.deletedAt
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(stored.userId, stored.user.email);
  }

  async revokeRefreshToken(rawRefreshToken: string | undefined): Promise<void> {
    if (!rawRefreshToken) return;

    const tokenHash = hashRefreshToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async signup(createUserDto: CreateUserDto) {
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      minimal,
      about,
      lookingFor,
      tags,
      ageChoices,
      budgetMinCents,
      budgetMaxCents,
      budgetCurrency,
      description,
      experienceYears,
      education,
      country,
      city,
      hourlyRateCents,
    } = createUserDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const isMinimal = Boolean(minimal);

    if (!isMinimal && !ageChoices?.length) {
      throw new BadRequestException('Select at least one age preference');
    }

    const ageRangeStored = serializeAgeChoices(ageChoices);

    if (!isMinimal && role === 'student') {
      if (budgetMinCents == null || budgetMaxCents == null) {
        throw new BadRequestException('Hourly budget range is required');
      }
      if (budgetMaxCents < budgetMinCents) {
        throw new BadRequestException(
          'Maximum budget must be greater than or equal to minimum',
        );
      }
    } else if (!isMinimal && role === 'tutor') {
      if (
        !description?.trim() ||
        experienceYears == null ||
        !education?.trim() ||
        !country?.trim() ||
        !city?.trim() ||
        hourlyRateCents == null
      ) {
        throw new BadRequestException('Complete all tutor profile fields');
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const prismaRole = role === 'tutor' ? UserRole.TUTOR : UserRole.STUDENT;
    const currency = (budgetCurrency ?? 'KZT') as CurrencyCode;

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          accountStatus: AccountStatus.ACTIVE,
          roles: {
            create: { role: prismaRole },
          },
          authIdentities: {
            create: {
              provider: AuthProvider.PASSWORD,
              providerAccountId: email.toLowerCase(),
              providerEmail: email.toLowerCase(),
            },
          },
        },
      });

      if (role === 'student') {
        await tx.studentProfile.create({
          data: {
            userId: created.id,
            displayName,
            bio: about,
            learningGoals: isMinimal
              ? undefined
              : buildLearningGoals(lookingFor, tags),
            budgetMinCents: isMinimal ? null : budgetMinCents,
            budgetMaxCents: isMinimal ? null : budgetMaxCents,
            budgetCurrency: currency,
            preferredTutorAgeRange: isMinimal ? null : ageRangeStored,
            onboardingCompleted: false,
          },
        });
      } else {
        await tx.tutorProfile.create({
          data: {
            userId: created.id,
            displayName,
            bio: isMinimal
              ? 'Profile in progress.'
              : description!.trim(),
            defaultHourlyRateCents: isMinimal ? 500000 : hourlyRateCents!,
            defaultCurrency: CurrencyCode.KZT,
            experienceYears: isMinimal ? 0 : experienceYears,
            education: isMinimal ? 'Pending' : education!.trim(),
            country: isMinimal ? null : country!.trim(),
            city: isMinimal ? null : city!.trim(),
            preferredStudentAgeRange: isMinimal ? null : ageRangeStored,
            searchDocument: tags?.length
              ? JSON.stringify({ tags })
              : undefined,
            applicationStatus: isMinimal ? 'DRAFT' : 'SUBMITTED',
            isAcceptingStudents: !isMinimal,
          },
        });
      }

      return created;
    });

    const tokens = await this.issueTokenPair(user.id, user.email);

    return {
      message: 'User registered successfully',
      access_token: tokens.accessToken,
      refreshTokenMaxAgeMs: tokens.refreshTokenMaxAgeMs,
      refreshToken: tokens.refreshToken,
      user: await this.buildUserResponse(user.id),
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password, role } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { roles: true },
    });

    if (!user || user.deletedAt) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'This account uses Google sign-in. Continue with Google instead.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const expectedRole = role === 'tutor' ? UserRole.TUTOR : UserRole.STUDENT;
    const hasRole = user.roles.some((r) => r.role === expectedRole);

    if (!hasRole) {
      throw new UnauthorizedException(
        role === 'tutor'
          ? 'This account is not registered as a tutor'
          : 'This account is not registered as a student',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokenPair(user.id, user.email);
    const userResponse = await this.buildUserResponse(user.id);

    return {
      message: 'Login successful',
      access_token: tokens.accessToken,
      refreshTokenMaxAgeMs: tokens.refreshTokenMaxAgeMs,
      refreshToken: tokens.refreshToken,
      user: userResponse ? { ...userResponse, role } : null,
    };
  }

  async getById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
        studentProfile: true,
        tutorProfile: true,
      },
    });
  }

  async getCurrentUser(userId: string) {
    return this.buildUserResponse(userId);
  }

  private async buildUserResponse(userId: string) {
    const user = await this.getById(userId);
    if (!user) return null;

    await this.adminRoleService.syncAdminRoleForUser(user.id, user.email);
    const refreshed = await this.getById(userId);
    if (!refreshed) return null;

    const roles = refreshed.roles.map((r) => r.role.toLowerCase());
    const displayName =
      refreshed.studentProfile?.displayName ??
      refreshed.tutorProfile?.displayName ??
      null;

    return {
      id: refreshed.id,
      email: refreshed.email,
      roles,
      role: roles[0] ?? 'student',
      displayName,
      studentProfile: refreshed.studentProfile
        ? (() => {
            const { text, tags } = parseLearningGoals(
              refreshed.studentProfile!.learningGoals,
            );
            return {
              id: refreshed.studentProfile!.id,
              displayName: refreshed.studentProfile!.displayName,
              budgetMinCents: refreshed.studentProfile!.budgetMinCents,
              budgetMaxCents: refreshed.studentProfile!.budgetMaxCents,
              budgetCurrency: refreshed.studentProfile!.budgetCurrency,
              preferredTutorAgeRange:
                refreshed.studentProfile!.preferredTutorAgeRange,
              preferredTutorAgeRanges: parseAgeChoices(
                refreshed.studentProfile!.preferredTutorAgeRange,
              ),
              learningGoals: text || refreshed.studentProfile!.learningGoals,
              tags,
              onboardingCompleted: refreshed.studentProfile!.onboardingCompleted,
              preferredLessonFormat: refreshed.studentProfile!.preferredLessonFormat,
              preferredTimes: refreshed.studentProfile!.preferredTimes,
              learningLevel: refreshed.studentProfile!.learningLevel,
            };
          })()
        : null,
      tutorProfile: refreshed.tutorProfile
        ? (() => {
            let tags: string[] = [];
            try {
              const metadata = refreshed.tutorProfile!.searchDocument
                ? (JSON.parse(refreshed.tutorProfile!.searchDocument) as {
                    tags?: unknown;
                  })
                : {};
              tags = Array.isArray(metadata.tags)
                ? metadata.tags.filter(
                    (tag): tag is string => typeof tag === 'string',
                  )
                : [];
            } catch {
              tags = [];
            }
            return {
              id: refreshed.tutorProfile!.id,
              displayName: refreshed.tutorProfile!.displayName,
              bio: refreshed.tutorProfile!.bio,
              headline: refreshed.tutorProfile!.headline,
              avatarUrl: refreshed.tutorProfile!.avatarUrl,
              defaultHourlyRateCents: refreshed.tutorProfile!.defaultHourlyRateCents,
              experienceYears: refreshed.tutorProfile!.experienceYears,
              education: refreshed.tutorProfile!.education,
              country: refreshed.tutorProfile!.country,
              city: refreshed.tutorProfile!.city,
              applicationStatus: refreshed.tutorProfile!.applicationStatus,
              applicationRejectionReason:
                refreshed.tutorProfile!.applicationRejectionReason,
              applicationSubmittedAt:
                refreshed.tutorProfile!.applicationSubmittedAt?.toISOString() ??
                null,
              preferredStudentAgeRange:
                refreshed.tutorProfile!.preferredStudentAgeRange,
              preferredStudentAgeRanges: parseAgeChoices(
                refreshed.tutorProfile!.preferredStudentAgeRange,
              ),
              tags,
            };
          })()
        : null,
    };
  }
}
