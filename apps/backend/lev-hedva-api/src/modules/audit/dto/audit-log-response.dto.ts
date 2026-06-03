import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditActionType, AuditEntityType } from './create-audit-log.dto';

export class UserBasicInfoDto {
  @ApiProperty({
    description: 'מזהה המשתמש',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'שם פרטי',
    example: 'דוד',
  })
  firstName: string;

  @ApiProperty({
    description: 'שם משפחה',
    example: 'כהן',
  })
  lastName: string;

  @ApiProperty({
    description: 'כתובת אימייל',
    format: 'email',
    example: 'david@example.com',
  })
  email: string;
}

export class AuditLogResponseDto {
  @ApiProperty({
    description: 'מזהה יחודי של לוג הביקורת',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'סוג הפעולה שבוצעה',
    enum: AuditActionType,
  })
  action: AuditActionType;

  @ApiProperty({
    description: 'סוג הישות על הפעולה בוצעה',
    enum: AuditEntityType,
  })
  entityType: AuditEntityType;

  @ApiPropertyOptional({
    description: 'מזהה הישות שעליה בוצעה הפעולה',
  })
  entityId?: string;

  @ApiPropertyOptional({
    description: 'פרטי המשתמש שביצע הפעולה',
    type: UserBasicInfoDto,
  })
  user?: UserBasicInfoDto;

  @ApiPropertyOptional({
    description: 'כתובת IP ממנה בוצעה הפעולה',
  })
  ipAddress?: string;

  @ApiPropertyOptional({
    description: 'User Agent של הדפדפן',
  })
  userAgent?: string;

  @ApiProperty({
    description: 'תיאור הפעולה שבוצעה',
  })
  description: string;

  @ApiPropertyOptional({
    description: 'נתונים נוספים בפורמט JSON',
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'נתיב API שבוצע',
  })
  endpoint?: string;

  @ApiPropertyOptional({
    description: 'שיטת HTTP',
  })
  httpMethod?: string;

  @ApiPropertyOptional({
    description: 'קוד סטטוס HTTP',
  })
  statusCode?: number;

  @ApiPropertyOptional({
    description: 'זמן ביצוע הפעולה במילישניות',
  })
  executionTime?: number;

  @ApiPropertyOptional({
    description: 'הודעת שגיאה (במקרה של שגיאה)',
  })
  errorMessage?: string;

  @ApiProperty({
    description: 'תאריך ושעת יצירת הלוג',
    format: 'date-time',
  })
  createdAt: Date;
}