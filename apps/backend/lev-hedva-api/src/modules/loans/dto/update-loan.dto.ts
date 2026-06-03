import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { LoanStatus } from '@prisma/client';

export class UpdateLoanDto {
  @ApiPropertyOptional({
    example: '2024-01-20T00:00:00.000Z',
    description: 'Updated expected return date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Expected return date must be in a valid date format' }
  )
  expectedReturnDate?: string;

  @ApiPropertyOptional({
    example: 'Update: Loan extended for another week',
    description: 'Updated notes about the loan',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must contain less than 500 characters' })
  notes?: string;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    description: 'Updated loan status',
    enum: LoanStatus,
  })
  @IsOptional()
  @IsEnum(LoanStatus, {
    message: 'Loan status must be one of the allowed values',
  })
  status?: LoanStatus;
}
