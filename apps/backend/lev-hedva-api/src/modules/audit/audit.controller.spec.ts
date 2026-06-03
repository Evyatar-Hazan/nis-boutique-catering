import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { AuditActionType, AuditEntityType } from './dto/create-audit-log.dto';
import { PERMISSIONS } from '../auth/permissions.constants';

describe('AuditController', () => {
  let controller: AuditController;
  let auditService: AuditService;

  const mockAuditService = {
    findAllAuditLogs: jest.fn(),
    getAuditStatistics: jest.fn(),
    getAvailableActions: jest.fn(),
    getAvailableEntities: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuditController>(AuditController);
    auditService = module.get<AuditService>(AuditService);

    // Clean mocks before each test
    jest.clearAllMocks();
  });

  describe('getAuditLogs', () => {
    it('צריך להחזיר רשימת לוגי ביקורת עם pagination', async () => {
      const mockResult = {
        data: [
          {
            id: 'audit-1',
            action: AuditActionType.LOGIN,
            entityType: AuditEntityType.USER,
            entityId: 'user-1',
            user: {
              id: 'user-1',
              firstName: 'ישי',
              lastName: 'כהן',
              email: 'yishai@example.com',
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            description: 'התחברות משתמש',
            metadata: null,
            endpoint: '/api/auth/login',
            httpMethod: 'POST',
            statusCode: 200,
            executionTime: 150,
            errorMessage: null,
            createdAt: new Date('2023-01-01T10:00:00Z'),
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      const query = {
        page: 1,
        limit: 10,
        action: AuditActionType.LOGIN,
        entityType: AuditEntityType.USER,
      };

      mockAuditService.findAllAuditLogs.mockResolvedValue(mockResult);

      const result = await controller.getAuditLogs(query);

      expect(mockAuditService.findAllAuditLogs).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
    });

    it('צריך להחזיר רשימה ריקה כשאין תוצאות', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      const query = {
        page: 1,
        limit: 10,
        search: 'לא קיים',
      };

      mockAuditService.findAllAuditLogs.mockResolvedValue(mockResult);

      const result = await controller.getAuditLogs(query);

      expect(mockAuditService.findAllAuditLogs).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResult);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getAuditStatistics', () => {
    it('צריך להחזיר סטטיסטיקות ביקורת', async () => {
      const mockStats = {
        totalLogs: 100,
        actionBreakdown: {
          [AuditActionType.LOGIN]: 30,
          [AuditActionType.CREATE]: 25,
          [AuditActionType.UPDATE]: 20,
          [AuditActionType.DELETE]: 5,
        },
        entityBreakdown: {
          [AuditEntityType.USER]: 50,
          [AuditEntityType.PRODUCT]: 30,
          [AuditEntityType.LOAN]: 20,
        },
        errorCount: 5,
        topUsers: [
          {
            userId: 'user-1',
            userName: 'ישי כהן',
            count: 25,
          },
          {
            userId: 'user-2',
            userName: 'שרה לוי',
            count: 20,
          },
        ],
        recentActivity: [
          {
            id: 'audit-latest',
            action: AuditActionType.LOGIN,
            entityType: AuditEntityType.USER,
            entityId: 'user-1',
            user: {
              id: 'user-1',
              firstName: 'ישי',
              lastName: 'כהן',
              email: 'yishai@example.com',
            },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            description: 'התחברות משתמש',
            metadata: null,
            endpoint: '/api/auth/login',
            httpMethod: 'POST',
            statusCode: 200,
            executionTime: 150,
            errorMessage: null,
            createdAt: new Date('2023-01-01T12:00:00Z'),
          },
        ],
      };

      mockAuditService.getAuditStatistics.mockResolvedValue(mockStats);

      const result = await controller.getAuditStatistics();

      expect(mockAuditService.getAuditStatistics).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
      expect(result.totalLogs).toBe(100);
      expect(result.topUsers).toHaveLength(2);
      expect(result.recentActivity).toHaveLength(1);
    });

    it('צריך להחזיר סטטיסטיקות ריקות כשאין נתונים', async () => {
      const mockStats = {
        totalLogs: 0,
        actionBreakdown: {},
        entityBreakdown: {},
        errorCount: 0,
        topUsers: [],
        recentActivity: [],
      };

      mockAuditService.getAuditStatistics.mockResolvedValue(mockStats);

      const result = await controller.getAuditStatistics();

      expect(mockAuditService.getAuditStatistics).toHaveBeenCalledWith();
      expect(result).toEqual(mockStats);
      expect(result.totalLogs).toBe(0);
      expect(result.topUsers).toHaveLength(0);
      expect(result.recentActivity).toHaveLength(0);
    });
  });

  describe('getAvailableActions', () => {
    it('צריך להחזיר רשימת פעולות זמינות', async () => {
      const mockActions = {
        actions: [
          AuditActionType.LOGIN,
          AuditActionType.LOGOUT,
          AuditActionType.CREATE,
          AuditActionType.UPDATE,
          AuditActionType.DELETE,
          AuditActionType.READ,
        ],
      };

      mockAuditService.getAvailableActions.mockResolvedValue(mockActions);

      const result = await controller.getAvailableActions();

      expect(mockAuditService.getAvailableActions).toHaveBeenCalledWith();
      expect(result).toEqual(mockActions);
      expect(result.actions).toContain(AuditActionType.LOGIN);
      expect(result.actions).toContain(AuditActionType.CREATE);
      expect(result.actions).toHaveLength(6);
    });

    it('צריך להחזיר מערך ריק כשאין פעולות', async () => {
      const mockActions = {
        actions: [],
      };

      mockAuditService.getAvailableActions.mockResolvedValue(mockActions);

      const result = await controller.getAvailableActions();

      expect(mockAuditService.getAvailableActions).toHaveBeenCalledWith();
      expect(result).toEqual(mockActions);
      expect(result.actions).toHaveLength(0);
    });
  });

  describe('getAvailableEntities', () => {
    it('צריך להחזיר רשימת יישויות זמינות', async () => {
      const mockEntities = {
        entities: [
          AuditEntityType.USER,
          AuditEntityType.PRODUCT,
          AuditEntityType.LOAN,
          AuditEntityType.VOLUNTEER_ACTIVITY,
          AuditEntityType.AUTH,
          AuditEntityType.SYSTEM,
        ],
      };

      mockAuditService.getAvailableEntities.mockResolvedValue(mockEntities);

      const result = await controller.getAvailableEntities();

      expect(mockAuditService.getAvailableEntities).toHaveBeenCalledWith();
      expect(result).toEqual(mockEntities);
      expect(result.entities).toContain(AuditEntityType.USER);
      expect(result.entities).toContain(AuditEntityType.PRODUCT);
      expect(result.entities).toHaveLength(6);
    });

    it('צריך להחזיר מערך ריק כשאין יישויות', async () => {
      const mockEntities = {
        entities: [],
      };

      mockAuditService.getAvailableEntities.mockResolvedValue(mockEntities);

      const result = await controller.getAvailableEntities();

      expect(mockAuditService.getAvailableEntities).toHaveBeenCalledWith();
      expect(result).toEqual(mockEntities);
      expect(result.entities).toHaveLength(0);
    });
  });

  describe('Security and Guards', () => {
    it('צריך להיות מוגן עם JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AuditController);
      expect(guards).toContain(JwtAuthGuard);
    });

    it('צריך להיות מוגן עם PermissionGuard', () => {
      const guards = Reflect.getMetadata('__guards__', AuditController);
      expect(guards).toContain(PermissionGuard);
    });

    it('endpoints צריכים להיות מוגנים עם ADMIN_AUDIT permission', () => {
      const getAuditLogsPermissions = Reflect.getMetadata(
        'permissions',
        controller.getAuditLogs
      );
      const getAuditStatisticsPermissions = Reflect.getMetadata(
        'permissions',
        controller.getAuditStatistics
      );
      const getAvailableActionsPermissions = Reflect.getMetadata(
        'permissions',
        controller.getAvailableActions
      );
      const getAvailableEntitiesPermissions = Reflect.getMetadata(
        'permissions',
        controller.getAvailableEntities
      );

      expect(getAuditLogsPermissions).toContain(PERMISSIONS.ADMIN_AUDIT);
      expect(getAuditStatisticsPermissions).toContain(PERMISSIONS.ADMIN_AUDIT);
      expect(getAvailableActionsPermissions).toContain(PERMISSIONS.ADMIN_AUDIT);
      expect(getAvailableEntitiesPermissions).toContain(
        PERMISSIONS.ADMIN_AUDIT
      );
    });
  });

  describe('Error Handling', () => {
    it('צריך לטפל בשגיאות מהשירות בgetAuditLogs', async () => {
      const query = {
        page: 1,
        limit: 10,
      };

      mockAuditService.findAllAuditLogs.mockRejectedValue(
        new Error('Database error')
      );

      await expect(controller.getAuditLogs(query)).rejects.toThrow(
        'Database error'
      );
      expect(mockAuditService.findAllAuditLogs).toHaveBeenCalledWith(query);
    });

    it('צריך לטפל בשגיאות מהשירות בgetAuditStatistics', async () => {
      mockAuditService.getAuditStatistics.mockRejectedValue(
        new Error('Service error')
      );

      await expect(controller.getAuditStatistics()).rejects.toThrow(
        'Service error'
      );
      expect(mockAuditService.getAuditStatistics).toHaveBeenCalledWith();
    });

    it('צריך לטפל בשגיאות מהשירות בgetAvailableActions', async () => {
      mockAuditService.getAvailableActions.mockRejectedValue(
        new Error('Actions error')
      );

      await expect(controller.getAvailableActions()).rejects.toThrow(
        'Actions error'
      );
      expect(mockAuditService.getAvailableActions).toHaveBeenCalledWith();
    });

    it('צריך לטפל בשגיאות מהשירות בgetAvailableEntities', async () => {
      mockAuditService.getAvailableEntities.mockRejectedValue(
        new Error('Entities error')
      );

      await expect(controller.getAvailableEntities()).rejects.toThrow(
        'Entities error'
      );
      expect(mockAuditService.getAvailableEntities).toHaveBeenCalledWith();
    });
  });
});
