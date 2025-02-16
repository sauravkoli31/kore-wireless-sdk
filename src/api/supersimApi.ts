import { BaseApi } from './baseApi';
import { KoreClient } from './koreClient';
import { RateLimiter } from '../utils/rateLimiter';
import { Fleet, Sim, IpCommand, SmsCommand } from '../types/supersim';

export class SuperSimApi extends BaseApi {
  protected basePath = '/v1';
  protected baseURL = 'https://supersim.api.korewireless.com';

  constructor(client: KoreClient) {
    const rateLimiter = new RateLimiter(10); // Only pass maxRequests
    super(client, rateLimiter);
  }

  /**
   * Create a new fleet
   */
  async createFleet(request: Partial<Fleet>): Promise<Fleet> {
    return this.post<Fleet>('/Fleets', request);
  }

  /**
   * Register a new SIM
   */
  async registerSim(iccid: string, registrationCode: string): Promise<Sim> {
    return this.post<Sim>('/Sims', {
      Iccid: iccid,
      RegistrationCode: registrationCode
    });
  }

  /**
   * Update a SIM
   */
  async updateSim(sid: string, request: Partial<Sim>): Promise<Sim> {
    return this.post<Sim>(`/Sims/${sid}`, request);
  }

  /**
   * Send an IP command to a SIM
   */
  async sendIpCommand(simSid: string, payload: string, devicePort: number, options?: {
    payloadType?: 'text' | 'binary';
    callbackUrl?: string;
    callbackMethod?: 'GET' | 'POST';
  }): Promise<IpCommand> {
    return this.post<IpCommand>('/IpCommands', {
      Sim: simSid,
      Payload: payload,
      DevicePort: devicePort,
      ...options
    });
  }

  /**
   * Send an SMS command to a SIM
   */
  async sendSmsCommand(simSid: string, payload: string): Promise<SmsCommand> {
    return this.post<SmsCommand>('/SmsCommands', {
      Sim: simSid,
      Payload: payload
    });
  }
} 