import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTutorProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsString()
  headline?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultHourlyRateCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @IsOptional()
  @IsString()
  @MinLength(2)
  education?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @ValidateIf((_, value) => typeof value === 'string' && value.trim().length > 0)
  @IsUrl({ require_protocol: true })
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  credentials?: { label: string; value: string }[];

  @IsOptional()
  @IsArray()
  verificationDocuments?: {
    type: string;
    fileName: string;
    storageKey: string;
  }[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  lessonFormats?: ('online' | 'offline')[];
}
