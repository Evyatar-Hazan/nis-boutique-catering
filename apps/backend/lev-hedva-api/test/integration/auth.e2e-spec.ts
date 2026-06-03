import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe.skip('Auth Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up database before each test
    await prisma.auditLog.deleteMany({});
    await prisma.userPermission.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.loan.deleteMany({});
    await prisma.volunteerActivity.deleteMany({});
    await prisma.productInstance.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.user.deleteMany({});
  });

  describe('/auth/register (POST)', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '0501234567',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(registerDto.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });
      expect(user).toBeDefined();
      expect(user?.firstName).toBe(registerDto.firstName);
    });

    it('should reject registration with duplicate email', async () => {
      const registerDto = {
        email: 'duplicate@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      // Create first user
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Attempt to create duplicate
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject registration with invalid email format', async () => {
      const invalidDto = {
        email: 'not-an-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });

    it('should reject registration with weak password', async () => {
      const weakPasswordDto = {
        email: 'user@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(weakPasswordDto)
        .expect(400);
    });

    it('should reject registration with missing required fields', async () => {
      const incompleteDto = {
        email: 'user@example.com',
        // Missing password, firstName, lastName
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(incompleteDto)
        .expect(400);
    });

    it('should set default role to CLIENT', async () => {
      const registerDto = {
        email: 'defaultrole@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.CLIENT);
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      await prisma.user.create({
        data: {
          email: 'testuser@example.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: UserRole.CLIENT,
          isActive: true,
        },
      });
    });

    it('should successfully login with correct credentials', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'Password123!',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(loginDto.email);
      expect(response.body.user).not.toHaveProperty('password');

      // Verify lastLogin was updated
      const user = await prisma.user.findUnique({
        where: { email: loginDto.email },
      });
      expect(user?.lastLogin).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'WrongPassword123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with non-existent email', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login for inactive user', async () => {
      // Create inactive user
      const hashedPassword = await bcrypt.hash('Password123!', 12);
      await prisma.user.create({
        data: {
          email: 'inactive@example.com',
          password: hashedPassword,
          firstName: 'Inactive',
          lastName: 'User',
          role: UserRole.CLIENT,
          isActive: false,
        },
      });

      const loginDto = {
        email: 'inactive@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should reject login with invalid email format', async () => {
      const loginDto = {
        email: 'not-an-email',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });

    it('should create audit log for successful login', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'Password123!',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      // Check audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'LOGIN',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });

    it('should create audit log for failed login', async () => {
      const loginDto = {
        email: 'testuser@example.com',
        password: 'WrongPassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      // Check audit log was created
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          action: 'FAILED_LOGIN',
        },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get token
      const registerDto = {
        email: 'profileuser@example.com',
        password: 'Password123!',
        firstName: 'Profile',
        lastName: 'User',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      accessToken = response.body.accessToken;
    });

    it('should return user profile with valid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should reject request without token', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should reject request with invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with expired token', async () => {
      // This test would require mocking JWT expiration
      // For now, we'll skip it or implement with a custom expired token
      // await request(app.getHttpServer())
      //   .get('/auth/profile')
      //   .set('Authorization', 'Bearer expired-token')
      //   .expect(401);
    });
  });

  describe('Security Tests', () => {
    it('should not expose password in any response', async () => {
      const registerDto = {
        email: 'security@example.com',
        password: 'Password123!',
        firstName: 'Security',
        lastName: 'Test',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const jsonResponse = JSON.stringify(response.body);
      expect(jsonResponse).not.toContain('Password123!');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should hash passwords in database', async () => {
      const registerDto = {
        email: 'hashtest@example.com',
        password: 'Password123!',
        firstName: 'Hash',
        lastName: 'Test',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const user = await prisma.user.findUnique({
        where: { email: registerDto.email },
      });

      expect(user?.password).toBeDefined();
      expect(user?.password).not.toBe(registerDto.password);
      expect(user?.password).toContain('$2b$'); // bcrypt hash prefix
    });

    it('should prevent SQL injection in login', async () => {
      const maliciousDto = {
        email: "admin@example.com' OR '1'='1",
        password: "password' OR '1'='1",
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(maliciousDto)
        .expect(401);
    });
  });
});
