import { IsEmail, IsIn, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsIn(['student', 'tutor'])
  role: 'student' | 'tutor';
}
