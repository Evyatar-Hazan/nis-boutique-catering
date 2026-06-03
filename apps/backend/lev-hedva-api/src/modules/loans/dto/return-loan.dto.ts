import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class ReturnLoanDto {
  @ApiProperty({
    example: 'cuid123456789',
    description: 'Loan ID for return',
  })
  @IsString({ message: 'Loan ID must be a string' })
  @IsNotEmpty({ message: 'Loan ID is a required field' })
  loanId: string;

  @ApiPropertyOptional({
    example: 'good',
    description: 'Item condition upon return',
  })
  @IsOptional()
  @IsString({ message: 'Item condition must be a string' })
  returnCondition?: string;

  @ApiPropertyOptional({
    example: 'Returned in good condition, no damage',
    description: 'Notes about item condition upon return',
  })
  @IsOptional()
  @IsString({ message: 'Return notes must be a string' })
  @MaxLength(500, {
    message: 'Return notes must contain less than 500 characters',
  })
  returnNotes?: string;
}
