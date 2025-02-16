import { TokenResponse } from '../types/responses';
import { TokenApi } from './tokenApi';
import { WirelessApi } from './wirelessApi';
import { ClientApi } from './clientApi';
import { WebhookApi } from './webhookApi';
import { SuperSimApi } from './supersimApi';

export class KoreClient {
  private clientId: string;
  private clientSecret: string;
  private tokenData?: TokenResponse;
  private tokenExpiryTime?: Date;
  private tokenApi: TokenApi;

  // API instances
  public readonly wirelessApi: WirelessApi;
  public readonly clientApi: ClientApi;
  public readonly webhook: WebhookApi;
  public readonly superSim: SuperSimApi;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.tokenApi = new TokenApi();

    // Initialize API instances
    this.wirelessApi = new WirelessApi(this);
    this.clientApi = new ClientApi(this);
    this.webhook = new WebhookApi(this);
    this.superSim = new SuperSimApi(this);
  }

  async getValidToken(): Promise<string> {
    if (!this.tokenData || this.isTokenExpired()) {
      await this.refreshToken();
    }
    return this.tokenData!.access_token;
  }

  private isTokenExpired(): boolean {
    return !this.tokenExpiryTime || this.tokenExpiryTime <= new Date();
  }

  private async refreshToken(): Promise<void> {
    console.log('Refreshing token');
    this.tokenData = await this.tokenApi.getToken(this.clientId, this.clientSecret);
    // Set expiry time with 5 minutes buffer
    this.tokenExpiryTime = new Date(Date.now() + (this.tokenData.expires_in - 300) * 1000);
  }
} 