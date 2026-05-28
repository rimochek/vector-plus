import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export enum CancelBookingReason {
  FAMILY = 'family',
  CANT_AT_TIME = 'cant_at_time',
  FOUND_ANOTHER = 'found_another',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  OTHER = 'other',
}

export class CancelBookingDto {
  @IsEnum(CancelBookingReason)
  reason!: CancelBookingReason;

  @ValidateIf((dto: CancelBookingDto) => dto.reason === CancelBookingReason.OTHER)
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  otherText?: string;
}

export const CANCEL_REASON_LABELS: Record<CancelBookingReason, string> = {
  [CancelBookingReason.FAMILY]: 'Family occurrence',
  [CancelBookingReason.CANT_AT_TIME]: "I can't at this time",
  [CancelBookingReason.FOUND_ANOTHER]: 'Found another tutor',
  [CancelBookingReason.SCHEDULE_CONFLICT]: 'Schedule conflict',
  [CancelBookingReason.OTHER]: 'Other',
};

export const TUTOR_CANCEL_REASONS: CancelBookingReason[] = [
  CancelBookingReason.FAMILY,
  CancelBookingReason.CANT_AT_TIME,
  CancelBookingReason.SCHEDULE_CONFLICT,
  CancelBookingReason.OTHER,
];

export const STUDENT_CANCEL_REASONS: CancelBookingReason[] = [
  CancelBookingReason.FAMILY,
  CancelBookingReason.CANT_AT_TIME,
  CancelBookingReason.FOUND_ANOTHER,
  CancelBookingReason.OTHER,
];

export function cancelReasonToPrisma(
  reason: CancelBookingReason,
): 'FAMILY' | 'CANT_AT_TIME' | 'FOUND_ANOTHER' | 'SCHEDULE_CONFLICT' | 'OTHER' {
  const map = {
    [CancelBookingReason.FAMILY]: 'FAMILY',
    [CancelBookingReason.CANT_AT_TIME]: 'CANT_AT_TIME',
    [CancelBookingReason.FOUND_ANOTHER]: 'FOUND_ANOTHER',
    [CancelBookingReason.SCHEDULE_CONFLICT]: 'SCHEDULE_CONFLICT',
    [CancelBookingReason.OTHER]: 'OTHER',
  } as const;
  return map[reason];
}

export function cancelReasonFromPrisma(
  reason: string | null | undefined,
): CancelBookingReason | null {
  if (!reason) return null;
  const map: Record<string, CancelBookingReason> = {
    FAMILY: CancelBookingReason.FAMILY,
    CANT_AT_TIME: CancelBookingReason.CANT_AT_TIME,
    FOUND_ANOTHER: CancelBookingReason.FOUND_ANOTHER,
    SCHEDULE_CONFLICT: CancelBookingReason.SCHEDULE_CONFLICT,
    OTHER: CancelBookingReason.OTHER,
  };
  return map[reason] ?? null;
}

export function cancelReasonLabel(
  reason: CancelBookingReason | null,
  otherText?: string | null,
): string {
  if (!reason) return '';
  if (reason === CancelBookingReason.OTHER && otherText?.trim()) {
    return otherText.trim();
  }
  return CANCEL_REASON_LABELS[reason];
}
