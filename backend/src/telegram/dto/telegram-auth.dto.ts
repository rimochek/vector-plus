import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class TelegramAuthDto {
  @IsString()
  @MinLength(20)
  initData: string;

  @IsOptional()
  @IsIn(['STUDENT', 'TUTOR'])
  intendedRole?: 'STUDENT' | 'TUTOR';
}

export class TelegramWidgetAuthDto {
  @Type(() => Number)
  @IsInt()
  id: number;

  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  photo_url?: string;

  @Type(() => Number)
  @IsInt()
  auth_date: number;

  @IsString()
  hash: string;

  @IsOptional()
  @IsIn(['STUDENT', 'TUTOR'])
  intendedRole?: 'STUDENT' | 'TUTOR';
}
