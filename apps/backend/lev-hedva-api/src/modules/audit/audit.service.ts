import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateAuditLogDto,
  AuditLogResponseDto,
  AuditLogsQueryDto,
  AuditActionType,
  AuditEntityType,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * יצירת רשומת ביקורת חדשה
   */
  async createAuditLog(
    createAuditLogDto: CreateAuditLogDto
  ): Promise<AuditLogResponseDto> {
    try {
      // Verify userId exists if provided
      let validUserId = createAuditLogDto.userId;
      if (validUserId) {
        const userExists = await this.prisma.user.findUnique({
          where: { id: validUserId },
          select: { id: true },
        });
        if (!userExists) {
          validUserId = null; // User doesn't exist, set to null instead of failing
        }
      }

      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: createAuditLogDto.action,
          entityType: createAuditLogDto.entityType,
          entityId: createAuditLogDto.entityId,
          userId: validUserId,
          ipAddress: createAuditLogDto.ipAddress,
          userAgent: createAuditLogDto.userAgent,
          description: createAuditLogDto.description,
          metadata: createAuditLogDto.metadata as any,
          endpoint: createAuditLogDto.endpoint,
          httpMethod: createAuditLogDto.httpMethod,
          statusCode: createAuditLogDto.statusCode,
          executionTime: createAuditLogDto.executionTime,
          errorMessage: createAuditLogDto.errorMessage,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return this.formatAuditLogResponse(auditLog);
    } catch (error) {
      this.logger.error('שגיאה ביצירת רשומת ביקורת', error);
      throw error;
    }
  }

  /**
   * רישום פעילות משתמש
   */
  async logUserAction(
    action: AuditActionType,
    entityType: AuditEntityType,
    description: string,
    userId?: string,
    entityId?: string,
    metadata?: Record<string, any>,
    request?: any
  ): Promise<void> {
    const auditLogData: CreateAuditLogDto = {
      action,
      entityType,
      description,
      userId,
      entityId,
      metadata,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
      endpoint: request?.route?.path || request?.url,
      httpMethod: request?.method,
    };

    await this.createAuditLog(auditLogData);
  }

  /**
   * רישום אירוע מערכת
   */
  async logSystemEvent(
    description: string,
    metadata?: Record<string, any>,
    errorMessage?: string
  ): Promise<void> {
    const auditLogData: CreateAuditLogDto = {
      action: AuditActionType.SYSTEM_EVENT,
      entityType: AuditEntityType.SYSTEM,
      description,
      metadata,
      errorMessage,
    };

    await this.createAuditLog(auditLogData);
  }

  /**
   * רישום אירוע אבטחה
   */
  async logSecurityEvent(
    action:
      | AuditActionType.LOGIN
      | AuditActionType.LOGOUT
      | AuditActionType.FAILED_LOGIN,
    description: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditLogData: CreateAuditLogDto = {
      action,
      entityType: AuditEntityType.AUTH,
      description,
      userId,
      ipAddress,
      userAgent,
      metadata,
    };

    await this.createAuditLog(auditLogData);
  }

  /**
   * רישום שינוי נתונים
   */
  async logDataChange(
    action:
      | AuditActionType.CREATE
      | AuditActionType.UPDATE
      | AuditActionType.DELETE,
    entityType: AuditEntityType,
    entityId: string,
    description: string,
    userId: string,
    oldValue?: any,
    newValue?: any,
    request?: any
  ): Promise<void> {
    const metadata = {
      oldValue: oldValue || undefined,
      newValue: newValue || undefined,
    };

    await this.logUserAction(
      action,
      entityType,
      description,
      userId,
      entityId,
      metadata,
      request
    );
  }

  /**
   * רישום שגיאה
   */
  async logError(
    description: string,
    errorMessage: string,
    userId?: string,
    endpoint?: string,
    httpMethod?: string,
    statusCode?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const auditLogData: CreateAuditLogDto = {
      action: AuditActionType.ERROR,
      entityType: AuditEntityType.SYSTEM,
      description,
      errorMessage,
      userId,
      endpoint,
      httpMethod,
      statusCode,
      metadata,
    };

    await this.createAuditLog(auditLogData);
  }

  /**
   * שליפת רשומות ביקורת עם סינון
   */
  async findAllAuditLogs(query: AuditLogsQueryDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      action,
      entityType,
      entityId,
      userId,
      ipAddress,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      statusCode,
      errorsOnly = false,
    } = query;

    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {};

    // Filter by action
    if (action) {
      where.action = action;
    }

    // Filter by entity type
    if (entityType) {
      where.entityType = entityType;
    }

    // Filter by entity ID
    if (entityId) {
      where.entityId = entityId;
    }

    // Filter by user
    if (userId) {
      where.userId = userId;
    }

    // סינון לפי כתובת IP
    if (ipAddress) {
      where.ipAddress = ipAddress;
    }

    // סינון לפי קוד סטטוס
    if (statusCode) {
      where.statusCode = statusCode;
    }

    // סינון רק שגיאות
    if (errorsOnly) {
      where.errorMessage = {
        not: null,
      };
    }

    // סינון לפי טווח תאריכים
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // חיפוש טקסט חופשי
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { errorMessage: { contains: search, mode: 'insensitive' } },
        { endpoint: { contains: search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    // מיון
    const orderBy: Prisma.AuditLogOrderByWithRelationInput = {};
    if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else if (sortBy === 'action') {
      orderBy.action = sortOrder;
    } else if (sortBy === 'entityType') {
      orderBy.entityType = sortOrder;
    } else if (sortBy === 'userId') {
      orderBy.userId = sortOrder;
    }

    const [auditLogs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
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
      this.prisma.auditLog.count({ where }),
    ]);

    const formattedLogs = auditLogs.map((log) =>
      this.formatAuditLogResponse(log)
    );

    return {
      data: formattedLogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * שליפת רשומת ביקורת ספציפית
   */
  async findAuditLogById(id: string): Promise<AuditLogResponseDto | null> {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!auditLog) {
      return null;
    }

    return this.formatAuditLogResponse(auditLog);
  }

  /**
   * קבלת סטטיסטיקות ביקורת
   */
  async getAuditStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalLogs: number;
    actionBreakdown: Record<string, number>;
    entityBreakdown: Record<string, number>;
    errorCount: number;
    topUsers: Array<{ userId: string; userName: string; count: number }>;
    recentActivity: AuditLogResponseDto[];
  }> {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // ספירה כוללת
    const totalLogs = await this.prisma.auditLog.count({
      where: dateFilter,
    });

    // פילוח לפי פעולות
    const actionStats = await this.prisma.auditLog.groupBy({
      by: ['action'],
      _count: { id: true },
      where: dateFilter,
    });

    const actionBreakdown = actionStats.reduce(
      (acc, stat) => {
        acc[stat.action] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // פילוח לפי ישויות
    const entityStats = await this.prisma.auditLog.groupBy({
      by: ['entityType'],
      _count: { id: true },
      where: dateFilter,
    });

    const entityBreakdown = entityStats.reduce(
      (acc, stat) => {
        acc[stat.entityType] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // ספירת שגיאות
    const errorCount = await this.prisma.auditLog.count({
      where: {
        ...dateFilter,
        errorMessage: { not: null },
      },
    });

    // משתמשים פעילים
    const userStats = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      _count: { id: true },
      where: {
        ...dateFilter,
        userId: { not: null },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    const topUsers = await Promise.all(
      userStats.map(async (stat) => {
        const user = await this.prisma.user.findUnique({
          where: { id: stat.userId! },
          select: { firstName: true, lastName: true },
        });
        return {
          userId: stat.userId!,
          userName: user ? `${user.firstName} ${user.lastName}` : 'לא ידוע',
          count: stat._count.id,
        };
      })
    );

    // פעילות אחרונה
    const recentLogs = await this.prisma.auditLog.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const recentActivity = recentLogs.map((log) =>
      this.formatAuditLogResponse(log)
    );

    return {
      totalLogs,
      actionBreakdown,
      entityBreakdown,
      errorCount,
      topUsers,
      recentActivity,
    };
  }

  /**
   * קבלת רשימת פעולות זמינות
   */
  async getAvailableActions(): Promise<{ actions: string[] }> {
    const actions = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: {
        action: true,
      },
      orderBy: {
        action: 'asc',
      },
    });

    return {
      actions: actions.map((item) => item.action),
    };
  }

  /**
   * קבלת רשימת יישויות זמינות
   */
  async getAvailableEntities(): Promise<{ entities: string[] }> {
    const entities = await this.prisma.auditLog.findMany({
      distinct: ['entityType'],
      select: {
        entityType: true,
      },
      orderBy: {
        entityType: 'asc',
      },
    });

    return {
      entities: entities.map((item) => item.entityType),
    };
  }

  /**
   * מחיקת רשומות ביקורת ישנות
   */
  async cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`נמחקו ${result.count} רשומות ביקורת ישנות`);
    return result.count;
  }

  /**
   * פורמט תגובת רשומת ביקורת
   */
  private formatAuditLogResponse(auditLog: any): AuditLogResponseDto {
    return {
      id: auditLog.id,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      user: auditLog.user
        ? {
            id: auditLog.user.id,
            firstName: auditLog.user.firstName,
            lastName: auditLog.user.lastName,
            email: auditLog.user.email,
          }
        : undefined,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      description: auditLog.description,
      metadata: auditLog.metadata,
      endpoint: auditLog.endpoint,
      httpMethod: auditLog.httpMethod,
      statusCode: auditLog.statusCode,
      executionTime: auditLog.executionTime,
      errorMessage: auditLog.errorMessage,
      createdAt: auditLog.createdAt,
    };
  }
}
