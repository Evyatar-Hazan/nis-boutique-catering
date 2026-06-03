import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Electric wheelchair',
    description: 'Product name',
  })
  @IsString({ message: 'Product name must be a string' })
  @IsNotEmpty({ message: 'Product name is a required field' })
  @MinLength(2, { message: 'Product name must contain at least 2 characters' })
  @MaxLength(100, {
    message: 'Product name must contain less than 100 characters',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Advanced electric wheelchair with electronic control',
    description: 'Product description',
  })
  @IsOptional()
  @IsString({ message: 'Product description must be a string' })
  @MaxLength(500, {
    message: 'Product description must contain less than 500 characters',
  })
  description?: string;

  @ApiProperty({
    example: 'Wheelchairs',
    description: 'Product category',
  })
  @IsString({ message: 'Product category must be a string' })
  @IsNotEmpty({ message: 'Product category is a required field' })
  @MaxLength(50, {
    message: 'Product category must contain less than 50 characters',
  })
  category: string;

  @ApiPropertyOptional({
    example: 'Invacare',
    description: 'Product manufacturer',
  })
  @IsOptional()
  @IsString({ message: 'Product manufacturer must be a string' })
  @MaxLength(50, {
    message: 'Manufacturer name must contain less than 50 characters',
  })
  manufacturer?: string;

  @ApiPropertyOptional({
    example: 'Pronto M41',
    description: 'Product model',
  })
  @IsOptional()
  @IsString({ message: 'Product model must be a string' })
  @MaxLength(50, {
    message: 'Product model must contain less than 50 characters',
  })
  model?: string;
}
