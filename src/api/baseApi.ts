import { RequestOptions, ApiError, PaginationParams, CustomHeaders, RequestInterceptor, ResponseInterceptor } from '../types/wireless';
import { KoreClient } from './koreClient';
import { RateLimiter } from '../utils/rateLimiter';
import { defaultRequestInterceptor, defaultResponseInterceptor, securityResponseInterceptor } from '../utils/interceptors';
import { Logger } from '../utils/logger';

/**
 * Base API class that handles common HTTP operations and authentication
 * @internal
 */
export abstract class BaseApi {
  protected abstract basePath: string;
  protected abstract baseURL: string;
  protected client: KoreClient;
  protected rateLimiter: RateLimiter;
  private readonly maxRetries = 3;
  private readonly requestTimeout = 30000; // 30 seconds
  private readonly maxBodySize = 10 * 1024 * 1024; // 10MB
  private readonly requestInterceptors: RequestInterceptor[] = [defaultRequestInterceptor];
  private readonly responseInterceptors: ResponseInterceptor[] = [
    defaultResponseInterceptor,
    securityResponseInterceptor
  ];

  constructor(client: KoreClient, rateLimiter: RateLimiter) {
    this.client = client;
    this.rateLimiter = rateLimiter;
  }

  /**
   * Adds a request interceptor
   * @internal
   */
  protected addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Adds a response interceptor
   * @internal
   */
  protected addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.responseInterceptors.push(interceptor);
  }

  private async applyResponseInterceptors(
    response: Response,
    requestOptions: RequestOptions
  ): Promise<Response> {
    let interceptedResponse = response;
    for (const interceptor of this.responseInterceptors) {
      interceptedResponse = await interceptor(interceptedResponse, requestOptions);
    }
    return interceptedResponse;
  }

  protected async get<T>(path: string, params?: URLSearchParams): Promise<T> {
    return this.request<T>({ 
      method: 'GET', 
      path, 
      params, 
      expectedStatus: [200] 
    });
  }

  protected async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    this.validateRequestBody(body);
    return this.request<T>({ 
      method: 'POST', 
      path, 
      body, 
      expectedStatus: [200, 201] 
    });
  }

  protected async patch<T>(path: string, body: Record<string, unknown>): Promise<T> {
    this.validateRequestBody(body);
    return this.request<T>({ 
      method: 'PATCH', 
      path, 
      body, 
      expectedStatus: [200] 
    });
  }

  private validateRequestBody(body: Record<string, unknown>): void {
    // Prevent prototype pollution
    if ('__proto__' in body || 'constructor' in body) {
      throw new Error('Invalid request body');
    }

    // Check body size
    const bodySize = new TextEncoder().encode(JSON.stringify(body)).length;
    if (bodySize > this.maxBodySize) {
      throw new Error('Request body too large');
    }

    // Validate nested objects
    const validateValue = (value: unknown, depth = 0): void => {
      if (depth > 10) { // Prevent deeply nested objects
        throw new Error('Request body too deeply nested');
      }

      if (Array.isArray(value)) {
        if (value.length > 1000) { // Prevent huge arrays
          throw new Error('Array in request body too large');
        }
        value.forEach(item => validateValue(item, depth + 1));
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
          if (key.length > 100) { // Prevent huge keys
            throw new Error('Key in request body too long');
          }
          validateValue(val, depth + 1);
        });
      }
    };

    validateValue(body);
  }

  protected async request<T>(options: RequestOptions): Promise<T> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < this.maxRetries) {
      try {
        const result = await this.makeRequest<T>(options);
        return result;
      } catch (error) {
        lastError = error as Error;
        if (!this.shouldRetry(error as Error) || retryCount === this.maxRetries - 1) {
          throw error;
        }
        retryCount++;
        await this.delay(Math.pow(2, retryCount) * 1000);
      }
    }

    throw lastError;
  }

  private async makeRequest<T>(options: RequestOptions): Promise<T> {
    Logger.debug('Making API request', {
      method: options.method,
      path: options.path,
      params: options.params?.toString()
    });
    let timeout: NodeJS.Timeout | undefined;
    try {
      const token = await this.client.getValidToken();
      const url = new URL(`${this.baseURL}${this.basePath}${options.path}`);
      
      if (options.params) {
        url.search = options.params.toString();
      }

      // Only include essential headers
      const headers: CustomHeaders = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      let body: string | URLSearchParams | undefined;
      if (options.body) {
        if (options.method === 'POST' || options.method === 'PATCH') {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
          body = this.convertBodyToFormData(options.body);
        } else {
          body = JSON.stringify(options.body);
        }
      }

      const controller = new AbortController();
      timeout = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(url.toString(), {
        method: options.method,
        headers: headers as HeadersInit,
        body,
        signal: controller.signal,
      });

      // Log raw response for debugging
      Logger.debug('Raw response', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        url: url.toString()
      });

      // If response is not ok, handle error without parsing JSON
      if (!response.ok) {
        throw this.createApiError(response.status, {
          message: 'Request failed',
          code: response.status,
          more_info: `https://docs.korewireless.com/errors/${response.status}`
        });
      }

      // Clone response before reading
      const responseClone = response.clone();
      const rawText = await responseClone.text();
      Logger.debug('Raw response body:', rawText);

      let data: unknown;
      try {
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseError) {
        Logger.error('JSON Parse Error:', parseError as Error, { rawText });
        throw new Error('Invalid response format from server');
      }

      // Apply response interceptors
      const interceptedResponse = await this.applyResponseInterceptors(response, options);

      if (!options.expectedStatus.includes(interceptedResponse.status)) {
        throw this.createApiError(interceptedResponse.status, data);
      }

      return data as T;
    } catch (error) {
      Logger.error('API request failed', error as Error, {
        method: options.method,
        path: options.path,
        url: `${this.baseURL}${this.basePath}${options.path}`
      });
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private shouldRetry(error: Error): boolean {
    if ('status' in error) {
      const status = (error as ApiError).status;
      return status >= 500 || status === 429;
    }
    return error.name === 'AbortError' || error.name === 'TypeError';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected createApiError(status: number, data: unknown): ApiError {
    const message = typeof data === 'object' && data !== null && 'message' in data 
      ? String(data.message)
      : 'API request failed';
      
    const apiError = new Error(message) as ApiError;
    apiError.name = 'ApiError';
    apiError.code = typeof data === 'object' && data !== null && 'code' in data 
      ? Number(data.code) 
      : status;
    apiError.status = status;
    apiError.details = typeof data === 'object' && data !== null && 'more_info' in data 
      ? String(data.more_info)
      : undefined;
    return apiError;
  }

  /**
   * Builds pagination parameters for API requests
   * @internal
   */
  protected buildPaginationParams(params: PaginationParams): URLSearchParams {
    const queryParams = new URLSearchParams();
    
    // Validate pagination parameters
    if (params.pageSize && (params.pageSize < 1 || params.pageSize > 100)) {
      throw new Error('Page size must be between 1 and 100');
    }
    if (params.page && params.page < 1) {
      throw new Error('Page number must be greater than 0');
    }

    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params.page) queryParams.append('Page', params.page.toString());
    if (params.pageToken) queryParams.append('PageToken', params.pageToken);
    
    return queryParams;
  }

  private convertBodyToFormData(body: Record<string, unknown>): URLSearchParams {
    const params = new URLSearchParams();
    
    const addParam = (key: string, value: unknown, prefix = ''): void => {
      const fullKey = prefix ? `${prefix}[${key}]` : key;
      
      if (value === null || value === undefined) {
        return;
      } else if (typeof value === 'boolean') {
        params.append(fullKey, value ? 'true' : 'false');
      } else if (typeof value === 'number') {
        params.append(fullKey, value.toString());
      } else if (typeof value === 'string') {
        params.append(fullKey, value);
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          addParam(index.toString(), item, fullKey);
        });
      } else if (typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([k, v]) => {
          addParam(k, v, fullKey);
        });
      }
    };

    Object.entries(body).forEach(([key, value]) => {
      addParam(key, value);
    });

    return params;
  }
} 