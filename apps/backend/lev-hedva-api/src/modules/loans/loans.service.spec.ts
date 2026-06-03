import { Test, TestingModule } from '@nestjs/testing';
import { LoansService } from './loans.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LoanStatus } from '@prisma/client';

const mockPrisma = () => ({
  user: {
    findUnique: jest.fn(),
  },
  productInstance: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  loan: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
});

const mockAuditService = () => ({
  logUserAction: jest.fn(),
  logSecurityEvent: jest.fn(),
  logDataChange: jest.fn(),
});

describe('LoansService', () => {
  let service: LoansService;
  let prisma: ReturnType<typeof mockPrisma>;
  let auditService: ReturnType<typeof mockAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoansService,
        { provide: PrismaService, useFactory: mockPrisma },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    service = module.get<LoansService>(LoansService);
    prisma = module.get(PrismaService) as unknown as ReturnType<
      typeof mockPrisma
    >;
    auditService = module.get(AuditService) as unknown as ReturnType<
      typeof mockAuditService
    >;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLoan', () => {
    const mockUser = { id: 'u1', isActive: true };
    const mockProduct = {
      id: 'pi1',
      isAvailable: true,
      product: { id: 'p1', name: 'Wheelchair' },
      loans: [],
    };

    beforeEach(() => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.productInstance.findUnique.mockResolvedValue(mockProduct);
      prisma.loan.count.mockResolvedValue(0);
    });

    it('creates a loan successfully', async () => {
      const dto = { userId: 'u1', productInstanceId: 'pi1' } as any;
      const mockLoan = {
        id: 'l1',
        userId: 'u1',
        productInstanceId: 'pi1',
        status: LoanStatus.ACTIVE,
        loanDate: new Date(),
        user: mockUser,
        productInstance: mockProduct,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.loan.create.mockResolvedValue(mockLoan);

      const result = await service.createLoan(dto);

      expect(prisma.loan.create).toHaveBeenCalled();
      expect(prisma.productInstance.update).toHaveBeenCalledWith({
        where: { id: 'pi1' },
        data: { isAvailable: false },
      });
      expect(result.id).toBe('l1');
    });

    it('throws NotFoundException for invalid user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const dto = { userId: 'invalid', productInstanceId: 'pi1' } as any;

      await expect(service.createLoan(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException for unavailable product', async () => {
      prisma.productInstance.findUnique.mockResolvedValue({
        ...mockProduct,
        isAvailable: false,
      });
      const dto = { userId: 'u1', productInstanceId: 'pi1' } as any;

      await expect(service.createLoan(dto)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException for too many active loans', async () => {
      prisma.loan.count.mockResolvedValue(3); // MAX_ACTIVE_LOANS = 3
      const dto = { userId: 'u1', productInstanceId: 'pi1' } as any;

      await expect(service.createLoan(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('returnLoan', () => {
    const mockLoan = {
      id: 'l1',
      status: LoanStatus.ACTIVE,
      productInstanceId: 'pi1',
      notes: 'Original notes',
      productInstance: { condition: 'good' },
    };

    beforeEach(() => {
      prisma.loan.findUnique.mockResolvedValue(mockLoan);
    });

    it('returns loan successfully', async () => {
      const dto = {
        loanId: 'l1',
        returnNotes: 'Returned in good condition',
      } as any;
      const updatedLoan = {
        ...mockLoan,
        status: LoanStatus.RETURNED,
        actualReturnDate: new Date(),
        user: {
          id: 'u1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
        },
        productInstance: { id: 'pi1', product: { id: 'p1' } },
      };

      prisma.loan.update.mockResolvedValue(updatedLoan);

      const result = await service.returnLoan(dto);

      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: {
          status: LoanStatus.RETURNED,
          actualReturnDate: expect.any(Date),
          notes: 'Original notes\nהחזרה: Returned in good condition',
        },
        include: expect.any(Object),
      });
      expect(prisma.productInstance.update).toHaveBeenCalledWith({
        where: { id: 'pi1' },
        data: { isAvailable: true, condition: 'good' },
      });
      expect(result.status).toBe(LoanStatus.RETURNED);
    });

    it('throws NotFoundException for non-existent loan', async () => {
      prisma.loan.findUnique.mockResolvedValue(null);
      const dto = { loanId: 'invalid' } as any;

      await expect(service.returnLoan(dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for already returned loan', async () => {
      prisma.loan.findUnique.mockResolvedValue({
        ...mockLoan,
        status: LoanStatus.RETURNED,
      });
      const dto = { loanId: 'l1' } as any;

      await expect(service.returnLoan(dto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('getOverdueLoans', () => {
    it('returns overdue loans', async () => {
      const overdueLoans = [
        {
          id: 'l1',
          status: LoanStatus.ACTIVE,
          expectedReturnDate: new Date(Date.now() - 86400000), // 1 day ago
          user: {
            id: 'u1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
          },
          productInstance: { id: 'pi1', product: { id: 'p1' } },
          loanDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prisma.loan.updateMany.mockResolvedValue({ count: 1 });
      prisma.loan.findMany.mockResolvedValue(overdueLoans);

      const result = await service.getOverdueLoans();

      // First call updates loans to OVERDUE status
      expect(prisma.loan.updateMany).toHaveBeenCalledWith({
        where: {
          status: LoanStatus.ACTIVE,
          expectedReturnDate: { lt: expect.any(Date) },
        },
        data: {
          status: LoanStatus.OVERDUE,
        },
      });

      // Then finds loans with OVERDUE status
      expect(prisma.loan.findMany).toHaveBeenCalledWith({
        where: {
          status: LoanStatus.OVERDUE,
        },
        include: expect.objectContaining({
          user: expect.any(Object),
          productInstance: expect.any(Object),
        }),
        orderBy: { expectedReturnDate: 'asc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('markLoanAsLost', () => {
    it('marks loan as lost successfully', async () => {
      const mockLoan = {
        id: 'l1',
        status: LoanStatus.ACTIVE,
        productInstanceId: 'pi1',
        notes: 'Original notes',
      };

      const updatedLoan = {
        ...mockLoan,
        status: LoanStatus.LOST,
        user: {
          id: 'u1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
        },
        productInstance: { id: 'pi1', product: { id: 'p1' } },
      };

      prisma.loan.findUnique.mockResolvedValue(mockLoan);
      prisma.loan.update.mockResolvedValue(updatedLoan);

      const result = await service.markLoanAsLost('l1', 'Item reported lost');

      expect(prisma.loan.update).toHaveBeenCalledWith({
        where: { id: 'l1' },
        data: {
          status: LoanStatus.LOST,
          notes: 'Original notes\nאבוד: Item reported lost',
        },
        include: expect.any(Object),
      });
      expect(prisma.productInstance.update).toHaveBeenCalledWith({
        where: { id: 'pi1' },
        data: { isAvailable: false },
      });
      expect(result.status).toBe(LoanStatus.LOST);
    });

    it('throws BadRequestException for non-active loan', async () => {
      prisma.loan.findUnique.mockResolvedValue({
        id: 'l1',
        status: LoanStatus.RETURNED,
      });

      await expect(service.markLoanAsLost('l1')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
