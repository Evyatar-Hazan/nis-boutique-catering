import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateLoanDto {
  @ApiProperty({
    example: 'cuid123456789',
    description: 'User ID requesting the loan',
  })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID is a required field' })
  userId: string;

  @ApiProperty({
    example: 'cuid987654321',
    description: 'Product instance ID for the loan',
  })
  @IsString({ message: 'Product instance ID must be a string' })
  @IsNotEmpty({ message: 'Product instance ID is a required field' })
  productInstanceId: string;

  @ApiPropertyOptional({
    example: '2024-01-15T00:00:00.000Z',
    description: 'Expected return date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expected return date must be in a valid date format' }
  )
  expectedReturnDate?: string;

  @ApiPropertyOptional({
    example: 'Loan for family trip',
    description: 'Additional notes about the loan',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must contain less than 500 characters' })
  notes?: string;
}
