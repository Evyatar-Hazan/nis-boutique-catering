import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsDateString,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateVolunteerActivityDto {
  @ApiProperty({
    example: 'cuid123456789',
    description: 'Volunteer ID',
  })
  @IsString({ message: 'Volunteer ID must be a string' })
  @IsNotEmpty({ message: 'Volunteer ID is a required field' })
  volunteerId: string;

  @ApiProperty({
    example: 'Equipment distribution assistance',
    description: 'Activity type',
    enum: [
      'Equipment distribution assistance',
      'Maintenance and repair',
      'Management and organization',
      'Training and instruction',
      'Community activity',
      'Technical support',
      'Office help',
      'Special activity',
      'Other',
    ],
  })
  @IsString({ message: 'Activity type must be a string' })
  @IsNotEmpty({ message: 'Activity type is a required field' })
  activityType: string;

  @ApiProperty({
    example: 'Wheelchair distribution at medical center',
    description: 'Activity description',
  })
  @IsString({ message: 'Activity description must be a string' })
  @IsNotEmpty({ message: 'Activity description is a required field' })
  @MaxLength(500, {
    message: 'Activity description must contain less than 500 characters',
  })
  description: string;

  @ApiProperty({
    example: 4.5,
    description: 'Number of activity hours',
    minimum: 0.1,
    maximum: 24,
  })
  @IsNumber({}, { message: 'Number of hours must be a number' })
  @Min(0.1, { message: 'Number of hours must be at least 0.1' })
  @Max(24, { message: 'Number of hours must be less than 24' })
  hours: number;

  @ApiProperty({
    example: '2024-01-15T09:00:00.000Z',
    description: 'Activity date',
  })
  @IsDateString({}, { message: 'Activity date must be in a valid date format' })
  date: string;

  @ApiPropertyOptional({
    example: 'Successful activity, distributed 5 wheelchairs',
    description: 'Additional notes about the activity',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(1000, { message: 'Notes must contain less than 1000 characters' })
  notes?: string;
}
