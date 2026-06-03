import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is a required field' })
  email: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'User password',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is a required field' })
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  @MaxLength(50, { message: 'Password must contain less than 50 characters' })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is a required field' })
  @MaxLength(50, { message: 'First name must contain less than 50 characters' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is a required field' })
  @MaxLength(50, { message: 'Last name must contain less than 50 characters' })
  lastName: string;

  @ApiProperty({
    example: '+972-50-1234567',
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @MaxLength(20, {
    message: 'Phone number must contain less than 20 characters',
  })
  phone?: string;

  @ApiProperty({
    example: UserRole.CLIENT,
    description: 'User role',
    enum: UserRole,
    required: false,
    default: UserRole.CLIENT,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'User role is invalid' })
  role?: UserRole;
}
