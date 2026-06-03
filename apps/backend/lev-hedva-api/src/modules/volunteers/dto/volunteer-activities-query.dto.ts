import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VolunteerActivitiesQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search in description and activity type',
    example: 'Training',
  })
  @IsOptional()
  @IsString()
  search?: string;

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

  @ApiPropertyOptional({
    description: 'Filter from date',
    format: 'date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Filter to date',
    format: 'date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['date', 'hours', 'activityType'],
    default: 'date',
  })
  @IsOptional()
  @IsEnum(['date', 'hours', 'activityType'])
  sortBy?: 'date' | 'hours' | 'activityType' = 'date';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
