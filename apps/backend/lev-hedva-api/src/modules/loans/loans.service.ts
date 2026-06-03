import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { LoansQueryDto } from './dto/loan-query.dto';
import {
  LoanResponseDto,
  LoansListResponseDto,
  LoanStatsResponseDto,
} from './dto/loan-response.dto';
import { Prisma, LoanStatus } from '@prisma/client';
import {
  AuditActionType,
  AuditEntityType,
} from '../audit/dto/create-audit-log.dto';
import { clamp } from '@monorepo/shared-utils';

@Injectable()
export class LoansService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService
  ) {}

  async createLoan(createLoanDto: CreateLoanDto): Promise<LoanResponseDto> {
    const { userId, productInstanceId, expectedReturnDate, notes } =
      createLoanDto;

    // Verify user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('משתמש לא נמצא או לא פעיל');
    }

    // Verify product instance exists and is available
    const productInstance = await this.prisma.productInstance.findUnique({
      where: { id: productInstanceId },
      include: {
        product: true,
        loans: {
          where: { status: LoanStatus.ACTIVE },
        },
      },
    });

    if (!productInstance) {
      throw new NotFoundException('פריט המוצר לא נמצא');
    }

    if (!productInstance.isAvailable) {
      throw new ConflictException('פריט המוצר אינו זמין להשאלה');
    }

    if (productInstance.loans.length > 0) {
      throw new ConflictException('פריט המוצר כבר מושאל');
    }

    // Check if user has too many active loans (business rule)
    const userActiveLoans = await this.prisma.loan.count({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
    });

    const MAX_ACTIVE_LOANS = 3; // Business rule: maximum 3 active loans per user
    if (userActiveLoans >= MAX_ACTIVE_LOANS) {
      throw new ConflictException(
        `המשתמש לא יכול לקבל יותר מ-${MAX_ACTIVE_LOANS} השאלות פעילות`
      );
    }

    // Create the loan
    try {
      const loan = await this.prisma.loan.create({
        data: {
          userId,
          productInstanceId,
          status: LoanStatus.ACTIVE,
          loanDate: new Date(),
          expectedReturnDate: expectedReturnDate
            ? new Date(expectedReturnDate)
            : null,
          notes,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          productInstance: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product instance availability
      await this.prisma.productInstance.update({
        where: { id: productInstanceId },
        data: { isAvailable: false },
      });

      return this.formatLoanResponse(loan);
    } catch {
      throw new BadRequestException('שגיאה ביצירת ההשאלה');
    }
  }

  async findAllLoans(
    query: LoansQueryDto,
    user: any
  ): Promise<LoansListResponseDto> {
    // Update status of overdue loans before search
    await this.updateOverdueLoans();

    const {
      search,
      userId,
      status,
      productCategory,
      startDate,
      endDate,
      isOverdue,
      sortBy,
      order,
      page,
      limit,
    } = query;

    const where: Prisma.LoanWhereInput = {};

    // If user is a client, they can only see their own active loans
    if (user.role === 'CLIENT') {
      where.userId = user.userId;
      where.status = LoanStatus.ACTIVE;
    }

    // Text search
    if (search) {
      where.OR = [
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        {
          productInstance: {
            OR: [
              { barcode: { contains: search, mode: 'insensitive' } },
              { serialNumber: { contains: search, mode: 'insensitive' } },
              { product: { name: { contains: search, mode: 'insensitive' } } },
            ],
          },
        },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter by user (only if not a client - clients already filtered above)
    if (userId && user.role !== 'CLIENT') {
      where.userId = userId;
    }

    // Filter by status (only if not a client - clients can only see active)
    if (status && user.role !== 'CLIENT') {
      where.status = status;
    }

    // Filter by product category
    if (productCategory) {
      where.productInstance = {
        product: {
          category: { contains: productCategory, mode: 'insensitive' },
        },
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.loanDate = {};
      if (startDate) {
        where.loanDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.loanDate.lte = new Date(endDate);
      }
    }

    // Filter overdue loans
    if (isOverdue === true) {
      where.status = LoanStatus.OVERDUE;
    }

    // Sorting
    const orderBy: Prisma.LoanOrderByWithRelationInput = {
      [sortBy]: order,
    };

    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          productInstance: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    const formattedLoans = loans.map((loan) => this.formatLoanResponse(loan));

    return {
      loans: formattedLoans,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLoanById(id: string, user: any): Promise<LoanResponseDto> {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        productInstance: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!loan) {
      throw new NotFoundException('השאלה לא נמצאה');
    }

    // If user is a client, they can only see their own loans
    if (user.role === 'CLIENT' && loan.userId !== user.userId) {
      throw new NotFoundException('אין לך הרשאה לצפות בהשאלה זו');
    }

    return this.formatLoanResponse(loan);
  }

  async updateLoan(
    id: string,
    updateLoanDto: UpdateLoanDto
  ): Promise<LoanResponseDto> {
    const { expectedReturnDate, notes, status } = updateLoanDto;

    // Check if loan exists
    const existingLoan = await this.prisma.loan.findUnique({
      where: { id },
    });

    if (!existingLoan) {
      throw new NotFoundException('השאלה לא נמצאה');
    }

    // Allow updating any status for system administrators
    // if (existingLoan.status !== LoanStatus.ACTIVE && existingLoan.status !== LoanStatus.OVERDUE) {
    //   throw new BadRequestException('לא ניתן לUpdate השאלה שאינה פעילה');
    // }

    try {
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (expectedReturnDate) {
        updateData.expectedReturnDate = new Date(expectedReturnDate);
      }

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      if (status) {
        updateData.status = status;

        // עדכון date החזרה בפועל אם הסטטוס משתנה ל-RETURNED
        if (
          status === LoanStatus.RETURNED &&
          existingLoan.status !== LoanStatus.RETURNED
        ) {
          updateData.actualReturnDate = new Date();
        }

        // מחיקת date החזרה בפועל אם הסטטוס משתנה מ-RETURNED
        if (
          status !== LoanStatus.RETURNED &&
          existingLoan.status === LoanStatus.RETURNED
        ) {
          updateData.actualReturnDate = null;
        }
      }

      const loan = await this.prisma.loan.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          productInstance: {
            include: {
              product: true,
            },
          },
        },
      });

      return this.formatLoanResponse(loan);
    } catch {
      throw new BadRequestException('שגיאה בעדכון ההשאלה');
    }
  }

  async returnLoan(returnLoanDto: ReturnLoanDto): Promise<LoanResponseDto> {
    const { loanId, returnCondition, returnNotes } = returnLoanDto;

    // Find the loan
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        productInstance: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('השאלה לא נמצאה');
    }

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new BadRequestException('השאלה כבר הוחזרה או אינה פעילה');
    }

    try {
      // Update loan status and return date
      const updatedLoan = await this.prisma.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          actualReturnDate: new Date(),
          notes: returnNotes
            ? `${loan.notes || ''}\nהחזרה: ${returnNotes}`.trim()
            : loan.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          productInstance: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product instance availability and condition
      await this.prisma.productInstance.update({
        where: { id: loan.productInstanceId },
        data: {
          isAvailable: true,
          condition: returnCondition || loan.productInstance.condition,
        },
      });

      return this.formatLoanResponse(updatedLoan);
    } catch {
      throw new BadRequestException('שגיאה בהחזרת ההשאלה');
    }
  }

  async returnLoanById(id: string, notes?: string): Promise<LoanResponseDto> {
    // Find the loan
    const loan = await this.prisma.loan.findUnique({
      where: { id },
      include: {
        productInstance: true,
      },
    });

    if (!loan) {
      throw new NotFoundException('השאלה לא נמצאה');
    }

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new BadRequestException('השאלה כבר הוחזרה או אינה פעילה');
    }

    try {
      // Update loan status and return date
      const updatedLoan = await this.prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.RETURNED,
          actualReturnDate: new Date(),
          notes: notes
            ? `${loan.notes || ''}\nהחזרה: ${notes}`.trim()
            : loan.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          productInstance: {
            include: {
              product: true,
            },
          },
        },
      });

      // Update product instance availability
      await this.prisma.productInstance.update({
        where: { id: loan.productInstanceId },
        data: {
          isAvailable: true,
        },
      });

      // Log the action in audit
      await this.auditService.createAuditLog({
        userId: loan.userId,
        action: AuditActionType.UPDATE,
        entityType: AuditEntityType.LOAN,
        entityId: id,
        description: 'השאלה הוחזרה',
        metadata: { action: 'loan_returned', notes },
      });

      return this.formatLoanResponse(updatedLoan);
    } catch {
      throw new BadRequestException('שגיאה בהחזרת ההשאלה');
    }
  }

  async markLoanAsLost(id: string, notes?: string): Promise<LoanResponseDto> {
    const loan = await this.prisma.loan.findUnique({
      where: { id },
    });

    if (!loan) {
      throw new NotFoundException('השאלה לא נמצאה');
    }

    if (
      loan.status !== LoanStatus.ACTIVE &&
      loan.status !== LoanStatus.OVERDUE
    ) {
      throw new BadRequestException(
        'רק השאלות פעילות או באיחור יכולות להיות מסומנות כאבודות'
      );
    }

    try {
      const updatedLoan = await this.prisma.loan.update({
        where: { id },
        data: {
          status: LoanStatus.LOST,
          notes: notes
            ? `${loan.notes || ''}\nאבוד: ${notes}`.trim()
            : loan.notes,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          productInstance: {
            include: {
              product: true,
            },
          },
        },
      });

      // Mark product instance as unavailable
      await this.prisma.productInstance.update({
        where: { id: loan.productInstanceId },
        data: { isAvailable: false },
      });

      return this.formatLoanResponse(updatedLoan);
    } catch {
      throw new BadRequestException('שגיאה בסימון ההשאלה כאבודה');
    }
  }

  async getOverdueLoans(): Promise<LoanResponseDto[]> {
    // Update status of overdue loans before search
    await this.updateOverdueLoans();

    const overdueLoans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.OVERDUE,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        productInstance: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        expectedReturnDate: 'asc',
      },
    });

    return overdueLoans.map((loan) => this.formatLoanResponse(loan));
  }

  async getActiveLoans(): Promise<LoanResponseDto[]> {
    // Update status of overdue loans before search
    await this.updateOverdueLoans();

    const activeLoans = await this.prisma.loan.findMany({
      where: {
        status: LoanStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        productInstance: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return activeLoans.map((loan) => this.formatLoanResponse(loan));
  }

  async getLoanStats(): Promise<LoanStatsResponseDto> {
    // עדכון סטטוס השאלות באיחור לפני חישוב הסטטיסטיקות
    await this.updateOverdueLoans();

    const [
      totalActiveLoans,
      totalOverdueLoans,
      totalReturnedLoans,
      totalLostItems,
    ] = await Promise.all([
      this.prisma.loan.count({ where: { status: LoanStatus.ACTIVE } }),
      this.prisma.loan.count({ where: { status: LoanStatus.OVERDUE } }),
      this.prisma.loan.count({ where: { status: LoanStatus.RETURNED } }),
      this.prisma.loan.count({ where: { status: LoanStatus.LOST } }),
    ]);

    // Calculate average loan duration for returned loans
    const returnedLoans = await this.prisma.loan.findMany({
      where: { status: LoanStatus.RETURNED },
      select: { loanDate: true, actualReturnDate: true },
    });

    const averageLoanDuration =
      returnedLoans.length > 0
        ? returnedLoans.reduce((sum, loan) => {
            const duration = loan.actualReturnDate
              ? (loan.actualReturnDate.getTime() - loan.loanDate.getTime()) /
                (1000 * 60 * 60 * 24)
              : 0;
            return sum + duration;
          }, 0) / returnedLoans.length
        : 0;

    // Get loans by category - simplified implementation
    // In production, you'd use raw SQL or aggregate the data differently
    const activeLoansByCategory = await this.prisma.loan.findMany({
      where: { status: LoanStatus.ACTIVE },
      include: {
        productInstance: {
          include: { product: true },
        },
      },
    });

    const categoryCount: Record<string, number> = {};
    activeLoansByCategory.forEach((loan) => {
      const category = loan.productInstance.product.category;
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    const loansByCategory = Object.entries(categoryCount).map(
      ([category, count]) => ({
        category,
        count,
      })
    );

    // Get overdue by user
    const overdueByUser = await this.prisma.loan.groupBy({
      by: ['userId'],
      _count: true,
      where: {
        status: LoanStatus.OVERDUE,
      },
    });

    const overdueByUserWithNames = await Promise.all(
      overdueByUser.map(async (item) => {
        const user = await this.prisma.user.findUnique({
          where: { id: item.userId },
          select: { firstName: true, lastName: true },
        });
        return {
          userId: item.userId,
          userName: user
            ? `${user.firstName} ${user.lastName}`
            : 'משתמש לא ידוע',
          count: item._count,
        };
      })
    );

    return {
      totalActiveLoans,
      totalOverdueLoans,
      totalReturnedLoans,
      totalLostItems,
      averageLoanDuration: Math.round(averageLoanDuration * 100) / 100,
      loansByCategory: loansByCategory,
      overdueByUser: overdueByUserWithNames,
    };
  }

  async getUserActiveLoans(userId: string): Promise<LoanResponseDto[]> {
    const loans = await this.prisma.loan.findMany({
      where: {
        userId,
        status: LoanStatus.ACTIVE,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        productInstance: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        loanDate: 'desc',
      },
    });

    return loans.map((loan) => this.formatLoanResponse(loan));
  }

  private formatLoanResponse(loan: any): LoanResponseDto {
    const now = new Date();

    // השאלה באיחור אם הסטטוס הוא OVERDUE
    const isOverdue = loan.status === LoanStatus.OVERDUE;

    const daysOverdue =
      isOverdue && loan.expectedReturnDate
        ? Math.floor(
            (now.getTime() - new Date(loan.expectedReturnDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : undefined;

    return {
      id: loan.id,
      userId: loan.userId,
      productInstanceId: loan.productInstanceId,
      status: loan.status,
      loanDate: loan.loanDate,
      expectedReturnDate: loan.expectedReturnDate,
      actualReturnDate: loan.actualReturnDate,
      notes: loan.notes,
      createdAt: loan.createdAt,
      updatedAt: loan.updatedAt,
      user: loan.user,
      productInstance: loan.productInstance
        ? {
            id: loan.productInstance.id,
            barcode: loan.productInstance.barcode,
            serialNumber: loan.productInstance.serialNumber,
            condition: loan.productInstance.condition,
            product: loan.productInstance.product,
          }
        : undefined,
      isOverdue,
      daysOverdue,
    };
  }

  /**
   * עדכון אוטומטי של סטטוס השאלות באיחור
   */
  private async updateOverdueLoans(): Promise<void> {
    const now = new Date();

    // מציאת השאלות פעילות שחלף הdate הצפוי להחזרה
    const overdueLoansUpdate = await this.prisma.loan.updateMany({
      where: {
        status: LoanStatus.ACTIVE,
        expectedReturnDate: {
          lt: now,
        },
      },
      data: {
        status: LoanStatus.OVERDUE,
      },
    });

    if (overdueLoansUpdate.count > 0) {
      console.log(`עודכנו ${overdueLoansUpdate.count} השאלות לסטטוס איחור`);
    }
  }
}
