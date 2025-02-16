import { BaseApi } from './baseApi';
import { KoreClient } from './koreClient';
import { RateLimiter } from '../utils/rateLimiter';
import { CreateSecretRequest, ModifySecretRequest, SecretCreated, SecretResponse, PaginatedSecretResponse } from '../types/webhook';

export class WebhookApi extends BaseApi {
  protected basePath = '/v1';
  protected baseURL = 'https://webhook.api.korewireless.com';

  constructor(client: KoreClient) {
    const rateLimiter = new RateLimiter(10); // Only pass maxRequests
    super(client, rateLimiter);
  }

  /**
   * Create a new secret
   */
  async createSecret(request: CreateSecretRequest): Promise<SecretCreated> {
    return this.post<SecretCreated>('/secrets', request);
  }

  /**
   * Modify an existing secret
   */
  async modifySecret(id: string, request: ModifySecretRequest): Promise<SecretResponse> {
    return this.patch<SecretResponse>(`/secrets/${id}`, request);
  }

  /**
   * List all secrets
   */
  async listSecrets(pageSize?: number, pageNumber?: number): Promise<PaginatedSecretResponse> {
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (pageNumber) params.append('page_number', pageNumber.toString());
    
    return this.get<PaginatedSecretResponse>('/secrets', params);
  }
} 