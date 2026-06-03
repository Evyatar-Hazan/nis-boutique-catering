import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateVolunteerActivityDto,
  UpdateVolunteerActivityDto,
  VolunteerActivityResponseDto,
  VolunteerActivitiesQueryDto,
  VolunteerStatsResponseDto,
  VolunteerReportQueryDto,
  VolunteerReportResponseDto,
} from './dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class VolunteersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  async createActivity(
    createActivityDto: CreateVolunteerActivityDto,
    user: any
  ): Promise<VolunteerActivityResponseDto> {
    const { volunteerId, activityType, description, hours, date } =
      createActivityDto;

    // If user is a volunteer, they can only create activities for themselves
    if (user.role === UserRole.VOLUNTEER && user.userId !== volunteerId) {
      throw new BadRequestException('מתנדב יכול לרשום רק התנדבויות עבור עצמו');
    }

    // Verify volunteer exists and has the correct role
    const volunteer = await this.prisma.user.findFirst({
      where: {
        id: volunteerId,
        role: UserRole.VOLUNTEER,
        isActive: true,
      },
    });

    if (!volunteer) {
      throw new NotFoundException('המתנדב לא נמצא או אינו פעיל');
    }

    // Validate hours
    if (hours <= 0 || hours > 24) {
      throw new BadRequestException('מספר השעות חייב להיות בין 1 ל-24');
    }

    // Validate date
    const activityDate = new Date(date);
    const now = new Date();
    if (activityDate > now) {
      throw new BadRequestException('לא ניתן לרשום פעילות לתאריך עתידי');
    }

    try {
      const activity = await this.prisma.volunteerActivity.create({
        data: {
          volunteerId,
          activityType,
          description,
          hours,
          date: activityDate,
        },
        include: {
          volunteer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return this.formatActivityResponse(activity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('פעילות כזו כבר קיימת');
        }
      }
      throw new BadRequestException('שגיאה ביצירת הפעילות');
    }
  }

  async findAllActivities(
    query: VolunteerActivitiesQueryDto,
    user: any
  ): Promise<{
    data: VolunteerActivityResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      volunteerId,
      activityType,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.VolunteerActivityWhereInput = {};

    // If user is a volunteer, they can only see their own activities
    if (user.role === UserRole.VOLUNTEER) {
      where.volunteerId = user.userId;
    } else if (volunteerId) {
      // Admin/Worker can filter by volunteerId
      where.volunteerId = volunteerId;
    }

    // Activity type filter
    if (activityType) {
      where.activityType = activityType;
    }

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    // Text search
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { activityType: { contains: search, mode: 'insensitive' } },
        {
          volunteer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // Sorting
    const orderBy: Prisma.VolunteerActivityOrderByWithRelationInput = {};
    if (sortBy === 'date') {
      orderBy.date = sortOrder;
    } else if (sortBy === 'hours') {
      orderBy.hours = sortOrder;
    } else if (sortBy === 'activityType') {
      orderBy.activityType = sortOrder;
    }

    const [activities, total] = await Promise.all([
      this.prisma.volunteerActivity.findMany({
        where,
        include: {
          volunteer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.volunteerActivity.count({ where }),
    ]);

    const formattedActivities = activities.map((activity) =>
      this.formatActivityResponse(activity)
    );

    return {
      data: formattedActivities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findActivityById(
    id: string,
    user: any
  ): Promise<VolunteerActivityResponseDto> {
    const activity = await this.prisma.volunteerActivity.findUnique({
      where: { id },
      include: {
        volunteer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('הפעילות לא נמצאה');
    }

    // If user is a volunteer, they can only see their own activities
    if (
      user.role === UserRole.VOLUNTEER &&
      activity.volunteerId !== user.userId
    ) {
      throw new BadRequestException('אין לך הרשאה לצפות בפעילות זו');
    }

    return this.formatActivityResponse(activity);
  }

  async updateActivity(
    id: string,
    updateActivityDto: UpdateVolunteerActivityDto
  ): Promise<VolunteerActivityResponseDto> {
    const { activityType, description, hours, date } = updateActivityDto;

    // Check if activity exists
    const existingActivity = await this.prisma.volunteerActivity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      throw new NotFoundException('הפעילות לא נמצאה');
    }

    // Validate hours if provided
    if (hours !== undefined && (hours <= 0 || hours > 24)) {
      throw new BadRequestException('מספר השעות חייב להיות בין 1 ל-24');
    }

    // Validate date if provided
    if (date) {
      const activityDate = new Date(date);
      const now = new Date();
      if (activityDate > now) {
        throw new BadRequestException('לא ניתן לרשום פעילות לתאריך עתידי');
      }
    }

    try {
      const activity = await this.prisma.volunteerActivity.update({
        where: { id },
        data: {
          ...(activityType && { activityType }),
          ...(description && { description }),
          ...(hours !== undefined && { hours }),
          ...(date && { date: new Date(date) }),
        },
        include: {
          volunteer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return this.formatActivityResponse(activity);
    } catch {
      throw new BadRequestException('שגיאה בעדכון הפעילות');
    }
  }

  async deleteActivity(id: string): Promise<void> {
    const existingActivity = await this.prisma.volunteerActivity.findUnique({
      where: { id },
    });

    if (!existingActivity) {
      throw new NotFoundException('הפעילות לא נמצאה');
    }

    try {
      await this.prisma.volunteerActivity.delete({
        where: { id },
      });
    } catch {
      throw new BadRequestException('שגיאה במחיקת הפעילות');
    }
  }

  async getVolunteerStats(
    volunteerId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<VolunteerStatsResponseDto> {
    // Check if volunteer exists
    const volunteer = await this.prisma.user.findFirst({
      where: {
        id: volunteerId,
        role: UserRole.VOLUNTEER,
        isActive: true,
      },
    });

    if (!volunteer) {
      throw new NotFoundException('המתנדב לא נמצא');
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = startDate;
      if (endDate) dateFilter.date.lte = endDate;
    }

    // Get activities with volunteer info
    const activities = await this.prisma.volunteerActivity.findMany({
      where: {
        volunteerId,
        ...dateFilter,
      },
      include: {
        volunteer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    if (activities.length === 0) {
      return {
        volunteerId,
        volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
        totalActivities: 0,
        totalHours: 0,
        averageHoursPerActivity: 0,
        activitiesByType: {},
        monthlyBreakdown: {},
        recentActivities: [],
      };
    }

    // Calculate statistics
    const totalHours = activities.reduce(
      (sum, activity) => sum + activity.hours,
      0
    );
    const averageHoursPerActivity = totalHours / activities.length;
    const firstActivityDate = activities[activities.length - 1]?.date;
    const lastActivityDate = activities[0]?.date;

    // Group by activity type
    const activitiesByType: Record<string, { count: number; hours: number }> =
      {};
    activities.forEach((activity) => {
      if (!activitiesByType[activity.activityType]) {
        activitiesByType[activity.activityType] = { count: 0, hours: 0 };
      }
      activitiesByType[activity.activityType].count++;
      activitiesByType[activity.activityType].hours += activity.hours;
    });

    // Monthly breakdown
    const monthlyBreakdown: Record<string, { count: number; hours: number }> =
      {};
    activities.forEach((activity) => {
      const monthKey = activity.date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { count: 0, hours: 0 };
      }
      monthlyBreakdown[monthKey].count++;
      monthlyBreakdown[monthKey].hours += activity.hours;
    });

    // Recent activities (last 5)
    const recentActivitiesData = activities.slice(0, 5);
    const recentActivities = recentActivitiesData.map((activity) => ({
      id: activity.id,
      volunteerId: activity.volunteerId,
      activityType: activity.activityType,
      description: activity.description,
      hours: activity.hours,
      date: activity.date,
      createdAt: activity.createdAt,
    }));

    return {
      volunteerId,
      volunteerName: `${volunteer.firstName} ${volunteer.lastName}`,
      totalActivities: activities.length,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerActivity: Math.round(averageHoursPerActivity * 100) / 100,
      firstActivityDate,
      lastActivityDate,
      activitiesByType,
      monthlyBreakdown,
      recentActivities,
    };
  }

  async generateReports(
    query: VolunteerReportQueryDto
  ): Promise<VolunteerReportResponseDto> {
    const { type, startDate, endDate, volunteerId, activityType } = query;

    // Build date filter
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    // Build where clause
    const where: any = {
      ...dateFilter,
    };

    if (volunteerId) {
      where.volunteerId = volunteerId;
    }

    if (activityType) {
      where.activityType = activityType;
    }

    // Get activities with volunteer info
    const activities = await this.prisma.volunteerActivity.findMany({
      where,
      include: {
        volunteer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Calculate summary statistics
    const totalActivities = activities.length;
    const totalHours = activities.reduce(
      (sum, activity) => sum + activity.hours,
      0
    );
    const uniqueVolunteers = new Set(activities.map((a) => a.volunteerId)).size;
    const averageHoursPerVolunteer =
      uniqueVolunteers > 0 ? totalHours / uniqueVolunteers : 0;

    const summary = {
      totalVolunteers: uniqueVolunteers,
      totalActivities,
      totalHours: Math.round(totalHours * 100) / 100,
      averageHoursPerVolunteer:
        Math.round(averageHoursPerVolunteer * 100) / 100,
    };

    // Generate report data based on type
    let data: any[] = [];
    let charts: any = {};

    switch (type) {
      case 'summary':
        // Group by volunteer
        const volunteerGroups = activities.reduce((groups, activity) => {
          const key = activity.volunteerId;
          if (!groups[key]) {
            groups[key] = {
              volunteer: activity.volunteer,
              activities: [],
              totalHours: 0,
            };
          }
          groups[key].activities.push(activity);
          groups[key].totalHours += activity.hours;
          return groups;
        }, {} as any);

        data = Object.values(volunteerGroups).map((group: any) => ({
          volunteerId: group.volunteer.id,
          volunteerName: `${group.volunteer.firstName} ${group.volunteer.lastName}`,
          totalActivities: group.activities.length,
          totalHours: Math.round(group.totalHours * 100) / 100,
        }));

        // Chart data
        const volunteerContribution: Record<string, number> = {};
        data.forEach((item: any) => {
          volunteerContribution[item.volunteerName] = item.totalHours;
        });
        charts.volunteerContribution = volunteerContribution;
        break;

      case 'detailed':
        data = activities.map((activity) => ({
          id: activity.id,
          volunteer: `${activity.volunteer.firstName} ${activity.volunteer.lastName}`,
          activityType: activity.activityType,
          description: activity.description,
          hours: activity.hours,
          date: activity.date.toISOString().split('T')[0],
          createdAt: activity.createdAt,
        }));
        break;

      case 'byActivity':
        // Group by activity type
        const activityGroups = activities.reduce((groups, activity) => {
          const key = activity.activityType;
          if (!groups[key]) {
            groups[key] = {
              activityType: key,
              count: 0,
              totalHours: 0,
              volunteers: new Set(),
            };
          }
          groups[key].count++;
          groups[key].totalHours += activity.hours;
          groups[key].volunteers.add(activity.volunteerId);
          return groups;
        }, {} as any);

        data = Object.values(activityGroups).map((group: any) => ({
          activityType: group.activityType,
          totalActivities: group.count,
          totalHours: Math.round(group.totalHours * 100) / 100,
          uniqueVolunteers: group.volunteers.size,
          averageHours:
            Math.round((group.totalHours / group.count) * 100) / 100,
        }));

        // Chart data
        const byActivityType: Record<string, number> = {};
        data.forEach((item: any) => {
          byActivityType[item.activityType] = item.totalHours;
        });
        charts.byActivityType = byActivityType;
        break;

      case 'monthly':
        // Group by month
        const monthlyGroups = activities.reduce((groups, activity) => {
          const key = activity.date.toISOString().substring(0, 7); // YYYY-MM
          if (!groups[key]) {
            groups[key] = {
              month: key,
              count: 0,
              totalHours: 0,
              volunteers: new Set(),
            };
          }
          groups[key].count++;
          groups[key].totalHours += activity.hours;
          groups[key].volunteers.add(activity.volunteerId);
          return groups;
        }, {} as any);

        data = Object.values(monthlyGroups)
          .map((group: any) => ({
            month: group.month,
            totalActivities: group.count,
            totalHours: Math.round(group.totalHours * 100) / 100,
            uniqueVolunteers: group.volunteers.size,
            averageHours:
              Math.round((group.totalHours / group.count) * 100) / 100,
          }))
          .sort((a: any, b: any) => a.month.localeCompare(b.month));

        // Chart data
        const monthlyTrend: Record<string, number> = {};
        data.forEach((item: any) => {
          monthlyTrend[item.month] = item.totalHours;
        });
        charts.monthlyTrend = monthlyTrend;
        break;

      default:
        throw new BadRequestException('סוג דוח לא חוקי');
    }

    const reportTitles = {
      summary: 'דוח פעילות מתנדבים - סיכום',
      detailed: 'דוח פעילות מתנדבים - מפורט',
      byActivity: 'דוח פעילות מתנדבים - לפי סוג פעילות',
      monthly: 'דוח פעילות מתנדבים - חודשי',
    };

    return {
      type,
      title: reportTitles[type],
      generatedAt: new Date(),
      dateRange: {
        from: startDate,
        to: endDate,
      },
      summary,
      data,
      charts,
    };
  }

  async getActivityTypes(): Promise<string[]> {
    const activities = await this.prisma.volunteerActivity.findMany({
      select: { activityType: true },
      distinct: ['activityType'],
      orderBy: { activityType: 'asc' },
    });

    return activities.map((activity) => activity.activityType);
  }

  private formatActivityResponse(activity: any): VolunteerActivityResponseDto {
    return {
      id: activity.id,
      volunteerId: activity.volunteerId,
      activityType: activity.activityType,
      description: activity.description,
      hours: activity.hours,
      date: activity.date,
      createdAt: activity.createdAt,
      volunteer: activity.volunteer,
    };
  }
}
