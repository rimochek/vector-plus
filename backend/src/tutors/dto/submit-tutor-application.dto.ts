import { IsBoolean, IsOptional } from 'class-validator';

export class SubmitTutorApplicationDto {
  @IsOptional()
  @IsBoolean()
  confirmAccurate?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;
}
