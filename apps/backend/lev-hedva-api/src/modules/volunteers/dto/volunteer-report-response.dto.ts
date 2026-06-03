import { ApiProperty } from '@nestjs/swagger';

export class VolunteerReportResponseDto {
  @ApiProperty({
    description: 'Report type',
    enum: ['summary', 'detailed', 'byActivity', 'monthly'],
  })
  type: string;

  @ApiProperty({
    description: 'Report title',
    example: 'Volunteer Activity Report - Summary',
  })
  title: string;

  @ApiProperty({
    description: 'Report generation date',
    format: 'date-time',
  })
  generatedAt: Date;

  @ApiProperty({
    description: 'Report date range',
    example: {
      from: '2024-01-01',
      to: '2024-12-31',
    },
  })
  dateRange: {
    from?: string;
    to?: string;
  };

  @ApiProperty({
    description: 'Report summary statistics',
    example: {
      totalVolunteers: 25,
      totalActivities: 150,
      totalHours: 520,
      averageHoursPerVolunteer: 20.8,
    },
  })
  summary: {
    totalVolunteers: number;
    totalActivities: number;
    totalHours: number;
    averageHoursPerVolunteer: number;
  };

  @ApiProperty({
    description: 'Report data',
    type: 'array',
    example: [
      {
        id: 'activity-1',
        volunteer: 'David Cohen',
        activityType: 'Event',
        hours: 4,
        date: '2024-01-15',
      },
    ],
  })
  data: any[];

  @ApiProperty({
    description: 'Report charts data',
    example: {
      byActivityType: {
        Event: 45,
        Training: 30,
        Escort: 25,
      },
      monthlyTrend: {
        '2024-01': 35,
        '2024-02': 42,
        '2024-03': 38,
      },
    },
  })
  charts: {
    byActivityType?: Record<string, number>;
    monthlyTrend?: Record<string, number>;
    volunteerContribution?: Record<string, number>;
  };
}
