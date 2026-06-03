import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'admin@levhedva.org',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is a required field' })
  email: string;

  @ApiProperty({
    example: 'Admin123!@#',
    description: 'User password',
    minLength: 8,
    maxLength: 50,
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is a required field' })
  @MinLength(8, { message: 'Password must contain at least 8 characters' })
  @MaxLength(50, { message: 'Password must contain less than 50 characters' })
  password: string;
}
