import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VolunteerActivityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  volunteerId: string;

  @ApiProperty()
  activityType: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  hours: number;

  @ApiProperty()
  date: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  // Relations
  @ApiPropertyOptional()
  volunteer?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export class VolunteerActivitiesListResponseDto {
  @ApiProperty({ type: [VolunteerActivityResponseDto] })
  activities: VolunteerActivityResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class VolunteerStatsResponseDto {
  @ApiProperty()
  totalVolunteers: number;

  @ApiProperty()
  activeVolunteersThisMonth: number;

  @ApiProperty()
  totalHoursThisMonth: number;

  @ApiProperty()
  totalHoursThisYear: number;

  @ApiProperty()
  averageHoursPerVolunteer: number;

  @ApiProperty({ type: [Object] })
  hoursByActivityType: {
    activityType: string;
    totalHours: number;
    activitiesCount: number;
  }[];

  @ApiProperty({ type: [Object] })
  topVolunteers: {
    volunteerId: string;
    volunteerName: string;
    totalHours: number;
    activitiesCount: number;
  }[];

  @ApiProperty({ type: [Object] })
  monthlyProgress: {
    month: string;
    totalHours: number;
    volunteersCount: number;
  }[];
}

export class VolunteerReportResponseDto {
  @ApiProperty()
  volunteerId: string;

  @ApiProperty()
  volunteerName: string;

  @ApiProperty()
  totalActivities: number;

  @ApiProperty()
  totalHours: number;

  @ApiProperty()
  averageHoursPerActivity: number;

  @ApiProperty()
  firstActivityDate: Date;

  @ApiProperty()
  lastActivityDate: Date;

  @ApiProperty({ type: [Object] })
  activitiesByType: {
    activityType: string;
    count: number;
    totalHours: number;
  }[];

  @ApiProperty({ type: [Object] })
  monthlyBreakdown: {
    month: string;
    hours: number;
    activities: number;
  }[];

  @ApiProperty({ type: [VolunteerActivityResponseDto] })
  recentActivities: VolunteerActivityResponseDto[];
}