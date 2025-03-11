import {
  UsageList,
  SIMUsageList,
  PaginationParams,
  Granularity,
  RatePlan,
  CreateRatePlanRequest,
  Sim,
  SimStatus,
  Command,
  CreateCommandRequest,
  DataSession,
  CommandStatus,
  CommandDirection,
  CommandTransport,
  RequestOptions,
  UpdateSimRequest,
} from '../types/wireless';
import { BaseApi } from './baseApi';
import { RateLimiter } from '../utils/rateLimiter';
import { retry, RetryOptions } from '../utils/retry';
import { KoreClient } from './koreClient';

export class WirelessApi extends BaseApi {
  protected basePath = '/v1';
  protected baseURL = 'https://programmable-wireless.api.korewireless.com';
  protected retryOptions: RetryOptions;

  /**
   * Creates a new instance of the Wireless API client
   * @param koreClient - The KoreClient instance
   * @param requestsPerSecond - Number of requests per second allowed
   * @param retryOptions - Retry options
   */
  constructor(
    client: KoreClient,
    requestsPerSecond: number = 10,
    retryOptions: RetryOptions = {}
  ) {
    const rateLimiter = new RateLimiter(requestsPerSecond);
    super(client, rateLimiter);
    this.retryOptions = retryOptions;
  }

  protected async request<T>(options: RequestOptions): Promise<T> {
    return await this.rateLimiter.add(() => 
      retry(() => super.request<T>(options), this.retryOptions)
    );
  }

  // Usage Records API
  async listDataUsage(params: {
    start?: string;
    end?: string;
    granularity?: Granularity;
  } & PaginationParams = {}): Promise<UsageList> {
    const queryParams = new URLSearchParams();
    if (params.start) queryParams.append('Start', params.start);
    if (params.end) queryParams.append('End', params.end);
    if (params.granularity) queryParams.append('Granularity', params.granularity);
    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params.page) queryParams.append('Page', params.page.toString());
    if (params.pageToken) queryParams.append('PageToken', params.pageToken);

    return this.request({
      method: 'GET',
      path: '/UsageRecords',
      params: queryParams,
      expectedStatus: [200]
    });
  }

  async listDataUsageForSim(
    sid: string,
    params: {
      start?: string;
      end?: string;
      granularity?: Granularity;
    } & PaginationParams = {}
  ): Promise<SIMUsageList> {
    const queryParams = new URLSearchParams();
    if (params.start) queryParams.append('Start', params.start);
    if (params.end) queryParams.append('End', params.end);
    if (params.granularity) queryParams.append('Granularity', params.granularity);
    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params.page) queryParams.append('Page', params.page.toString());
    if (params.pageToken) queryParams.append('PageToken', params.pageToken);

    return this.request({
      method: 'GET',
      path: `/Sims/${sid}/UsageRecords`,
      params: queryParams,
      expectedStatus: [200]
    });
  }

  // Rate Plans API
  async listRatePlans(params: PaginationParams = {}): Promise<{ rate_plans: RatePlan[]; meta: any }> {
    const queryParams = this.buildPaginationParams(params);
    return await this.request({
      method: 'GET',
      path: '/RatePlans',
      params: queryParams,
      expectedStatus: [200]
    });
  }

  async createRatePlan(data: CreateRatePlanRequest): Promise<RatePlan> {
    return this.request({
      method: 'POST',
      path: '/RatePlans',
      body: data,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      expectedStatus: [200, 202]
    });
  }

  async getRatePlan(sid: string): Promise<RatePlan> {
    return this.request({
      method: 'GET',
      path: `/RatePlans/${sid}`,
      expectedStatus: [200]
    });
  }

  async updateRatePlan(sid: string, data: Partial<CreateRatePlanRequest>): Promise<RatePlan> {
    return this.request({
      method: 'POST',
      path: `/RatePlans/${sid}`,
      body: data as Record<string, unknown>,
      expectedStatus: [200]
    });
  }

  async deleteRatePlan(sid: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      path: `/RatePlans/${sid}`,
      expectedStatus: [204]
    });
  }

  // SIMs API
  async listSims(params: {
    status?: SimStatus;
    iccid?: string;
    ratePlan?: string;
    eId?: string;
    simRegistrationCode?: string;
  } & PaginationParams = {}): Promise<{ sims: Sim[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params.status) queryParams.append('Status', params.status);
    if (params.iccid) queryParams.append('Iccid', params.iccid);
    if (params.ratePlan) queryParams.append('RatePlan', params.ratePlan);
    if (params.eId) queryParams.append('EId', params.eId);
    if (params.simRegistrationCode) queryParams.append('SimRegistrationCode', params.simRegistrationCode);
    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params.page) queryParams.append('Page', params.page.toString());
    if (params.pageToken) queryParams.append('PageToken', params.pageToken);

    return this.request({
      method: 'GET',
      path: '/Sims',
      params: queryParams,
      expectedStatus: [200]
    });
  }

  async getSim(sid: string): Promise<Sim> {
    return this.request({
      method: 'GET',
      path: `/Sims/${sid}`,
      expectedStatus: [200]
    });
  }

  async updateSim(sid: string, data: Partial<UpdateSimRequest>): Promise<Sim> {
    return this.request({
      method: 'POST',
      path: `/Sims/${sid}`,
      body: data as Record<string, unknown>,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      expectedStatus: [200, 202]
    });
  }

  async deleteSim(sid: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      path: `/Sims/${sid}`,
      expectedStatus: [204]
    });
  }

  // Commands API
  /**
   * Fetch Command(s) based on query parameters
   * @param params - Query parameters (Sim, Status, Direction, Transport, pagination)
   */
  async getCommand(params: {
    sim?: string;
    status?: CommandStatus;
    direction?: CommandDirection;
    transport?: CommandTransport;
  } & PaginationParams = {}): Promise<{ commands: Command[]; meta: any }> {
    const queryParams = new URLSearchParams();
    if (params.sim) queryParams.append('Sim', params.sim);
    if (params.status) queryParams.append('Status', params.status);
    if (params.direction) queryParams.append('Direction', params.direction);
    if (params.transport) queryParams.append('Transport', params.transport);
    if (params.pageSize) queryParams.append('PageSize', params.pageSize.toString());
    if (params.page) queryParams.append('Page', params.page.toString());
    if (params.pageToken) queryParams.append('PageToken', params.pageToken);

    return this.request({
      method: 'GET',
      path: '/Commands',
      params: queryParams,
      expectedStatus: [200]
    });
  }

  async createCommand(data: CreateCommandRequest): Promise<Command> {
    return this.request({
      method: 'POST',
      path: '/Commands',
      body: data as Record<string, unknown>,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      expectedStatus: [201, 202]
    });
  }

  async deleteCommand(sid: string): Promise<void> {
    return this.request({
      method: 'DELETE',
      path: `/Commands/${sid}`,
      expectedStatus: [202, 204]
    });
  }

  // Data Sessions API
  async getDataSessions(
    sid: string,
    params: PaginationParams = {}
  ): Promise<{ data_sessions: DataSession[]; meta: any }> {
    const queryParams = this.buildPaginationParams(params);

    return this.request({
      method: 'GET',
      path: `/Sims/${sid}/DataSessions`,
      params: queryParams,
      expectedStatus: [200]
    });
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