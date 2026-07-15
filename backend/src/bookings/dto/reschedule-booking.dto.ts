import { IsOptional, IsString, IsUUID } from 'class-validator';

export class RescheduleBookingDto {
  @IsUUID()
  availabilitySlotId: string;

  @IsOptional()
  @IsString()
  studentMessage?: string;
}
