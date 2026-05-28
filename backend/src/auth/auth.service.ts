import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import {
  AccountStatus,
  CurrencyCode,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import {
  createRefreshTokenValue,
  hashRefreshToken,
} from './refresh-token.util';

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

    if (!ageChoices?.length) {
      throw new BadRequestException('Select at least one age preference');
    }

    const ageRangeStored = serializeAgeChoices(ageChoices);

    if (role === 'student') {
      if (budgetMinCents == null || budgetMaxCents == null) {
        throw new BadRequestException('Hourly budget range is required');
      }
      if (budgetMaxCents < budgetMinCents) {
        throw new BadRequestException(
          'Maximum budget must be greater than or equal to minimum',
        );
      }
    } else {
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
        },
      });

      if (role === 'student') {
        await tx.studentProfile.create({
          data: {
            userId: created.id,
            displayName,
            bio: about,
            learningGoals: buildLearningGoals(lookingFor, tags),
            budgetMinCents,
            budgetMaxCents,
            budgetCurrency: currency,
            preferredTutorAgeRange: ageRangeStored,
          },
        });
      } else {
        await tx.tutorProfile.create({
          data: {
            userId: created.id,
            displayName,
            bio: description!.trim(),
            defaultHourlyRateCents: hourlyRateCents!,
            defaultCurrency: CurrencyCode.KZT,
            experienceYears,
            education: education!.trim(),
            country: country!.trim(),
            city: city!.trim(),
            preferredStudentAgeRange: ageRangeStored,
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

    const roles = user.roles.map((r) => r.role.toLowerCase());
    const displayName =
      user.studentProfile?.displayName ??
      user.tutorProfile?.displayName ??
      null;

    return {
      id: user.id,
      email: user.email,
      roles,
      role: roles[0] ?? 'student',
      displayName,
      studentProfile: user.studentProfile
        ? (() => {
            const { text, tags } = parseLearningGoals(
              user.studentProfile.learningGoals,
            );
            return {
              id: user.studentProfile.id,
              displayName: user.studentProfile.displayName,
              budgetMinCents: user.studentProfile.budgetMinCents,
              budgetMaxCents: user.studentProfile.budgetMaxCents,
              budgetCurrency: user.studentProfile.budgetCurrency,
              preferredTutorAgeRange:
                user.studentProfile.preferredTutorAgeRange,
              preferredTutorAgeRanges: parseAgeChoices(
                user.studentProfile.preferredTutorAgeRange,
              ),
              learningGoals: text || user.studentProfile.learningGoals,
              tags,
            };
          })()
        : null,
      tutorProfile: user.tutorProfile
        ? {
            id: user.tutorProfile.id,
            displayName: user.tutorProfile.displayName,
            bio: user.tutorProfile.bio,
            defaultHourlyRateCents: user.tutorProfile.defaultHourlyRateCents,
            experienceYears: user.tutorProfile.experienceYears,
            education: user.tutorProfile.education,
            country: user.tutorProfile.country,
            city: user.tutorProfile.city,
            preferredStudentAgeRange:
              user.tutorProfile.preferredStudentAgeRange,
            preferredStudentAgeRanges: parseAgeChoices(
              user.tutorProfile.preferredStudentAgeRange,
            ),
          }
        : null,
    };
  }
}
