import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateProductInstanceDto {
  @ApiProperty({
    example: 'cuid123456789',
    description: 'Product ID that this instance belongs to',
  })
  @IsString({ message: 'Product ID must be a string' })
  @IsNotEmpty({ message: 'Product ID is a required field' })
  productId: string;

  @ApiProperty({
    example: 'WC001',
    description: 'Product barcode (unique identifier)',
  })
  @IsString({ message: 'Product barcode must be a string' })
  @IsNotEmpty({ message: 'Product barcode is a required field' })
  @MaxLength(50, {
    message: 'Product barcode must contain less than 50 characters',
  })
  barcode: string;

  @ApiPropertyOptional({
    example: 'IC-PM41-001',
    description: 'Product serial number',
  })
  @IsOptional()
  @IsString({ message: 'Serial number must be a string' })
  @MaxLength(50, {
    message: 'Serial number must contain less than 50 characters',
  })
  serialNumber?: string;

  @ApiProperty({
    example: 'excellent',
    description: 'Product condition',
    enum: ['excellent', 'good', 'fair', 'poor', 'needs-repair'],
  })
  @IsString({ message: 'Product condition must be a string' })
  @IsIn(['excellent', 'good', 'fair', 'poor', 'needs-repair'], {
    message: 'Product condition must be one of the allowed values',
  })
  condition: string;

  @ApiPropertyOptional({
    example: 'Warehouse A - Floor 2',
    description: 'Product location',
  })
  @IsOptional()
  @IsString({ message: 'Product location must be a string' })
  @MaxLength(100, {
    message: 'Product location must contain less than 100 characters',
  })
  location?: string;

  @ApiPropertyOptional({
    example: 'Battery replaced, tested in lab',
    description: 'Additional notes about the product instance',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must contain less than 500 characters' })
  notes?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Is product available for loan',
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Product availability must be true or false' })
  isAvailable?: boolean;
}
