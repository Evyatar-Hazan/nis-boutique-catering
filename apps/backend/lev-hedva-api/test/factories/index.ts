/**
 * Mock factories for creating test data
 * Provides consistent and reusable mock objects for tests
 */

import { UserRole, LoanStatus } from '@prisma/client';

/**
 * User mock factory
 */
export class UserFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'user-test-id-123',
      email: 'test@example.com',
      password: '$2b$12$hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      phone: '0501234567',
      address: '123 Test St',
      role: UserRole.CLIENT,
      isActive: true,
      refreshToken: null,
      lastLogin: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      userPermissions: [],
      loans: [],
      volunteerActivity: [],
      auditLogs: [],
      sessions: [],
      ...overrides,
    };
  }

  static createAdmin(overrides?: Partial<any>) {
    return this.create({
      id: 'admin-test-id-123',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      ...overrides,
    });
  }

  static createVolunteer(overrides?: Partial<any>) {
    return this.create({
      id: 'volunteer-test-id-123',
      email: 'volunteer@example.com',
      role: UserRole.VOLUNTEER,
      ...overrides,
    });
  }

  static createWorker(overrides?: Partial<any>) {
    return this.create({
      id: 'worker-test-id-123',
      email: 'worker@example.com',
      role: UserRole.WORKER,
      ...overrides,
    });
  }

  static createInactive(overrides?: Partial<any>) {
    return this.create({
      isActive: false,
      ...overrides,
    });
  }

  static createWithPermissions(permissions: any[], overrides?: Partial<any>) {
    return this.create({
      userPermissions: permissions.map((permission) => ({
        userId: overrides?.id || 'user-test-id-123',
        permissionId: permission.id,
        permission,
      })),
      ...overrides,
    });
  }

  static createMultiple(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        id: `user-test-id-${i + 1}`,
        email: `user${i + 1}@example.com`,
        ...overrides,
      })
    );
  }
}

/**
 * Product mock factory
 */
export class ProductFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'product-test-id-123',
      name: 'Test Wheelchair',
      category: 'mobility',
      description: 'Test wheelchair for testing',
      manufacturer: 'Test Manufacturer',
      model: 'Model X',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      instances: [],
      _count: { instances: 0 },
      ...overrides,
    };
  }

  static createWithInstances(instanceCount: number, overrides?: Partial<any>) {
    const instances = Array.from({ length: instanceCount }, (_, i) =>
      ProductInstanceFactory.create({
        id: `instance-${i + 1}`,
        productId: overrides?.id || 'product-test-id-123',
      })
    );

    return this.create({
      instances,
      _count: { instances: instanceCount },
      ...overrides,
    });
  }
}

/**
 * Product Instance mock factory
 */
export class ProductInstanceFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'instance-test-id-123',
      productId: 'product-test-id-123',
      serialNumber: 'SN-TEST-123',
      condition: 'good',
      purchaseDate: new Date('2024-01-01'),
      warrantyExpiry: new Date('2026-01-01'),
      isAvailable: true,
      notes: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      product: null,
      loans: [],
      ...overrides,
    };
  }

  static createAvailable(overrides?: Partial<any>) {
    return this.create({
      isAvailable: true,
      ...overrides,
    });
  }

  static createUnavailable(overrides?: Partial<any>) {
    return this.create({
      isAvailable: false,
      ...overrides,
    });
  }
}

/**
 * Loan mock factory
 */
export class LoanFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'loan-test-id-123',
      userId: 'user-test-id-123',
      productInstanceId: 'instance-test-id-123',
      status: LoanStatus.ACTIVE,
      loanDate: new Date('2025-01-01'),
      expectedReturnDate: new Date('2025-02-01'),
      actualReturnDate: null,
      notes: null,
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      user: null,
      productInstance: null,
      ...overrides,
    };
  }

  static createActive(overrides?: Partial<any>) {
    return this.create({
      status: LoanStatus.ACTIVE,
      actualReturnDate: null,
      ...overrides,
    });
  }

  static createReturned(overrides?: Partial<any>) {
    return this.create({
      status: LoanStatus.RETURNED,
      actualReturnDate: new Date('2025-01-15'),
      ...overrides,
    });
  }

  static createOverdue(overrides?: Partial<any>) {
    return this.create({
      status: LoanStatus.OVERDUE,
      expectedReturnDate: new Date(Date.now() - 86400000 * 7), // 7 days ago
      ...overrides,
    });
  }

  static createLost(overrides?: Partial<any>) {
    return this.create({
      status: LoanStatus.LOST,
      ...overrides,
    });
  }
}

/**
 * Volunteer Activity mock factory
 */
export class VolunteerActivityFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'activity-test-id-123',
      volunteerId: 'volunteer-test-id-123',
      activityType: 'delivery',
      description: 'Delivered medical equipment',
      hours: 4,
      date: new Date('2025-01-01'),
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      volunteer: null,
      ...overrides,
    };
  }

  static createMultiple(count: number, overrides?: Partial<any>): any[] {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        id: `activity-test-id-${i + 1}`,
        date: new Date(Date.now() - i * 86400000), // Each day earlier
        ...overrides,
      })
    );
  }
}

/**
 * Audit Log mock factory
 */
export class AuditLogFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'audit-test-id-123',
      action: 'CREATE',
      entityType: 'USER',
      entityId: 'entity-id-123',
      userId: 'user-test-id-123',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent',
      description: 'Test audit log',
      metadata: {},
      endpoint: '/api/test',
      httpMethod: 'POST',
      statusCode: 201,
      executionTime: 100,
      errorMessage: null,
      createdAt: new Date('2025-01-01'),
      user: null,
      ...overrides,
    };
  }
}

/**
 * Permission mock factory
 */
export class PermissionFactory {
  static create(overrides?: Partial<any>) {
    return {
      id: 'permission-test-id-123',
      name: 'test:read',
      description: 'Test read permission',
      category: 'test',
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
      userPermissions: [],
      ...overrides,
    };
  }

  static createMultiple(names: string[]): any[] {
    return names.map((name, i) =>
      this.create({
        id: `permission-test-id-${i + 1}`,
        name,
        description: `Permission for ${name}`,
      })
    );
  }
}
