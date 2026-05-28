import {
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AvailabilityRuleType } from '@prisma/client';

export class WeeklyTimeSlotDto {
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  startTime: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime: string;
}

export class WeeklyDayScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyTimeSlotDto)
  slots: WeeklyTimeSlotDto[];
}

export class SaveWeeklyScheduleDto {
  @IsString()
  timezone: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WeeklyDayScheduleDto)
  schedule: WeeklyDayScheduleDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  weeksAhead?: number;
}

export class CreateAvailabilityRuleDto {
  @IsEnum(AvailabilityRuleType)
  ruleType: AvailabilityRuleType;

  @IsString()
  timezone: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;
}

export class CreateAvailabilitySlotDto {
  @IsISO8601()
  startsAt: string;

  @IsISO8601()
  endsAt: string;
}

export class GenerateSlotsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  weeksAhead?: number;
}
