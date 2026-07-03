import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VerificationStatus } from '@prisma/client';

export class ReviewVerificationDocumentDto {
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
