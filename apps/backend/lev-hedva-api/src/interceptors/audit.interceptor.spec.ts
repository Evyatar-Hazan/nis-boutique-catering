import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from '../modules/audit/audit.service';
import { AuditActionType, AuditEntityType } from '../modules/audit/dto/create-audit-log.dto';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let auditService: AuditService;

  const mockAuditService = {
    logUserAction: jest.fn(),
    logError: jest.fn(),
  };

  const mockRequest = {
    method: 'GET',
    url: '/api/users',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
    ip: '192.168.1.1',
    body: {},
    user: {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['users.read'],
    },
    connection: {
      remoteAddress: '192.168.1.1',
    },
    socket: {
      remoteAddress: '192.168.1.1',
    },
  };

  const mockResponse = {
    statusCode: 200,
  };

  const createMockExecutionContext = (
    request: any = mockRequest,
    response: any = mockResponse
  ): ExecutionContext => ({
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
      getNext: () => ({}) as any,
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
    switchToRpc: () => ({
      getData: () => ({}) as any,
      getContext: () => ({}) as any,
    }),
    switchToWs: () => ({
      getData: () => ({}) as any,
      getClient: () => ({}) as any,
      getPattern: () => '' as any,
    }),
    getArgs: () => [] as any,
    getArgByIndex: () => ({}) as any,
    getType: () => 'http' as any,
  });

  const createMockCallHandler = (
    response?: any,
    shouldThrow: boolean = false,
    error?: any
  ): CallHandler => ({
    handle: () => {
      if (shouldThrow) {
        return throwError(() => error || new Error('Test error'));
      }
      return of(response || { data: 'test' });
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditInterceptor,
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    interceptor = module.get<AuditInterceptor>(AuditInterceptor);
    auditService = module.get<AuditService>(AuditService);

    // Clean mocks before each test
    jest.clearAllMocks();
    // Suppress console.error for tests
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('intercept', () => {
    it('צריך לתעד בקשה מוצלחת', (done) => {
      const context = createMockExecutionContext();
      const next = createMockCallHandler({ users: ['user1', 'user2'] });

      mockAuditService.logUserAction.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ users: ['user1', 'user2'] });
          
          // Need to wait a bit for the async function to complete
          setTimeout(() => {
            expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
              AuditActionType.READ,
              AuditEntityType.USER,
              'קריאת משתמש הצליח (200)',
              'user-123',
              undefined,
              expect.objectContaining({
                requestBody: {},
                responseData: { users: ['user1', 'user2'] },
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1',
                statusCode: 200,
              })
            );
            done();
          }, 100);
        },
        error: done,
      });
    });

    it('צריך לתעד בקשה כושלת', (done) => {
      const context = createMockExecutionContext();
      const error = { message: 'Not found', status: 404, name: 'NotFoundError' };
      const next = createMockCallHandler(undefined, true, error);

      mockAuditService.logError.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: () => {
          done(new Error('לא צריך להצליח'));
        },
        error: (err) => {
          expect(err).toEqual(error);
          
          setTimeout(() => {
            expect(mockAuditService.logError).toHaveBeenCalledWith(
              'קריאת משתמש נכשל (404)',
              'Not found',
              'user-123',
              '/api/users',
              'GET',
              404,
              expect.objectContaining({
                requestBody: {},
                error: {
                  name: 'NotFoundError',
                  message: 'Not found',
                  stack: undefined,
                },
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1',
              })
            );
            done();
          }, 100);
        },
      });
    });

    it('צריך לדלג על תיעוד עבור endpoints של ביקורת', (done) => {
      const auditRequest = {
        ...mockRequest,
        url: '/api/audit',
      };
      const context = createMockExecutionContext(auditRequest);
      const next = createMockCallHandler({ logs: [] });

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ logs: [] });
          expect(mockAuditService.logUserAction).not.toHaveBeenCalled();
          expect(mockAuditService.logError).not.toHaveBeenCalled();
          done();
        },
        error: done,
      });
    });

    it('צריך לטפל בבקשה ללא משתמש מחובר', (done) => {
      const unauthenticatedRequest = {
        ...mockRequest,
        user: undefined,
      };
      const context = createMockExecutionContext(unauthenticatedRequest);
      const next = createMockCallHandler({ message: 'Public data' });

      mockAuditService.logUserAction.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ message: 'Public data' });
          
          setTimeout(() => {
            expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
              AuditActionType.READ,
              AuditEntityType.USER,
              'קריאת משתמש הצליח (200)',
              undefined, // No userId
              undefined,
              expect.objectContaining({
                requestBody: {},
                responseData: { message: 'Public data' },
                userAgent: 'Mozilla/5.0',
                ipAddress: '192.168.1.1',
                statusCode: 200,
              })
            );
            done();
          }, 100);
        },
        error: done,
      });
    });

    it('צריך לסנן נתונים רגישים מגוף הבקשה', (done) => {
      const sensitiveRequest = {
        ...mockRequest,
        method: 'POST',
        url: '/api/auth/login',
        body: {
          email: 'test@example.com',
          password: 'secret123',
          rememberMe: true,
        },
      };
      const context = createMockExecutionContext(sensitiveRequest);
      const next = createMockCallHandler({ accessToken: 'token123', user: { id: '1' } });

      mockAuditService.logUserAction.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
              AuditActionType.CREATE,
              AuditEntityType.AUTH,
              'יצירת התחברות הצליח (200)',
              'user-123',
              undefined,
              expect.objectContaining({
                requestBody: {
                  email: 'test@example.com',
                  password: '[REDACTED]',
                  rememberMe: true,
                },
                responseData: {
                  accessToken: '[REDACTED]',
                  user: { id: '1' },
                },
              })
            );
            done();
          }, 100);
        },
        error: done,
      });
    });

    it('צריך לחלץ entity ID מה-URL', (done) => {
      const requestWithId = {
        ...mockRequest,
        method: 'PUT',
        url: '/api/users/clx1y2z3a4b5c6d7e8f9g0h1i',
      };
      const context = createMockExecutionContext(requestWithId);
      const next = createMockCallHandler({ id: 'clx1y2z3a4b5c6d7e8f9g0h1i', name: 'Updated User' });

      mockAuditService.logUserAction.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: () => {
          setTimeout(() => {
            expect(mockAuditService.logUserAction).toHaveBeenCalledWith(
              AuditActionType.UPDATE,
              AuditEntityType.USER,
              'עדכון משתמש הצליח (200)',
              'user-123',
              'clx1y2z3a4b5c6d7e8f9g0h1i', // Entity ID extracted from URL
              expect.any(Object)
            );
            done();
          }, 100);
        },
        error: done,
      });
    });

    it('צריך לקטוע נתונים גדולים', (done) => {
      const largeData = {
        items: new Array(1000).fill({ name: 'item', description: 'very long description that repeats many times' }),
      };
      const context = createMockExecutionContext();
      const next = createMockCallHandler(largeData);

      mockAuditService.logUserAction.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: () => {
          setTimeout(() => {
            const call = mockAuditService.logUserAction.mock.calls[0];
            const metadata = call[5];
            
            expect(metadata.responseData).toHaveProperty('_truncated', true);
            expect(metadata.responseData).toHaveProperty('_originalLength');
            expect(metadata.responseData).toHaveProperty('_data');
            done();
          }, 100);
        },
        error: done,
      });
    });
  });

  describe('Action and Entity Mapping', () => {
    it('צריך למפות HTTP methods לפעולות נכון', async () => {
      const methods = [
        { method: 'POST', expected: AuditActionType.CREATE, url: '/api/users', entity: AuditEntityType.USER },
        { method: 'PUT', expected: AuditActionType.UPDATE, url: '/api/products/clq9k8x0000001234567890abcd', entity: AuditEntityType.PRODUCT },
        { method: 'PATCH', expected: AuditActionType.UPDATE, url: '/api/loans/clq9k8x0000001234567890efgh', entity: AuditEntityType.LOAN },
        { method: 'DELETE', expected: AuditActionType.DELETE, url: '/api/volunteers/clq9k8x0000001234567890ijkl', entity: AuditEntityType.VOLUNTEER_ACTIVITY },
        { method: 'GET', expected: AuditActionType.READ, url: '/api/auth/profile', entity: AuditEntityType.AUTH },
      ];

      for (const { method, expected, url, entity } of methods) {
        // מנקה mocks לפני כל בדיקה
        jest.clearAllMocks();
        
        const testRequest = { ...mockRequest, method, url };
        const context = createMockExecutionContext(testRequest);
        const next = createMockCallHandler({});

        mockAuditService.logUserAction.mockResolvedValue(undefined);

        // מפעיל את ה-interceptor
        const result$ = interceptor.intercept(context, next);
        
        // ממתין לתוצאה
        await result$.toPromise();
        
        // בדיקה שהפעולה נקראה עם הפרמטרים הנכונים
        expect(mockAuditService.logUserAction).toHaveBeenCalled();
        
        // בדיקה ספציפית של הפרמטרים
        const call = mockAuditService.logUserAction.mock.calls[0];
        expect(call[0]).toBe(expected); // action
        expect(call[1]).toBe(entity); // entityType
      }
    });

    it('צריך למפות URLs ליישויות נכון', async () => {
      const urlMappings = [
        { url: '/api/auth/login', expected: AuditEntityType.AUTH },
        { url: '/api/users/clq9k8x0000001234567890abcd', expected: AuditEntityType.USER },
        { url: '/api/products/clq9k8x0000001234567890efgh', expected: AuditEntityType.PRODUCT },
        { url: '/api/loans/clq9k8x0000001234567890ijkl', expected: AuditEntityType.LOAN },
        { url: '/api/volunteers/activities', expected: AuditEntityType.VOLUNTEER_ACTIVITY },
      ];

      for (const { url, expected } of urlMappings) {
        // מנקה mocks לפני כל בדיקה
        jest.clearAllMocks();
        
        const testRequest = { ...mockRequest, url };
        const context = createMockExecutionContext(testRequest);
        const next = createMockCallHandler({});

        mockAuditService.logUserAction.mockResolvedValue(undefined);

        // מפעיל את ה-interceptor
        const result$ = interceptor.intercept(context, next);
        
        // ממתין לתוצאה
        await result$.toPromise();
        
        // בדיקה שה-entity נמפה נכון
        expect(mockAuditService.logUserAction).toHaveBeenCalled();
        
        // בדיקה ספציפית של הפרמטרים  
        const call = mockAuditService.logUserAction.mock.calls[0];
        expect(call[0]).toBe(AuditActionType.READ); // action
        expect(call[1]).toBe(expected); // entityType
      }
    });
  });

  describe('Error Handling', () => {
    it('צריך להמשיך לעבוד גם כשיש שגיאה בשירות הביקורת', (done) => {
      const context = createMockExecutionContext();
      const next = createMockCallHandler({ success: true });

      mockAuditService.logUserAction.mockRejectedValue(new Error('Audit service error'));

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual({ success: true });
          done();
        },
        error: done,
      });
    });

    it('צריך להמשיך כשיש שגיאה בלוגינג של שגיאות', (done) => {
      const context = createMockExecutionContext();
      const error = new Error('Original error');
      const next = createMockCallHandler(undefined, true, error);

      mockAuditService.logError.mockRejectedValue(new Error('Audit error'));

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: () => {
          done(new Error('לא צריך להצליח'));
        },
        error: (err) => {
          expect(err).toBe(error); // השגיאה המקורית צריכה להיזרק
          done();
        },
      });
    });
  });

  describe('IP Address Extraction', () => {
    it('צריך לחלץ כתובת IP מheaders שונים', (done) => {
      const requestWithForwardedFor = {
        ...mockRequest,
        headers: {
          ...mockRequest.headers,
          'x-forwarded-for': '203.0.113.1, 198.51.100.1',
          'x-real-ip': '198.51.100.1',
        },
      };
      const context = createMockExecutionContext(requestWithForwardedFor);
      const next = createMockCallHandler({});

      mockAuditService.logUserAction.mockResolvedValue(undefined);

      const result$ = interceptor.intercept(context, next);

      result$.subscribe({
        next: () => {
          setTimeout(() => {
            const call = mockAuditService.logUserAction.mock.calls[0];
            const metadata = call[5];
            
            // צריך לקחת את הכתובת הראשונה מ-x-forwarded-for
            expect(metadata.ipAddress).toBe('203.0.113.1');
            done();
          }, 100);
        },
        error: done,
      });
    });
  });
});