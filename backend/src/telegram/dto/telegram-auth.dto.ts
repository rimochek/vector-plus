import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class TelegramAuthDto {
  @IsString()
  @MinLength(20)
  initData: string;

  @IsOptional()
  @IsIn(['STUDENT', 'TUTOR'])
  intendedRole?: 'STUDENT' | 'TUTOR';
}
