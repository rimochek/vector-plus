import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  @MinLength(20)
  credential: string;

  @IsOptional()
  @IsIn(['STUDENT', 'TUTOR'])
  intendedRole?: 'STUDENT' | 'TUTOR';
}

export class GoogleLinkDto {
  @IsString()
  @MinLength(20)
  credential: string;
}

export const GOOGLE_EMAIL_LINK_REQUIRED = 'GOOGLE_EMAIL_LINK_REQUIRED';
