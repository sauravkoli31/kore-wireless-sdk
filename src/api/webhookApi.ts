import { BaseApi } from './baseApi';
import { KoreClient } from './koreClient';
import { RateLimiter } from '../utils/rateLimiter';
import { CreateSecretRequest, ModifySecretRequest, SecretCreated, SecretResponse, PaginatedSecretResponse } from '../types/webhook';

export class WebhookApi extends BaseApi {
  protected basePath = '/v1';
  protected baseURL = 'https://webhook.api.korewireless.com';

  constructor(client: KoreClient) {
    const rateLimiter = new RateLimiter(10);
    super(client, rateLimiter);
  }

  /**
   * Create a new secret
   */
  async createSecret(request: CreateSecretRequest): Promise<SecretCreated> {
    const body: Record<string, unknown> = {
      Name: request.Name
    };

    return this.request({
      method: 'POST',
      path: '/secrets',
      body,
      expectedStatus: [201]
    });
  }

  /**
   * Modify an existing secret
   */
  async modifySecret(id: string, request: ModifySecretRequest): Promise<SecretResponse> {
    const body: Record<string, unknown> = {};
    if (request.Name !== undefined) body.Name = request.Name;
    if (request.Status !== undefined) body.Status = request.Status;

    return this.request({
      method: 'PATCH',
      path: `/secrets/${id}`,
      body,
      expectedStatus: [200]
    });
  }

  /**
   * List all secrets
   */
  async listSecrets(pageSize?: number, pageNumber?: number): Promise<PaginatedSecretResponse> {
    const params = new URLSearchParams();
    if (pageSize) params.append('page_size', pageSize.toString());
    if (pageNumber) params.append('page_number', pageNumber.toString());
    
    return this.request({
      method: 'GET',
      path: '/secrets',
      params,
      expectedStatus: [200]
    });
  }
} 