import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  availabilitySlotId: string;

  @IsOptional()
  @IsString()
  studentMessage?: string;
}
