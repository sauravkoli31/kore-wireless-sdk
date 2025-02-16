import { RequestOptions, ApiError, PaginationParams } from '../types/wireless';
import { KoreClient } from './koreClient';
import { RateLimiter } from '../utils/rateLimiter';

export abstract class BaseApi {
  protected abstract basePath: string;
  protected abstract baseURL: string;
  protected client: KoreClient;
  protected rateLimiter: RateLimiter;

  constructor(client: KoreClient, rateLimiter: RateLimiter) {
    this.client = client;
    this.rateLimiter = rateLimiter;
  }

  protected async get<T>(path: string, params?: URLSearchParams): Promise<T> {
    return this.request<T>({ method: 'GET', path, params });
  }

  protected async post<T>(path: string, body: any): Promise<T> {
    return this.request<T>({ method: 'POST', path, body });
  }

  protected async patch<T>(path: string, body: any): Promise<T> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  protected async request<T>({ method, path, params, body, expectedStatus = [200] }: RequestOptions): Promise<T> {
    try {
      const token = await this.client.getValidToken();
      const url = `${this.baseURL}${this.basePath}${path}${params?.toString() ? '?' + params.toString() : ''}`;
      console.log("URL: ", url);
      console.log("basePath: ", this.basePath);
      const headers: HeadersInit = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      };

      if (body) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? new URLSearchParams(body) : undefined,
      });

      const data = await response.json();

      if (!expectedStatus.includes(response.status)) {
        throw this.createApiError(response.status, data);
      }

      return data as T;
    } catch (error) {
      if ((error as Error).name === 'ApiError') {
        throw error;
      }
      throw this.createApiError(0, { message: (error as Error).message });
    }
  }

  protected createApiError(status: number, data: any): ApiError {
    const apiError = new Error(data.message || 'API request failed') as ApiError;
    apiError.name = 'ApiError';
    apiError.code = data.code || status;
    apiError.status = status;
    apiError.details = data.more_info;
    return apiError;
  }

  /**
   * Helper method to build pagination parameters
   * @param params - Pagination parameters
   * @returns URLSearchParams object
   */
  protected buildPaginationParams(params: PaginationParams): URLSearchParams {
    const queryParams = new URLSearchParams();
    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params.page) queryParams.append('Page', params.page.toString());
    if (params.pageToken) queryParams.append('PageToken', params.pageToken);
    return queryParams;
  }
} 