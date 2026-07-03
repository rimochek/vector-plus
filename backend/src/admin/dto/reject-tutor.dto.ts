import { IsString, MinLength } from 'class-validator';

export class RejectTutorDto {
  @IsString()
  @MinLength(3)
  reason!: string;
}
