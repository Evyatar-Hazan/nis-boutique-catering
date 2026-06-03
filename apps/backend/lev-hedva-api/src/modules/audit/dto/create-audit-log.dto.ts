import {
  IsString,
  IsEnum,
  IsObject,
  IsOptional,
  IsUUID,
  IsIP,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  READ = 'READ',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  FAILED_LOGIN = 'FAILED_LOGIN',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PERMISSION_CHANGE = 'PERMISSION_CHANGE',
  SYSTEM_EVENT = 'SYSTEM_EVENT',
  ERROR = 'ERROR',
}

export enum AuditEntityType {
  USER = 'USER',
  PRODUCT = 'PRODUCT',
  PRODUCT_INSTANCE = 'PRODUCT_INSTANCE',
  LOAN = 'LOAN',
  VOLUNTEER_ACTIVITY = 'VOLUNTEER_ACTIVITY',
  AUTH = 'AUTH',
  SYSTEM = 'SYSTEM',
}

export class CreateAuditLogDto {
  @ApiProperty({
    description: 'Type of action performed',
    enum: AuditActionType,
    example: AuditActionType.CREATE,
  })
  @IsEnum(AuditActionType)
  action: AuditActionType;

  @ApiProperty({
    description: 'Type of entity the action was performed on',
    enum: AuditEntityType,
    example: AuditEntityType.USER,
  })
  @IsEnum(AuditEntityType)
  entityType: AuditEntityType;

  @ApiPropertyOptional({
    description: 'Entity ID on which the action was performed',
    format: 'uuid',
    example: 'user-123',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'ID of the user who performed the action',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({
    description: 'IP address from which the action was performed',
    format: 'ipv4',
    example: '192.168.1.100',
  })
  @IsOptional()
  @IsIP()
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'Browser User Agent',
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiProperty({
    description: 'Description of the action performed',
    example: 'New user created in the system',
  })
  @IsString()
  description: string;

  @ApiPropertyOptional({
    description: 'Additional data in JSON format',
    example: {
      oldValue: 'old value',
      newValue: 'new value',
      additionalInfo: 'additional info',
    },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'נתיב API שבוצע',
    example: '/api/users',
  })
  @IsOptional()
  @IsString()
  endpoint?: string;

  @ApiPropertyOptional({
    description: 'HTTP method',
    example: 'POST',
  })
  @IsOptional()
  @IsString()
  httpMethod?: string;

  @ApiPropertyOptional({
    description: 'HTTP status code',
    example: 201,
  })
  @IsOptional()
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'Action execution time in milliseconds',
    example: 150,
  })
  @IsOptional()
  executionTime?: number;

  @ApiPropertyOptional({
    description: 'Error message (in case of error)',
    example: 'User not found',
  })
  @IsOptional()
  @IsString()
  errorMessage?: string;
}
