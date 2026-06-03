import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import {
  createMockPrismaService,
  createMockAuditService,
} from '../../../test/helpers/test-utils';
import { UserFactory, PermissionFactory } from '../../../test/factories';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let auditService: ReturnType<typeof createMockAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useFactory: createMockPrismaService },
        { provide: AuditService, useFactory: createMockAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService) as any;
    auditService = module.get(AuditService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0501234567',
      role: UserRole.CLIENT,
      isActive: true,
    };

    const creatorId = 'admin-id-123';

    it('should successfully create a new user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const mockUser = UserFactory.create(createUserDto);
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto as any, creatorId);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: createUserDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = UserFactory.create({ email: createUserDto.email });
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.create(createUserDto as any, creatorId)
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with 12 salt rounds', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(UserFactory.create());

      await service.create(createUserDto as any, creatorId);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 12);
    });

    it('should default isActive to true if not provided', async () => {
      const dtoWithoutActive = { ...createUserDto };
      delete (dtoWithoutActive as any).isActive;

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(UserFactory.create());

      await service.create(dtoWithoutActive as any, creatorId);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should log user creation', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const mockUser = UserFactory.create();
      prisma.user.create.mockResolvedValue(mockUser);

      await service.create(createUserDto as any, creatorId);

      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'CREATE',
        'USER',
        expect.stringContaining(mockUser.email),
        creatorId,
        mockUser.id,
        expect.any(Object)
      );
    });

    it('should throw BadRequestException on database error', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.create(createUserDto as any, creatorId)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default parameters', async () => {
      const mockUsers = UserFactory.createMultiple(10);
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(25);

      const result = await service.findAll({});

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
      expect(result.users).toHaveLength(10);
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3);
    });

    it('should filter users by search term', async () => {
      const mockUsers = [UserFactory.create({ email: 'john@example.com' })];
      prisma.user.findMany.mockResolvedValue(mockUsers);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({ search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter users by role', async () => {
      const mockAdmins = [UserFactory.createAdmin()];
      prisma.user.findMany.mockResolvedValue(mockAdmins);
      prisma.user.count.mockResolvedValue(1);

      await service.findAll({ role: UserRole.ADMIN });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: UserRole.ADMIN,
          }),
        })
      );
    });

    it('should filter users by isActive status', async () => {
      const mockActiveUsers = UserFactory.createMultiple(5);
      prisma.user.findMany.mockResolvedValue(mockActiveUsers);
      prisma.user.count.mockResolvedValue(5);

      await service.findAll({ isActive: true });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isActive: true,
          }),
        })
      );
    });

    it('should support custom pagination', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ page: 3, limit: 20 });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        })
      );
    });

    it('should support custom sorting', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ sortBy: 'email', sortOrder: 'asc' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { email: 'asc' },
        })
      );
    });

    it('should calculate total pages correctly', async () => {
      prisma.user.findMany.mockResolvedValue(UserFactory.createMultiple(10));
      prisma.user.count.mockResolvedValue(47);

      const result = await service.findAll({ limit: 10 });

      expect(result.totalPages).toBe(5); // 47 / 10 = 5 pages
    });
  });

  describe('findOne', () => {
    it('should return user by ID', async () => {
      const mockUser = UserFactory.create();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne(mockUser.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: expect.any(Object),
      });
      expect(result.id).toBe(mockUser.id);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    const userId = 'user-id-123';
    const updaterId = 'admin-id-456';
    const updateDto = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '0509876543',
    };

    it('should successfully update user', async () => {
      const existingUser = UserFactory.create({ id: userId });
      const updatedUser = UserFactory.create({ ...existingUser, ...updateDto });

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.update(userId, updateDto as any, updaterId);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateDto,
        include: expect.any(Object),
      });
      expect(result.firstName).toBe(updateDto.firstName);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.update(userId, updateDto as any, updaterId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to existing email', async () => {
      const existingUser = UserFactory.create({ id: userId });
      const anotherUser = UserFactory.create({ email: 'taken@example.com' });

      prisma.user.findUnique
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(anotherUser);

      await expect(
        service.update(userId, { email: 'taken@example.com' } as any, updaterId)
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password if provided in update', async () => {
      const existingUser = UserFactory.create({ id: userId });
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(existingUser);

      await service.update(
        userId,
        { password: 'NewPassword123!' } as any,
        updaterId
      );

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 12);
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: 'new-hashed-password',
          }),
        })
      );
    });

    it('should log user update', async () => {
      const existingUser = UserFactory.create({ id: userId });
      const updatedUser = UserFactory.create({ ...existingUser, ...updateDto });

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue(updatedUser);

      await service.update(userId, updateDto as any, updaterId);

      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'UPDATE',
        'USER',
        expect.any(String),
        updaterId,
        userId,
        expect.objectContaining({
          oldValues: expect.any(Object),
          newValues: expect.any(Object),
        })
      );
    });
  });

  describe('remove', () => {
    const userId = 'user-id-123';
    const deleterId = 'admin-id-456';

    it('should successfully delete user', async () => {
      const mockUser = UserFactory.create({ id: userId });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      const result = await service.remove(userId, deleterId);

      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toHaveProperty('message');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.remove(userId, deleterId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should log user deletion', async () => {
      const mockUser = UserFactory.create({ id: userId });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.delete.mockResolvedValue(mockUser);

      await service.remove(userId, deleterId);

      expect(auditService.logUserAction).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty search results', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.findAll({ search: 'nonexistent' });

      expect(result.users).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    it('should handle very long names in update', async () => {
      const userId = 'user-id-123';
      const existingUser = UserFactory.create({ id: userId });
      const longName = 'A'.repeat(500);

      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({
        ...existingUser,
        firstName: longName,
      });

      await service.update(
        userId,
        { firstName: longName } as any,
        'updater-id'
      );

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('should handle special characters in search', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      const result = await service.findAll({ search: "O'Brien" });

      expect(result).toBeDefined();
      expect(prisma.user.findMany).toHaveBeenCalled();
    });
  });
});
