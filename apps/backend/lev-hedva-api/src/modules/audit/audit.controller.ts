import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { PERMISSIONS } from '../auth/permissions.constants';
import { AuditService } from './audit.service';
import { AuditLogsQueryDto } from './dto/audit-logs-query.dto';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ADMIN_AUDIT)
  @ApiOperation({
    summary: 'קבלת רשימת לוגי ביקורת',
    description: 'מחזיר רשימה מסוננת של לוגי ביקורת עם פיילטרים וסורטינג',
  })
  @ApiResponse({
    status: 200,
    description: 'רשימת לוגי הביקורת',
    type: [AuditLogResponseDto],
  })
  async getAuditLogs(@Query() query: AuditLogsQueryDto): Promise<{
    data: AuditLogResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.auditService.findAllAuditLogs(query);
  }

  @Get('statistics')
  @RequirePermissions(PERMISSIONS.ADMIN_AUDIT)
  @ApiOperation({
    summary: 'קבלת סטטיסטיקות ביקורת',
    description: 'מחזיר סטטיסטיקות על פעילויות המערכת',
  })
  @ApiResponse({
    status: 200,
    description: 'סטטיסטיקות ביקורת',
    schema: {
      type: 'object',
      properties: {
        totalLogs: { type: 'number', description: 'סה"כ לוגים' },
        actionBreakdown: {
          type: 'object',
          description: 'פילוח לפי פעולות',
          additionalProperties: { type: 'number' },
        },
        entityBreakdown: {
          type: 'object',
          description: 'פילוח לפי יישויות',
          additionalProperties: { type: 'number' },
        },
        errorCount: { type: 'number', description: 'מספר שגיאות' },
        topUsers: {
          type: 'array',
          description: 'משתמשים פעילים',
          items: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              userName: { type: 'string' },
              count: { type: 'number' },
            },
          },
        },
        recentActivity: {
          type: 'array',
          description: 'פעילות אחרונה',
          items: { $ref: '#/components/schemas/AuditLogResponseDto' },
        },
      },
    },
  })
  async getAuditStatistics(): Promise<{
    totalLogs: number;
    actionBreakdown: Record<string, number>;
    entityBreakdown: Record<string, number>;
    errorCount: number;
    topUsers: Array<{
      userId: string;
      userName: string;
      count: number;
    }>;
    recentActivity: AuditLogResponseDto[];
  }> {
    return this.auditService.getAuditStatistics();
  }

  @Get('actions')
  @RequirePermissions(PERMISSIONS.ADMIN_AUDIT)
  @ApiOperation({
    summary: 'קבלת רשימת פעולות זמינות',
    description: 'מחזיר רשימה של כל הפעולות הקיימות במערכת לצורך פילטור',
  })
  @ApiResponse({
    status: 200,
    description: 'רשימת פעולות',
    schema: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getAvailableActions(): Promise<{ actions: string[] }> {
    return this.auditService.getAvailableActions();
  }

  @Get('entities')
  @RequirePermissions(PERMISSIONS.ADMIN_AUDIT)
  @ApiOperation({
    summary: 'קבלת רשימת יישויות זמינות',
    description: 'מחזיר רשימה של כל היישויות הקיימות במערכת לצורך פילטור',
  })
  @ApiResponse({
    status: 200,
    description: 'רשימת יישויות',
    schema: {
      type: 'object',
      properties: {
        entities: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async getAvailableEntities(): Promise<{ entities: string[] }> {
    return this.auditService.getAvailableEntities();
  }
}
