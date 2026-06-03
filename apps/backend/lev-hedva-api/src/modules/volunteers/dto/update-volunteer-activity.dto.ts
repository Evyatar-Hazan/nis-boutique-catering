import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class UpdateVolunteerActivityDto {
  @ApiPropertyOptional({
    example: 'Maintenance and repair',
    description: 'Updated activity type',
  })
  @IsOptional()
  @IsString({ message: 'Activity type must be a string' })
  activityType?: string;

  @ApiPropertyOptional({
    example: 'Wheelchair repair at warehouse',
    description: 'Updated activity description',
  })
  @IsOptional()
  @IsString({ message: 'Activity description must be a string' })
  @MaxLength(500, {
    message: 'Activity description must contain less than 500 characters',
  })
  description?: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Updated activity hours',
    minimum: 0.1,
    maximum: 24,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Number of hours must be a number' })
  @Min(0.1, { message: 'Number of hours must be at least 0.1' })
  @Max(24, { message: 'Number of hours must be less than 24' })
  hours?: number;

  @ApiPropertyOptional({
    example: '2024-01-16T10:00:00.000Z',
    description: 'Updated activity date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Activity date must be in a valid date format' })
  date?: string;

  @ApiPropertyOptional({
    example: 'Activity completed successfully, repaired 3 wheelchairs',
    description: 'Updated additional notes',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes must contain less than 1000 characters' })
  notes?: string;
}
