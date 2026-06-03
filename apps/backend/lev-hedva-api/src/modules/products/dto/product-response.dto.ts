import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  category: string;

  @ApiProperty({ required: false })
  manufacturer?: string;

  @ApiProperty({ required: false })
  model?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  totalInstances?: number;

  @ApiPropertyOptional()
  availableInstances?: number;

  @ApiPropertyOptional()
  loanedInstances?: number;

  @ApiPropertyOptional({ type: [Object] })
  instances?: ProductInstanceResponseDto[];
}

export class ProductInstanceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  barcode: string;

  @ApiProperty({ required: false })
  serialNumber?: string;

  @ApiProperty()
  condition: string;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  product?: ProductResponseDto;

  @ApiPropertyOptional()
  currentLoan?: {
    id: string;
    userId: string;
    loanDate: Date;
    expectedReturnDate?: Date;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export class ProductsListResponseDto {
  @ApiProperty({ type: [ProductResponseDto] })
  products: ProductResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ProductInstancesListResponseDto {
  @ApiProperty({ type: [ProductInstanceResponseDto] })
  instances: ProductInstanceResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}