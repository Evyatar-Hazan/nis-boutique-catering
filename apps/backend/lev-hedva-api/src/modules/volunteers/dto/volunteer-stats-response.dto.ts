import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VolunteerStatsResponseDto {
  @ApiProperty({
    description: 'Volunteer user ID',
    format: 'uuid',
  })
  volunteerId: string;

  @ApiProperty({
    description: 'Volunteer full name',
    example: 'David Cohen',
  })
  volunteerName: string;

  @ApiProperty({
    description: 'Total number of activities',
    example: 25,
  })
  totalActivities: number;

  @ApiProperty({
    description: 'Total hours volunteered',
    example: 87.5,
  })
  totalHours: number;

  @ApiProperty({
    description: 'Average hours per activity',
    example: 3.5,
  })
  averageHoursPerActivity: number;

  @ApiPropertyOptional({
    description: 'First activity date',
    format: 'date-time',
  })
  firstActivityDate?: Date;

  @ApiPropertyOptional({
    description: 'Last activity date',
    format: 'date-time',
  })
  lastActivityDate?: Date;

  @ApiProperty({
    description: 'Activities grouped by type',
    example: {
      Event: { count: 10, hours: 35 },
      Training: { count: 5, hours: 20 },
    },
  })
  activitiesByType: Record<string, { count: number; hours: number }>;

  @ApiProperty({
    description: 'Monthly breakdown of activities',
    example: {
      '2024-01': { count: 3, hours: 12 },
      '2024-02': { count: 5, hours: 20 },
    },
  })
  monthlyBreakdown: Record<string, { count: number; hours: number }>;

  @ApiProperty({
    description: 'Recent activities (last 5)',
    type: Array,
  })
  recentActivities: any[];
}
