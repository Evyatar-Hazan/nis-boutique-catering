import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AuditActionType, AuditEntityType } from './create-audit-log.dto';

export class AuditLogsQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Free text search',
    example: 'user',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by action type',
    enum: AuditActionType,
  })
  @IsOptional()
  @IsEnum(AuditActionType)
  action?: AuditActionType;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: AuditEntityType,
  })
  @IsOptional()
  @IsEnum(AuditEntityType)
  entityType?: AuditEntityType;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by user ID',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by IP address',
  })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'From date',
    format: 'date',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'To date',
    format: 'date',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'action', 'entityType', 'userId'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsEnum(['createdAt', 'action', 'entityType', 'userId'])
  sortBy?: 'createdAt' | 'action' | 'entityType' | 'userId' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({
    description: 'Filter by HTTP status code',
    example: 200,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'Search only actions with errors',
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  errorsOnly?: boolean = false;
}
