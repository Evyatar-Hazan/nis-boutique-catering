/**
 * Test helper utilities
 * Provides common testing utilities and helper functions
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Mock Prisma Service for unit tests
 */
export const createMockPrismaService = () => ({
  user: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  productInstance: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  loan: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
  volunteerActivity: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
    groupBy: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
  },
  permission: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userPermission: {
    create: jest.fn(),
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  session: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(createMockPrismaService())),
});

/**
 * Mock Audit Service for unit tests
 */
export const createMockAuditService = () => ({
  createAuditLog: jest.fn(),
  logUserAction: jest.fn(),
  logSecurityEvent: jest.fn(),
  logDataChange: jest.fn(),
  findAllAuditLogs: jest.fn(),
  findAuditLogById: jest.fn(),
  findUserActivityLogs: jest.fn(),
  findSecurityEvents: jest.fn(),
  getAuditStatistics: jest.fn(),
});

/**
 * Mock JWT Service for unit tests
 */
export const createMockJwtService = () => ({
  sign: jest.fn((payload) => `mock-jwt-token-${payload.sub}`),
  verify: jest.fn((token) => ({ sub: 'user-id', email: 'test@example.com' })),
  decode: jest.fn((token) => ({ sub: 'user-id', email: 'test@example.com' })),
});

/**
 * Mock Config Service for unit tests
 */
export const createMockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '1h',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
    };
    return config[key];
  }),
});

/**
 * Create a testing module with common dependencies
 */
export async function createTestingModule(
  providers: any[],
  imports: any[] = []
): Promise<TestingModule> {
  return Test.createTestingModule({
    imports,
    providers,
  }).compile();
}

/**
 * Create a NestJS application for E2E tests
 */
export async function createTestApp(
  moduleFixture: TestingModule
): Promise<INestApplication> {
  const app = moduleFixture.createNestApplication();

  // Apply global pipes (same as main.ts)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  await app.init();
  return app;
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

/**
 * Generate a random email
 */
export function generateRandomEmail(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
}

/**
 * Generate a random phone number
 */
export function generateRandomPhone(): string {
  return `05${Math.floor(10000000 + Math.random() * 90000000)}`;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Create a mock request object for testing
 */
export function createMockRequest(overrides?: Partial<any>) {
  return {
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Test Agent',
      authorization: 'Bearer test-token',
    },
    method: 'GET',
    url: '/test',
    route: {
      path: '/test',
    },
    user: {
      userId: 'user-test-id-123',
      email: 'test@example.com',
      role: 'CLIENT',
    },
    ...overrides,
  };
}

/**
 * Create a mock response object for testing
 */
export function createMockResponse() {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    redirect: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
  return res;
}

/**
 * Assert that an error is thrown with a specific message
 */
export async function expectToThrow(
  fn: () => Promise<any>,
  errorClass: any,
  messagePattern?: string | RegExp
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to throw, but it did not');
  } catch (error) {
    expect(error).toBeInstanceOf(errorClass);
    if (messagePattern) {
      if (typeof messagePattern === 'string') {
        expect(error.message).toContain(messagePattern);
      } else {
        expect(error.message).toMatch(messagePattern);
      }
    }
  }
}

/**
 * Mock Date.now() to return a specific time
 */
export function mockDateNow(time: number | Date): jest.SpyInstance {
  const timestamp = time instanceof Date ? time.getTime() : time;
  return jest.spyOn(Date, 'now').mockReturnValue(timestamp);
}

/**
 * Restore Date.now() after mocking
 */
export function restoreDateNow(spy: jest.SpyInstance): void {
  spy.mockRestore();
}

/**
 * Generate a date in the past
 */
export function dateInPast(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

/**
 * Generate a date in the future
 */
export function dateInFuture(daysFromNow: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
}

/**
 * Clean up database (for integration tests)
 * This is a placeholder - actual implementation depends on test database strategy
 */
export async function cleanupDatabase(prisma: any): Promise<void> {
  // Delete in correct order to respect foreign key constraints
  await prisma.auditLog.deleteMany({});
  await prisma.userPermission.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.volunteerActivity.deleteMany({});
  await prisma.productInstance.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
}
