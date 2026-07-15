import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { LeadContactType, LeadSource, LeadStatus } from '@prisma/client';

export class CreateLeadDto {
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  studentName!: string;

  @IsEnum(LeadContactType)
  contactType!: LeadContactType;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  contactValue!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  goal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  preferredTime?: string;

  /** Honeypot — must remain empty */
  @IsOptional()
  @ValidateIf(() => false)
  @IsString()
  website?: string;
}

export class UpdateLeadStatusDto {
  @IsEnum(LeadStatus)
  status!: LeadStatus;
}

export type CreateLeadOptions = {
  tutorId: string;
  source?: LeadSource;
  studentUserId?: string;
  ipHash?: string;
  userAgent?: string;
};
