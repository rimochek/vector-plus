import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

function toOptionalInt(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }
  return Math.round(parsed);
}

export class UpdateStudentProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  displayName?: string;

  @IsOptional()
  @IsString()
  lookingFor?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  learningLevel?: string;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @Min(0)
  budgetMinCents?: number;

  @IsOptional()
  @Type(() => Number)
  @Transform(({ value }) => toOptionalInt(value))
  @IsInt()
  @Min(0)
  budgetMaxCents?: number;

  @IsOptional()
  @IsIn(['USD', 'EUR', 'GBP', 'KZT', 'RUB'])
  budgetCurrency?: 'USD' | 'EUR' | 'GBP' | 'KZT' | 'RUB';

  @IsOptional()
  @IsIn(['online', 'offline', 'either', 'unsure'])
  preferredLessonFormat?: string;

  @IsOptional()
  @IsString()
  preferredTimes?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}
