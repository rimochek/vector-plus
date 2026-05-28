import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsIn(['student', 'tutor'])
  role: 'student' | 'tutor';

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  lookingFor?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ageChoices?: string[];

  @ValidateIf((o) => o.role === 'student')
  @IsInt()
  @Min(0)
  budgetMinCents?: number;

  @ValidateIf((o) => o.role === 'student')
  @IsInt()
  @Min(0)
  budgetMaxCents?: number;

  @IsOptional()
  @IsIn(['USD', 'EUR', 'GBP', 'KZT', 'RUB'])
  budgetCurrency?: 'USD' | 'EUR' | 'GBP' | 'KZT' | 'RUB';

  @ValidateIf((o) => o.role === 'tutor')
  @IsString()
  @MinLength(200)
  description?: string;

  @ValidateIf((o) => o.role === 'tutor')
  @IsInt()
  @Min(0)
  @Max(50)
  experienceYears?: number;

  @ValidateIf((o) => o.role === 'tutor')
  @IsString()
  @MinLength(2)
  education?: string;

  @ValidateIf((o) => o.role === 'tutor')
  @IsString()
  @MinLength(2)
  country?: string;

  @ValidateIf((o) => o.role === 'tutor')
  @IsString()
  @MinLength(2)
  city?: string;

  @ValidateIf((o) => o.role === 'tutor')
  @IsInt()
  @Min(1000)
  @Max(1500000)
  hourlyRateCents?: number;
}
