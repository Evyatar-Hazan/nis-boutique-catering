import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap, catchError } from 'rxjs';
import { Request, Response } from 'express';
import { AuditService } from '../modules/audit/audit.service';
import { AuditActionType, AuditEntityType } from '../modules/audit/dto/create-audit-log.dto';

interface AuthenticatedUser {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    
    // Extract user information from authenticated request
    const user = request.user as AuthenticatedUser;
    const userId = user?.userId;
    const userAgent = request.headers['user-agent'];
    const ipAddress = this.getClientIp(request);
    const method = request.method;
    const url = request.url;
    const body = this.sanitizeRequestBody(request.body);

    // Skip audit logging for certain endpoints to prevent infinite loops
    if (this.shouldSkipAudit(url)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((data) => {
        const executionTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful request
        this.logRequest({
          userId,
          method,
          url,
          statusCode,
          executionTime,
          ipAddress,
          userAgent,
          requestBody: body,
          responseData: this.sanitizeResponseData(data),
          success: true,
        }).catch((error) => {
          this.logger.error('שגיאה בתיעוד בקשה מוצלחת', error);
        });
      }),
      catchError((error) => {
        const executionTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log failed request
        this.logRequest({
          userId,
          method,
          url,
          statusCode,
          executionTime,
          ipAddress,
          userAgent,
          requestBody: body,
          error,
          success: false,
        }).catch((logError) => {
          this.logger.error('שגיאה בתיעוד בקשה כושלת', logError);
        });

        throw error;
      }),
    );
  }

  private async logRequest(options: {
    userId?: string;
    method: string;
    url: string;
    statusCode: number;
    executionTime: number;
    ipAddress?: string;
    userAgent?: string;
    requestBody?: any;
    responseData?: any;
    error?: any;
    success: boolean;
  }): Promise<void> {
    const {
      userId,
      method,
      url,
      statusCode,
      executionTime,
      ipAddress,
      userAgent,
      requestBody,
      responseData,
      error,
      success,
    } = options;

    try {
      // Determine action type based on HTTP method
      const action = this.getActionFromMethod(method, success);
      const entityType = this.getEntityTypeFromUrl(url);
      const description = this.generateDescription(method, url, success, statusCode);

      if (!success || statusCode >= 400) {
        // Log as error
        await this.auditService.logError(
          description,
          error?.message || `HTTP ${statusCode}`,
          userId,
          url,
          method,
          statusCode,
          {
            requestBody,
            error: error ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            } : undefined,
            userAgent,
            ipAddress,
            executionTime,
          }
        );
      } else {
        // Log as user action
        await this.auditService.logUserAction(
          action,
          entityType,
          description,
          userId,
          this.extractEntityId(url, requestBody),
          {
            requestBody: requestBody,
            responseData: responseData ? this.truncateData(responseData) : undefined,
            userAgent,
            ipAddress,
            executionTime,
            statusCode,
          }
        );
      }
    } catch (auditError) {
      this.logger.error('שגיאה בשירות הביקורת', auditError);
    }
  }

  private getActionFromMethod(method: string, success: boolean): AuditActionType {
    if (!success) {
      return AuditActionType.ERROR;
    }

    switch (method.toLowerCase()) {
      case 'post':
        return AuditActionType.CREATE;
      case 'put':
      case 'patch':
        return AuditActionType.UPDATE;
      case 'delete':
        return AuditActionType.DELETE;
      case 'get':
      default:
        return AuditActionType.READ;
    }
  }

  private getEntityTypeFromUrl(url: string): AuditEntityType {
    const path = url.split('?')[0].toLowerCase();
    
    if (path.includes('/auth')) {
      return AuditEntityType.AUTH;
    } else if (path.includes('/users')) {
      return AuditEntityType.USER;
    } else if (path.includes('/products')) {
      return AuditEntityType.PRODUCT;
    } else if (path.includes('/loans')) {
      return AuditEntityType.LOAN;
    } else if (path.includes('/volunteers')) {
      return AuditEntityType.VOLUNTEER_ACTIVITY;
    } else if (path.includes('/audit') || path.includes('/system')) {
      return AuditEntityType.SYSTEM;
    }

    return AuditEntityType.SYSTEM;
  }

  private generateDescription(
    method: string,
    url: string,
    success: boolean,
    statusCode: number
  ): string {
    const action = this.getHebrewAction(method);
    const entity = this.getHebrewEntity(url);
    const status = success ? 'הצליח' : 'נכשל';
    
    return `${action} ${entity} ${status} (${statusCode})`;
  }

  private getHebrewAction(method: string): string {
    switch (method.toLowerCase()) {
      case 'post':
        return 'יצירת';
      case 'put':
      case 'patch':
        return 'עדכון';
      case 'delete':
        return 'מחיקת';
      case 'get':
        return 'קריאת';
      default:
        return 'פעולה על';
    }
  }

  private getHebrewEntity(url: string): string {
    const path = url.split('?')[0].toLowerCase();
    
    if (path.includes('/auth/login')) {
      return 'התחברות';
    } else if (path.includes('/auth/logout')) {
      return 'התנתקות';
    } else if (path.includes('/auth/register')) {
      return 'הרשמה';
    } else if (path.includes('/auth')) {
      return 'אימות';
    } else if (path.includes('/users')) {
      return 'משתמש';
    } else if (path.includes('/products/instances')) {
      return 'עותק מוצר';
    } else if (path.includes('/products')) {
      return 'מוצר';
    } else if (path.includes('/loans')) {
      return 'השאלה';
    } else if (path.includes('/volunteers')) {
      return 'פעילות התנדבות';
    } else if (path.includes('/audit')) {
      return 'ביקורת';
    }

    return 'משאב';
  }

  private extractEntityId(url: string, body?: any): string | undefined {
    // Try to extract ID from URL path
    const pathSegments = url.split('/');
    
    // Look for UUID-like patterns in the URL
    for (let i = pathSegments.length - 1; i >= 0; i--) {
      const segment = pathSegments[i];
      // Check if segment looks like a CUID or UUID
      if (segment && segment.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(segment)) {
        return segment;
      }
    }

    // Try to extract from request body
    if (body) {
      return body.id || body.userId || body.productId || body.loanId;
    }

    return undefined;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;

    // Create a copy to avoid modifying the original
    const sanitized = { ...body };

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'confirmPassword',
      'currentPassword',
      'newPassword',
      'token',
      'refreshToken',
      'accessToken',
      'secret',
      'key',
      'salt',
    ];

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return this.truncateData(sanitized);
  }

  private sanitizeResponseData(data: any): any {
    if (!data) return undefined;

    // Don't log large response data or sensitive information
    if (typeof data === 'object') {
      const sanitized = { ...data };
      
      // Remove sensitive fields from response
      const sensitiveFields = [
        'password',
        'token',
        'refreshToken',
        'accessToken',
        'secret',
        'key',
      ];

      const removeSensitiveFields = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(item => removeSensitiveFields(item));
        } else if (obj && typeof obj === 'object') {
          const cleaned = { ...obj };
          sensitiveFields.forEach(field => {
            if (cleaned[field]) {
              cleaned[field] = '[REDACTED]';
            }
          });
          
          // Recursively clean nested objects
          Object.keys(cleaned).forEach(key => {
            if (cleaned[key] && typeof cleaned[key] === 'object') {
              cleaned[key] = removeSensitiveFields(cleaned[key]);
            }
          });
          
          return cleaned;
        }
        return obj;
      };

      return this.truncateData(removeSensitiveFields(sanitized));
    }

    return this.truncateData(data);
  }

  private truncateData(data: any, maxLength: number = 2000): any {
    const str = JSON.stringify(data);
    if (str.length <= maxLength) {
      return data;
    }

    // Return truncated string representation
    return {
      _truncated: true,
      _originalLength: str.length,
      _data: str.substring(0, maxLength) + '...',
    };
  }

  private getClientIp(request: Request): string | undefined {
    return (
      (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress
    );
  }

  private shouldSkipAudit(url: string): boolean {
    const skipPatterns = [
      '/api/audit',           // Skip audit endpoints to prevent loops
      '/api/health',          // Skip health checks
      '/favicon.ico',         // Skip favicon requests
      '/api/docs',           // Skip Swagger docs
      '/api-json',           // Skip Swagger JSON
    ];

    return skipPatterns.some(pattern => url.includes(pattern));
  }
}