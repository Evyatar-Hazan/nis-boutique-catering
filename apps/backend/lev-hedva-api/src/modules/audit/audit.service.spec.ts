import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditActionType, AuditEntityType } from './dto/create-audit-log.dto';
import { Logger } from '@nestjs/common';

describe('AuditService', () => {
  let service: AuditService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clean mocks before each test
    jest.clearAllMocks();
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createAuditLog', () => {
    it('צריך ליצור רשומת ביקורת בהצלחה', async () => {
      const auditData = {
        action: AuditActionType.LOGIN,
        entityType: AuditEntityType.USER,
        entityId: 'user-123',
        userId: 'user-123',
        description: 'התחברות משתמש',
        ipAddress: '192.168.1.1',
      };

      const expectedResult = {
        id: 'audit-123',
        ...auditData,
        createdAt: new Date(),
      };

      // Mock user existence check
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaService.auditLog.create.mockResolvedValue(expectedResult);

      const result = await service.createAuditLog(auditData);

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: auditData.action,
          entityType: auditData.entityType,
          entityId: auditData.entityId,
          userId: auditData.userId,
          description: auditData.description,
          ipAddress: auditData.ipAddress,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(
        expect.objectContaining({
          id: expectedResult.id,
          action: expectedResult.action,
          entityType: expectedResult.entityType,
          entityId: expectedResult.entityId,
          description: expectedResult.description,
          ipAddress: expectedResult.ipAddress,
          createdAt: expect.any(Date),
        })
      );
    });

    it('צריך לטפל בשגיאה בעת יצירת רשומת ביקורת', async () => {
      const auditData = {
        action: AuditActionType.LOGIN,
        entityType: AuditEntityType.USER,
        description: 'התחברות משתמש',
      };

      mockPrismaService.auditLog.create.mockRejectedValue(
        new Error('Database error')
      );

      await expect(service.createAuditLog(auditData)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('logUserAction', () => {
    it('צריך לרשום פעולת משתמש בהצלחה', async () => {
      const mockResult = { id: 'audit-123' };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaService.auditLog.create.mockResolvedValue(mockResult);

      await service.logUserAction(
        AuditActionType.UPDATE,
        AuditEntityType.USER,
        'עדכון פרטי משתמש',
        'user-123',
        'user-456',
        { field: 'email' }
      );

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditActionType.UPDATE,
          entityType: AuditEntityType.USER,
          description: 'עדכון פרטי משתמש',
          userId: 'user-123',
          entityId: 'user-456',
          metadata: { field: 'email' },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('logSystemEvent', () => {
    it('צריך לרשום אירוע מערכת בהצלחה', async () => {
      const mockResult = { id: 'audit-123' };
      mockPrismaService.auditLog.create.mockResolvedValue(mockResult);

      await service.logSystemEvent('גיבוי נתונים', { size: '1GB' });

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditActionType.SYSTEM_EVENT,
          entityType: AuditEntityType.SYSTEM,
          description: 'גיבוי נתונים',
          metadata: { size: '1GB' },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('logSecurityEvent', () => {
    it('צריך לרשום אירוע אבטחה בהצלחה', async () => {
      const mockResult = { id: 'audit-123' };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaService.auditLog.create.mockResolvedValue(mockResult);

      await service.logSecurityEvent(
        AuditActionType.FAILED_LOGIN,
        'ניסיון התחברות כושל',
        'user-123',
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditActionType.FAILED_LOGIN,
          entityType: AuditEntityType.AUTH,
          description: 'ניסיון התחברות כושל',
          userId: 'user-123',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('logDataChange', () => {
    it('צריך לרשום שינוי נתונים בהצלחה', async () => {
      const mockResult = { id: 'audit-123' };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaService.auditLog.create.mockResolvedValue(mockResult);

      const oldValues = { name: 'ישן' };
      const newValues = { name: 'חדש' };

      await service.logDataChange(
        AuditActionType.UPDATE,
        AuditEntityType.USER,
        'user-456',
        'שינוי נתונים: USER',
        'user-123',
        oldValues,
        newValues
      );

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditActionType.UPDATE,
          entityType: AuditEntityType.USER,
          description: 'שינוי נתונים: USER',
          userId: 'user-123',
          entityId: 'user-456',
          metadata: {
            oldValue: oldValues,
            newValue: newValues,
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('logError', () => {
    it('צריך לרשום שגיאה בהצלחה', async () => {
      const mockResult = { id: 'audit-123' };
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'user-123' });
      mockPrismaService.auditLog.create.mockResolvedValue(mockResult);

      const error = new Error('שגיאת מערכת');

      await service.logError(
        'שגיאה ב-API: POST /api/users',
        'שגיאת מערכת',
        'user-123',
        '/api/users',
        'POST',
        500,
        {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        }
      );

      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditActionType.ERROR,
          entityType: AuditEntityType.SYSTEM,
          description: 'שגיאה ב-API: POST /api/users',
          errorMessage: 'שגיאת מערכת',
          userId: 'user-123',
          endpoint: '/api/users',
          httpMethod: 'POST',
          statusCode: 500,
          metadata: {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          },
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAllAuditLogs', () => {
    it('צריך להחזיר רשימת לוגי ביקורת עם pagination', async () => {
      const mockLogs = [
        {
          id: 'audit-1',
          action: AuditActionType.LOGIN,
          entityType: AuditEntityType.USER,
          createdAt: new Date(),
          user: {
            id: 'user-1',
            firstName: 'ישי',
            lastName: 'כהן',
            email: 'yishai@example.com',
          },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);
      mockPrismaService.auditLog.count.mockResolvedValue(1);

      const query = {
        page: 1,
        limit: 10,
        action: AuditActionType.LOGIN,
        entityType: AuditEntityType.USER,
      };

      const result = await service.findAllAuditLogs(query);

      expect(result).toEqual({
        data: [
          {
            id: 'audit-1',
            action: AuditActionType.LOGIN,
            entityType: AuditEntityType.USER,
            entityId: undefined,
            user: {
              id: 'user-1',
              firstName: 'ישי',
              lastName: 'כהן',
              email: 'yishai@example.com',
            },
            ipAddress: undefined,
            userAgent: undefined,
            description: undefined,
            metadata: undefined,
            endpoint: undefined,
            httpMethod: undefined,
            statusCode: undefined,
            executionTime: undefined,
            errorMessage: undefined,
            createdAt: mockLogs[0].createdAt,
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('צריך לטפל בחיפוש טקסט חופשי', async () => {
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.auditLog.count.mockResolvedValue(0);

      await service.findAllAuditLogs({
        page: 1,
        limit: 10,
        search: 'התחברות',
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { description: { contains: 'התחברות', mode: 'insensitive' } },
            { errorMessage: { contains: 'התחברות', mode: 'insensitive' } },
            { endpoint: { contains: 'התחברות', mode: 'insensitive' } },
            {
              user: {
                OR: [
                  { firstName: { contains: 'התחברות', mode: 'insensitive' } },
                  { lastName: { contains: 'התחברות', mode: 'insensitive' } },
                  { email: { contains: 'התחברות', mode: 'insensitive' } },
                ],
              },
            },
          ],
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getAuditStatistics', () => {
    it('צריך להחזיר סטטיסטיקות ביקורת', async () => {
      const mockStats = {
        totalLogs: 100,
        actionBreakdown: [{ action: 'LOGIN', _count: { id: 50 } }],
        entityBreakdown: [{ entityType: 'USER', _count: { id: 75 } }],
        errorCount: 5,
        userStats: [{ userId: 'user-1', _count: { id: 25 } }],
        recentLogs: [],
      };

      mockPrismaService.auditLog.count
        .mockResolvedValueOnce(100) // totalLogs
        .mockResolvedValueOnce(5); // errorCount

      mockPrismaService.auditLog.groupBy
        .mockResolvedValueOnce([{ action: 'LOGIN', _count: { id: 50 } }]) // actionStats
        .mockResolvedValueOnce([{ entityType: 'USER', _count: { id: 75 } }]) // entityStats
        .mockResolvedValueOnce([{ userId: 'user-1', _count: { id: 25 } }]); // userStats

      mockPrismaService.auditLog.findMany.mockResolvedValue([]);
      mockPrismaService.user.findUnique.mockResolvedValue({
        firstName: 'ישי',
        lastName: 'כהן',
      });

      const result = await service.getAuditStatistics();

      expect(result).toEqual({
        totalLogs: 100,
        actionBreakdown: { LOGIN: 50 },
        entityBreakdown: { USER: 75 },
        errorCount: 5,
        topUsers: [
          {
            userId: 'user-1',
            userName: 'ישי כהן',
            count: 25,
          },
        ],
        recentActivity: [],
      });
    });
  });

  describe('getAvailableActions', () => {
    it('צריך להחזיר רשימת פעולות זמינות', async () => {
      const mockActions = [
        { action: 'LOGIN' },
        { action: 'LOGOUT' },
        { action: 'CREATE' },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockActions);

      const result = await service.getAvailableActions();

      expect(result).toEqual({
        actions: ['LOGIN', 'LOGOUT', 'CREATE'],
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        distinct: ['action'],
        select: { action: true },
        orderBy: { action: 'asc' },
      });
    });
  });

  describe('getAvailableEntities', () => {
    it('צריך להחזיר רשימת יישויות זמינות', async () => {
      const mockEntities = [
        { entityType: 'USER' },
        { entityType: 'PRODUCT' },
        { entityType: 'LOAN' },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockEntities);

      const result = await service.getAvailableEntities();

      expect(result).toEqual({
        entities: ['USER', 'PRODUCT', 'LOAN'],
      });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        distinct: ['entityType'],
        select: { entityType: true },
        orderBy: { entityType: 'asc' },
      });
    });
  });

  describe('cleanupOldLogs', () => {
    it('צריך למחוק רשומות ישנות', async () => {
      const mockResult = { count: 50 };
      mockPrismaService.auditLog.deleteMany.mockResolvedValue(mockResult);

      const result = await service.cleanupOldLogs(30);

      expect(result).toBe(50);
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            lt: expect.any(Date),
          },
        },
      });
    });
  });
});
