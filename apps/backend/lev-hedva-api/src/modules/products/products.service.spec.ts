import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException, ConflictException } from '@nestjs/common';

const mockPrisma = () => ({
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  productInstance: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

const mockAuditService = () => ({
  logUserAction: jest.fn(),
  logSecurityEvent: jest.fn(),
  logDataChange: jest.fn(),
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: ReturnType<typeof mockPrisma>;
  let auditService: ReturnType<typeof mockAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService) as unknown as ReturnType<typeof mockPrisma>;
    auditService = module.get(AuditService) as unknown as ReturnType<typeof mockAuditService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('returns created product with stats', async () => {
      const dto = { name: 'Chair', category: 'seating' } as any;
      const created = {
        id: 'c1',
        name: 'Chair',
        category: 'seating',
        description: null,
        manufacturer: null,
        model: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { instances: 0 },
      };

      prisma.product.create.mockResolvedValue(created);

      const res = await service.createProduct(dto);

      expect(prisma.product.create).toHaveBeenCalled();
      expect(res.id).toBe(created.id);
      expect(res.totalInstances).toBe(0);
    });

    it('throws ConflictException on unique constraint', async () => {
      const dto = { name: 'Chair', category: 'seating' } as any;
      const error: any = new Error('Unique');
      error.code = 'P2002';
      prisma.product.create.mockRejectedValue(error);

      await expect(service.createProduct(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findProductById', () => {
    it('returns product when found', async () => {
      const product = {
        id: 'p1',
        name: 'Wheelchair',
        category: 'mobility',
        description: null,
        manufacturer: null,
        model: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        _count: { instances: 2 },
        instances: [
          { isAvailable: true, loans: [] },
          { isAvailable: false, loans: [{ status: 'ACTIVE' }] },
        ],
      };

      prisma.product.findUnique.mockResolvedValue(product);

      const res = await service.findProductById('p1');

      expect(res.id).toBe('p1');
      expect(res.totalInstances).toBe(2);
      expect(res.availableInstances).toBe(1);
      expect(res.loanedInstances).toBe(1);
    });

    it('throws NotFoundException when not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findProductById('not-exist')).rejects.toThrow(NotFoundException);
    });
  });
});
