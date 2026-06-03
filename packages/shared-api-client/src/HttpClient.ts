import { ApiResponse } from '@monorepo/shared-types';

export interface RequestInterceptor {
  onRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  onError?: (error: Error) => Error | Promise<Error>;
}

export interface ResponseInterceptor {
  onResponse?: <T>(response: Response, data: T) => T | Promise<T>;
  onError?: (error: Error) => Error | Promise<Error>;
}

export interface HttpClientConfig {
  baseUrl?: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export interface HttpClientOptions {
  requestInterceptors?: RequestInterceptor[];
  responseInterceptors?: ResponseInterceptor[];
}

export class HttpClient {
  private baseUrl: string;
  private timeout: number;
  private headers: Record<string, string>;
  private requestInterceptors: RequestInterceptor[];
  private responseInterceptors: ResponseInterceptor[];

  constructor(config: HttpClientConfig = {}, options: HttpClientOptions = {}) {
    this.baseUrl = config.baseUrl || '';
    this.timeout = config.timeout || 30000;
    this.headers = config.headers || { 'Content-Type': 'application/json' };
    this.requestInterceptors = options.requestInterceptors || [];
    this.responseInterceptors = options.responseInterceptors || [];
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization header
   */
  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }

  /**
   * Apply request interceptors
   */
  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let result = config;
    for (const interceptor of this.requestInterceptors) {
      if (interceptor.onRequest) {
        result = await interceptor.onRequest(result);
      }
    }
    return result;
  }

  /**
   * Apply response interceptors
   */
  private async applyResponseInterceptors<T>(response: Response, data: T): Promise<T> {
    let result = data;
    for (const interceptor of this.responseInterceptors) {
      if (interceptor.onResponse) {
        result = await interceptor.onResponse(response, result);
      }
    }
    return result;
  }

  /**
   * Execute HTTP request with timeout
   */
  private async fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...init, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T = any>(path: string, body?: any, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(path: string, body?: any, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'PUT',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  /**
   * PATCH request
   */
  async patch<T = any>(path: string, body?: any, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      body: typeof body === 'string' ? body : JSON.stringify(body),
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }

  /**
   * Core request method
   */
  async request<T = any>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Prepare request config
      let config: RequestInit = {
        ...init,
        headers: {
          ...this.headers,
          ...init.headers,
        },
      };

      // Apply request interceptors
      config = await this.applyRequestInterceptors(config);

      // Build full URL
      const url = this.baseUrl ? `${this.baseUrl}${path}` : path;

      // Execute request
      const response = await this.fetchWithTimeout(url, config);

      // Parse response
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Apply response interceptors
      data = await this.applyResponseInterceptors(response, data);

      // Check for HTTP errors
      if (!response.ok) {
        throw new HttpError(`HTTP ${response.status}: ${response.statusText}`, response.status, data);
      }

      // Return response (ensure it has ApiResponse shape)
      return this.normalizeResponse<T>(data);
    } catch (error) {
      // Handle errors
      return this.handleError<T>(error);
    }
  }

  /**
   * Normalize response to ApiResponse format
   */
  private normalizeResponse<T>(data: any): ApiResponse<T> {
    // If already ApiResponse format, return as is
    if (data && typeof data === 'object' && 'success' in data) {
      return data as ApiResponse<T>;
    }

    // Otherwise wrap in ApiResponse
    return {
      success: true,
      data: data as T,
    };
  }

  /**
   * Handle errors
   */
  private handleError<T>(error: any): ApiResponse<T> {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      error: message,
      data: error instanceof HttpError ? error.data : undefined,
    };
  }
}

/**
 * Custom HTTP Error class
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * Create HTTP client instance
 */
export function createHttpClient(config?: HttpClientConfig, options?: HttpClientOptions): HttpClient {
  return new HttpClient(config, options);
}
