import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VolunteerReportQueryDto {
  @ApiProperty({
    description: 'Report type',
    enum: ['summary', 'detailed', 'byActivity', 'monthly'],
    example: 'summary',
  })
  @IsEnum(['summary', 'detailed', 'byActivity', 'monthly'])
  type: 'summary' | 'detailed' | 'byActivity' | 'monthly';

  @ApiPropertyOptional({
    description: 'Start date for the report',
    format: 'date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for the report',
    format: 'date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by volunteer ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  volunteerId?: string;

  @ApiPropertyOptional({
    description: 'Filter by activity type',
    example: 'Event',
  })
  @IsOptional()
  @IsString()
  activityType?: string;
}
