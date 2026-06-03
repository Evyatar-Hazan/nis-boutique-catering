import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import {
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRole } from '@prisma/client';
import {
  createMockPrismaService,
  createMockAuditService,
  createMockJwtService,
  createMockConfigService,
} from '../../../test/helpers/test-utils';
import { UserFactory } from '../../../test/factories';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createMockPrismaService>;
  let jwtService: ReturnType<typeof createMockJwtService>;
  let configService: ReturnType<typeof createMockConfigService>;
  let auditService: ReturnType<typeof createMockAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useFactory: createMockPrismaService },
        { provide: JwtService, useFactory: createMockJwtService },
        { provide: ConfigService, useFactory: createMockConfigService },
        { provide: AuditService, useFactory: createMockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService) as any;
    jwtService = module.get(JwtService) as any;
    configService = module.get(ConfigService) as any;
    auditService = module.get(AuditService) as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0501234567',
      role: UserRole.CLIENT,
    };

    it('should successfully register a new user', async () => {
      const mockUser = UserFactory.create({
        ...registerDto,
        password: 'hashed-password',
        userPermissions: [],
      });

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const existingUser = UserFactory.create({ email: registerDto.email });
      prisma.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should hash password with correct salt rounds', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(UserFactory.create());
      prisma.user.update.mockResolvedValue(UserFactory.create());

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
    });

    it('should default role to CLIENT if not provided', async () => {
      const dtoWithoutRole = { ...registerDto };
      delete (dtoWithoutRole as any).role;

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockResolvedValue(
        UserFactory.create({ role: UserRole.CLIENT })
      );
      prisma.user.update.mockResolvedValue(UserFactory.create());

      await service.register(dtoWithoutRole);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: UserRole.CLIENT,
          }),
        })
      );
    });

    it('should log successful registration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const mockUser = UserFactory.create();
      prisma.user.create.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(auditService.logUserAction).toHaveBeenCalledWith(
        'CREATE',
        'USER',
        expect.any(String), // Accept any string (English or Hebrew)
        mockUser.id,
        mockUser.id,
        expect.any(Object)
      );
    });

    it('should throw InternalServerErrorException on database error', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.user.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      const mockUser = UserFactory.create({
        email: loginDto.email,
        password: 'hashed-password',
        userPermissions: [],
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login(loginDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
        include: expect.any(Object),
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const mockUser = UserFactory.create({ email: loginDto.email });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const inactiveUser = UserFactory.createInactive({
        email: loginDto.email,
      });
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'החשבון שלך אינו פעיל. אנא פנה למנהל המערכת לשחרור החשבון.'
      );
    });

    it('should log failed login attempt for inactive user', async () => {
      const inactiveUser = UserFactory.createInactive({
        email: loginDto.email,
      });
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      try {
        await service.login(loginDto);
      } catch (error) {
        // Expected to throw
      }

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        'FAILED_LOGIN',
        expect.stringContaining('חשבון לא פעיל'),
        inactiveUser.id,
        undefined,
        undefined,
        expect.objectContaining({
          email: loginDto.email,
          reason: 'חשבון לא פעיל',
        })
      );
    });

    it('should update lastLogin timestamp on successful login', async () => {
      const mockUser = UserFactory.create({ email: loginDto.email });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          lastLogin: expect.any(Date),
        }),
      });
    });

    it('should log successful login', async () => {
      const mockUser = UserFactory.create({ email: loginDto.email });
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.user.update.mockResolvedValue(mockUser);

      await service.login(loginDto);

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        'LOGIN',
        expect.stringContaining(loginDto.email),
        mockUser.id,
        undefined,
        undefined,
        expect.any(Object)
      );
    });

    it('should log failed login attempts', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      try {
        await service.login(loginDto);
      } catch (error) {
        // Expected to throw
      }

      expect(auditService.logSecurityEvent).toHaveBeenCalledWith(
        'FAILED_LOGIN',
        expect.any(String),
        undefined,
        undefined,
        undefined,
        expect.any(Object)
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password for valid credentials', async () => {
      const mockUser = UserFactory.create({
        email: 'test@example.com',
        password: 'hashed-password',
      });

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBeUndefined();
      expect(result.refreshToken).toBeUndefined();
    });

    it('should return null for invalid password', async () => {
      const mockUser = UserFactory.create();
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(
        'nonexistent@example.com',
        'pass'
      );

      expect(result).toBeNull();
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = UserFactory.createInactive();
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('validateUserById', () => {
    it('should return user for valid and active user ID', async () => {
      const mockUser = UserFactory.create();
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUserById(mockUser.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(mockUser.id);
    });

    it('should return null for inactive user', async () => {
      const inactiveUser = UserFactory.createInactive();
      prisma.user.findUnique.mockResolvedValue(inactiveUser);

      const result = await service.validateUserById(inactiveUser.id);

      expect(result).toBeNull();
    });

    it('should return null for non-existent user ID', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUserById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('edge cases and security', () => {
    it('should handle SQL injection attempts in email', async () => {
      const maliciousDto = {
        email: "'; DROP TABLE users; --",
        password: 'password',
      };

      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(maliciousDto as any)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle extremely long passwords', async () => {
      const longPassword = 'a'.repeat(10000);
      const registerDto = {
        email: 'test@example.com',
        password: longPassword,
        firstName: 'John',
        lastName: 'Doe',
        phone: '0501234567',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue(UserFactory.create());
      prisma.user.update.mockResolvedValue(UserFactory.create());

      await service.register(registerDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 12);
    });

    it('should handle special characters in email', async () => {
      const specialEmailDto = {
        email: 'test+tag@sub.example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      prisma.user.create.mockResolvedValue(UserFactory.create(specialEmailDto));
      prisma.user.update.mockResolvedValue(UserFactory.create());

      const result = await service.register(specialEmailDto);

      expect(result.user.email).toBe(specialEmailDto.email);
    });
  });
});
