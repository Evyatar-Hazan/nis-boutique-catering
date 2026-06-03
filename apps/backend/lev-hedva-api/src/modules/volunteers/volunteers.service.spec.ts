import { Test, TestingModule } from '@nestjs/testing';
import { VolunteersService } from './volunteers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('VolunteersService', () => {
  let service: VolunteersService;
  let prismaService: PrismaService;
  let auditService: AuditService;

  const mockPrismaService = {
    user: {
      findFirst: jest.fn(),
    },
    volunteerActivity: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockAuditService = {
    logUserAction: jest.fn(),
    logSecurityEvent: jest.fn(),
    logDataChange: jest.fn(),
  };

  const mockVolunteer = {
    id: 'volunteer-1',
    firstName: 'דוד',
    lastName: 'כהן',
    email: 'david@example.com',
    role: UserRole.VOLUNTEER,
    isActive: true,
  };

  const mockActivity = {
    id: 'activity-1',
    volunteerId: 'volunteer-1',
    activityType: 'אירוע',
    description: 'עזרה באירוע קהילתי',
    hours: 4,
    date: new Date('2024-01-15'),
    createdAt: new Date(),
    volunteer: mockVolunteer,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolunteersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    service = module.get<VolunteersService>(VolunteersService);
    prismaService = module.get<PrismaService>(PrismaService);
    auditService = module.get<AuditService>(AuditService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createActivity', () => {
    const createActivityDto = {
      volunteerId: 'volunteer-1',
      activityType: 'אירוע',
      description: 'עזרה באירוע קהילתי',
      hours: 4,
      date: '2024-01-15',
    };

    const mockUser = {
      userId: 'user-1',
      role: UserRole.ADMIN,
    };

    it('should create a volunteer activity successfully', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockVolunteer);
      mockPrismaService.volunteerActivity.create.mockResolvedValue(
        mockActivity
      );

      const result = await service.createActivity(createActivityDto, mockUser);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'volunteer-1',
          role: UserRole.VOLUNTEER,
          isActive: true,
        },
      });

      expect(mockPrismaService.volunteerActivity.create).toHaveBeenCalledWith({
        data: {
          volunteerId: 'volunteer-1',
          activityType: 'אירוע',
          description: 'עזרה באירוע קהילתי',
          hours: 4,
          date: new Date('2024-01-15'),
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

      expect(result).toEqual({
        id: 'activity-1',
        volunteerId: 'volunteer-1',
        activityType: 'אירוע',
        description: 'עזרה באירוע קהילתי',
        hours: 4,
        date: new Date('2024-01-15'),
        createdAt: mockActivity.createdAt,
        volunteer: mockVolunteer,
      });
    });

    it('should throw NotFoundException when volunteer does not exist', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.createActivity(createActivityDto, mockUser)
      ).rejects.toThrow(new NotFoundException('המתנדב לא נמצא או אינו פעיל'));
    });

    it('should throw BadRequestException for invalid hours', async () => {
      const invalidDto = { ...createActivityDto, hours: 25 };
      mockPrismaService.user.findFirst.mockResolvedValue(mockVolunteer);

      await expect(
        service.createActivity(invalidDto, mockUser)
      ).rejects.toThrow(
        new BadRequestException('מספר השעות חייב להיות בין 1 ל-24')
      );
    });

    it('should throw BadRequestException for future date', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const invalidDto = {
        ...createActivityDto,
        date: futureDate.toISOString(),
      };
      mockPrismaService.user.findFirst.mockResolvedValue(mockVolunteer);

      await expect(
        service.createActivity(invalidDto, mockUser)
      ).rejects.toThrow(
        new BadRequestException('לא ניתן לרשום פעילות לתאריך עתידי')
      );
    });
  });

  describe('findAllActivities', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    const mockUser = {
      userId: 'user-1',
      role: UserRole.ADMIN,
    };

    it('should return paginated activities', async () => {
      const activities = [mockActivity];
      const total = 1;

      mockPrismaService.volunteerActivity.findMany.mockResolvedValue([
        mockActivity,
      ]);
      mockPrismaService.volunteerActivity.count.mockResolvedValue(1);

      const result = await service.findAllActivities(queryDto, mockUser);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'activity-1',
            volunteerId: 'volunteer-1',
          }),
        ]),
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should handle search functionality', async () => {
      const searchQuery = { ...queryDto, search: 'אירוע' };

      mockPrismaService.volunteerActivity.findMany.mockResolvedValue([
        mockActivity,
      ]);
      mockPrismaService.volunteerActivity.count.mockResolvedValue(1);

      await service.findAllActivities(searchQuery, mockUser);

      expect(mockPrismaService.volunteerActivity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { description: { contains: 'אירוע', mode: 'insensitive' } },
              { activityType: { contains: 'אירוע', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });
  });

  describe('findActivityById', () => {
    const mockUser = {
      userId: 'user-1',
      role: UserRole.ADMIN,
    };

    it('should return activity by ID', async () => {
      mockPrismaService.volunteerActivity.findUnique.mockResolvedValue(
        mockActivity
      );

      const result = await service.findActivityById('activity-1', mockUser);

      expect(
        mockPrismaService.volunteerActivity.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
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

      expect(result.id).toBe('activity-1');
    });

    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrismaService.volunteerActivity.findUnique.mockResolvedValue(null);

      await expect(
        service.findActivityById('non-existent', mockUser)
      ).rejects.toThrow(new NotFoundException('הפעילות לא נמצאה'));
    });
  });

  describe('updateActivity', () => {
    const updateDto = {
      description: 'עזרה מעודכנת באירוע',
      hours: 5,
    };

    it('should update activity successfully', async () => {
      const updatedActivity = { ...mockActivity, ...updateDto };

      mockPrismaService.volunteerActivity.findUnique.mockResolvedValue(
        mockActivity
      );
      mockPrismaService.volunteerActivity.update.mockResolvedValue(
        updatedActivity
      );

      const result = await service.updateActivity('activity-1', updateDto);

      expect(
        mockPrismaService.volunteerActivity.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });

      expect(mockPrismaService.volunteerActivity.update).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
        data: {
          description: 'עזרה מעודכנת באירוע',
          hours: 5,
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

      expect(result.description).toBe('עזרה מעודכנת באירוע');
      expect(result.hours).toBe(5);
    });

    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrismaService.volunteerActivity.findUnique.mockResolvedValue(null);

      await expect(
        service.updateActivity('non-existent', updateDto)
      ).rejects.toThrow(new NotFoundException('הפעילות לא נמצאה'));
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity successfully', async () => {
      mockPrismaService.volunteerActivity.findUnique.mockResolvedValue(
        mockActivity
      );
      mockPrismaService.volunteerActivity.delete.mockResolvedValue(
        mockActivity
      );

      await service.deleteActivity('activity-1');

      expect(
        mockPrismaService.volunteerActivity.findUnique
      ).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });

      expect(mockPrismaService.volunteerActivity.delete).toHaveBeenCalledWith({
        where: { id: 'activity-1' },
      });
    });

    it('should throw NotFoundException when activity does not exist', async () => {
      mockPrismaService.volunteerActivity.findUnique.mockResolvedValue(null);

      await expect(service.deleteActivity('non-existent')).rejects.toThrow(
        new NotFoundException('הפעילות לא נמצאה')
      );
    });
  });

  describe('getVolunteerStats', () => {
    it('should return volunteer statistics', async () => {
      const activities = [
        mockActivity,
        {
          ...mockActivity,
          id: 'activity-2',
          hours: 3,
          date: new Date('2024-01-20'),
        },
      ];

      mockPrismaService.user.findFirst.mockResolvedValue(mockVolunteer);
      mockPrismaService.volunteerActivity.findMany.mockResolvedValue(
        activities
      );

      const result = await service.getVolunteerStats('volunteer-1');

      expect(result).toMatchObject({
        volunteerId: 'volunteer-1',
        volunteerName: 'דוד כהן',
        totalActivities: 2,
        totalHours: 7,
        averageHoursPerActivity: 3.5,
      });

      expect(result.activitiesByType).toHaveProperty('אירוע');
      expect(result.monthlyBreakdown).toHaveProperty('2024-01');
      expect(result.recentActivities).toHaveLength(2);
    });

    it('should handle empty activity list', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(mockVolunteer);
      mockPrismaService.volunteerActivity.findMany.mockResolvedValue([]);

      const result = await service.getVolunteerStats('volunteer-1');

      expect(result).toMatchObject({
        volunteerId: 'volunteer-1',
        volunteerName: 'דוד כהן',
        totalActivities: 0,
        totalHours: 0,
        averageHoursPerActivity: 0,
        activitiesByType: {},
        monthlyBreakdown: {},
        recentActivities: [],
      });
    });
  });

  describe('getActivityTypes', () => {
    it('should return list of activity types', async () => {
      const activityTypes = [
        { activityType: 'אירוע' },
        { activityType: 'הכשרה' },
        { activityType: 'ליווי' },
      ];

      mockPrismaService.volunteerActivity.findMany.mockResolvedValue(
        activityTypes
      );

      const result = await service.getActivityTypes();

      expect(mockPrismaService.volunteerActivity.findMany).toHaveBeenCalledWith(
        {
          select: { activityType: true },
          distinct: ['activityType'],
          orderBy: { activityType: 'asc' },
        }
      );

      expect(result).toEqual(['אירוע', 'הכשרה', 'ליווי']);
    });
  });
});
