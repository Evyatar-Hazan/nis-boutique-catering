import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanStatus } from '@prisma/client';

export class LoanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  productInstanceId: string;

  @ApiProperty({ enum: LoanStatus })
  status: LoanStatus;

  @ApiProperty()
  loanDate: Date;

  @ApiPropertyOptional()
  expectedReturnDate?: Date;

  @ApiPropertyOptional()
  actualReturnDate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Relations
  @ApiPropertyOptional()
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };

  @ApiPropertyOptional()
  productInstance?: {
    id: string;
    barcode: string;
    serialNumber?: string;
    condition: string;
    product: {
      id: string;
      name: string;
      category: string;
      manufacturer?: string;
      model?: string;
    };
  };

  // Computed fields
  @ApiPropertyOptional()
  isOverdue?: boolean;

  @ApiPropertyOptional()
  daysOverdue?: number;
}

export class LoansListResponseDto {
  @ApiProperty({ type: [LoanResponseDto] })
  loans: LoanResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class LoanStatsResponseDto {
  @ApiProperty()
  totalActiveLoans: number;

  @ApiProperty()
  totalOverdueLoans: number;

  @ApiProperty()
  totalReturnedLoans: number;

  @ApiProperty()
  totalLostItems: number;

  @ApiProperty()
  averageLoanDuration: number;

  @ApiProperty({ type: [Object] })
  loansByCategory: {
    category: string;
    count: number;
  }[];

  @ApiProperty({ type: [Object] })
  overdueByUser: {
    userId: string;
    userName: string;
    count: number;
  }[];
}