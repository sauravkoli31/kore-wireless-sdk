import { PingResponse, ErrorResponse } from '../types/responses';
import { BaseApi } from './baseApi';
import { KoreClient } from './koreClient';
import { RateLimiter } from '../utils/rateLimiter';

export class ClientApi extends BaseApi {
  protected basePath = '/v1';
  protected baseURL = 'https://client.api.korewireless.com';

  constructor(client: KoreClient) {
    const rateLimiter = new RateLimiter(10);
    super(client, rateLimiter);
  }

  /**
   * Get ping status to check API health
   * @returns Promise containing the ping response
   */
  async getPingStatus(): Promise<PingResponse> {
    return this.get<PingResponse>('/ping');
  }
} 