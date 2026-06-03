import { Test, TestingModule } from '@nestjs/testing';
import { VolunteersController } from './volunteers.controller';
import { VolunteersService } from './volunteers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../auth/guards/permission.guard';
import { BadRequestException } from '@nestjs/common';

describe('VolunteersController', () => {
  let controller: VolunteersController;
  let service: VolunteersService;

  const mockVolunteersService = {
    createActivity: jest.fn(),
    findAllActivities: jest.fn(),
    findActivityById: jest.fn(),
    updateActivity: jest.fn(),
    deleteActivity: jest.fn(),
    getVolunteerStats: jest.fn(),
    generateReports: jest.fn(),
    getActivityTypes: jest.fn(),
  };

  const mockActivity = {
    id: 'activity-1',
    volunteerId: 'volunteer-1',
    activityType: 'אירוע',
    description: 'עזרה באירוע קהילתי',
    hours: 4,
    date: new Date('2024-01-15'),
    createdAt: new Date(),
    volunteer: {
      id: 'volunteer-1',
      firstName: 'דוד',
      lastName: 'כהן',
      email: 'david@example.com',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VolunteersController],
      providers: [
        {
          provide: VolunteersService,
          useValue: mockVolunteersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VolunteersController>(VolunteersController);
    service = module.get<VolunteersService>(VolunteersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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
      role: 'ADMIN',
    };

    it('should create a volunteer activity', async () => {
      mockVolunteersService.createActivity.mockResolvedValue(mockActivity);

      const result = await controller.createActivity(
        createActivityDto,
        mockUser
      );

      expect(mockVolunteersService.createActivity).toHaveBeenCalledWith(
        createActivityDto,
        mockUser
      );
      expect(result).toEqual(mockActivity);
    });
  });

  describe('findAllActivities', () => {
    const queryDto = {
      page: 1,
      limit: 10,
    };

    const mockUser = {
      userId: 'user-1',
      role: 'ADMIN',
    };

    it('should return paginated activities', async () => {
      const expectedResult = {
        data: [mockActivity],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockVolunteersService.findAllActivities.mockResolvedValue(expectedResult);

      const result = await controller.findAllActivities(queryDto, mockUser);

      expect(mockVolunteersService.findAllActivities).toHaveBeenCalledWith(
        queryDto,
        mockUser
      );
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findActivity', () => {
    const mockUser = {
      userId: 'user-1',
      role: 'ADMIN',
    };

    it('should return activity by ID', async () => {
      mockVolunteersService.findActivityById.mockResolvedValue(mockActivity);

      const result = await controller.findActivity('activity-1', mockUser);

      expect(mockVolunteersService.findActivityById).toHaveBeenCalledWith(
        'activity-1',
        mockUser
      );
      expect(result).toEqual(mockActivity);
    });
  });

  describe('updateActivity', () => {
    const updateDto = {
      description: 'תיאור מעודכן',
      hours: 5,
    };

    it('should update activity', async () => {
      const updatedActivity = { ...mockActivity, ...updateDto };
      mockVolunteersService.updateActivity.mockResolvedValue(updatedActivity);

      const result = await controller.updateActivity('activity-1', updateDto);

      expect(mockVolunteersService.updateActivity).toHaveBeenCalledWith(
        'activity-1',
        updateDto
      );
      expect(result).toEqual(updatedActivity);
    });
  });

  describe('deleteActivity', () => {
    it('should delete activity', async () => {
      mockVolunteersService.deleteActivity.mockResolvedValue(undefined);

      await controller.deleteActivity('activity-1');

      expect(mockVolunteersService.deleteActivity).toHaveBeenCalledWith(
        'activity-1'
      );
    });
  });

  describe('getVolunteerStats', () => {
    const mockStats = {
      volunteerId: 'volunteer-1',
      volunteerName: 'דוד כהן',
      totalActivities: 5,
      totalHours: 20,
      averageHoursPerActivity: 4,
      firstActivityDate: new Date('2024-01-01'),
      lastActivityDate: new Date('2024-01-15'),
      activitiesByType: {
        אירוע: { count: 3, hours: 12 },
        הכשרה: { count: 2, hours: 8 },
      },
      monthlyBreakdown: {
        '2024-01': { count: 5, hours: 20 },
      },
      recentActivities: [mockActivity],
    };

    it('should return volunteer statistics', async () => {
      mockVolunteersService.getVolunteerStats.mockResolvedValue(mockStats);

      const result = await controller.getVolunteerStats('volunteer-1');

      expect(mockVolunteersService.getVolunteerStats).toHaveBeenCalledWith(
        'volunteer-1',
        undefined,
        undefined
      );
      expect(result).toEqual(mockStats);
    });

    it('should handle date parameters', async () => {
      mockVolunteersService.getVolunteerStats.mockResolvedValue(mockStats);

      await controller.getVolunteerStats(
        'volunteer-1',
        '2024-01-01',
        '2024-01-31'
      );

      expect(mockVolunteersService.getVolunteerStats).toHaveBeenCalledWith(
        'volunteer-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
    });

    it('should throw BadRequestException for invalid date format', async () => {
      await expect(
        controller.getVolunteerStats('volunteer-1', 'invalid-date')
      ).rejects.toThrow(
        new BadRequestException('Invalid start date format. Use YYYY-MM-DD.')
      );
    });
  });

  describe('generateReports', () => {
    const queryDto = {
      type: 'summary' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
    };

    const mockReport = {
      type: 'summary',
      title: 'דוח פעילות מתנדבים - סיכום',
      generatedAt: new Date(),
      dateRange: {
        from: '2024-01-01',
        to: '2024-01-31',
      },
      summary: {
        totalVolunteers: 5,
        totalActivities: 25,
        totalHours: 100,
        averageHoursPerVolunteer: 20,
      },
      data: [],
      charts: {},
    };

    it('should generate reports', async () => {
      mockVolunteersService.generateReports.mockResolvedValue(mockReport);

      const result = await controller.generateReports(queryDto);

      expect(mockVolunteersService.generateReports).toHaveBeenCalledWith(
        queryDto
      );
      expect(result).toEqual(mockReport);
    });
  });

  describe('getActivityTypes', () => {
    const mockActivityTypes = ['אירוע', 'הכשרה', 'ליווי', 'עזרה טכנית'];

    it('should return activity types', async () => {
      mockVolunteersService.getActivityTypes.mockResolvedValue(
        mockActivityTypes
      );

      const result = await controller.getActivityTypes();

      expect(mockVolunteersService.getActivityTypes).toHaveBeenCalled();
      expect(result).toEqual(mockActivityTypes);
    });
  });
});
