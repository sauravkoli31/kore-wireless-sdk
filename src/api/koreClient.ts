import { TokenResponse } from '../types/responses';
import { TokenApi } from './tokenApi';
import { WirelessApi } from './wirelessApi';
import { ClientApi } from './clientApi';
import { WebhookApi } from './webhookApi';
import { SuperSimApi } from './supersimApi';
import { Logger } from '../utils/logger';

/**
 * Main client for interacting with KORE Wireless APIs
 * @public
 */
export class KoreClient {
  private readonly _clientId!: string;
  private readonly _clientSecret!: string;
  #tokenData?: TokenResponse;
  #tokenExpiryTime?: Date;
  private readonly tokenApi: TokenApi;
  #tokenRefreshPromise?: Promise<void>;

  /**
   * API instances for different KORE services
   * @public
   */
  public readonly wirelessApi: WirelessApi;
  public readonly clientApi: ClientApi;
  public readonly webhook: WebhookApi;
  public readonly superSim: SuperSimApi;

  private static validateCredentials(clientId: string, clientSecret: string): void {
    if (!clientId?.trim()) {
      throw new Error('Client ID is required');
    }
    if (!clientSecret?.trim()) {
      throw new Error('Client Secret is required');
    }
    
    // Validate credential format
    if (!/^[A-Za-z0-9_-]{16,}$/.test(clientId)) {
      throw new Error('Invalid Client ID format');
    }
    if (!/^[A-Za-z0-9_-]{32,}$/.test(clientSecret)) {
      throw new Error('Invalid Client Secret format');
    }
  }

  /**
   * Creates a new KORE Wireless API client
   * @param clientId - Your KORE client ID
   * @param clientSecret - Your KORE client secret
   * @throws {Error} If clientId or clientSecret are invalid
   */
  constructor(
    clientId: string, 
    clientSecret: string
  ) {
    KoreClient.validateCredentials(clientId, clientSecret);
    
    Object.defineProperties(this, {
      _clientId: {
        value: clientId,
        writable: false,
        enumerable: false
      },
      _clientSecret: {
        value: clientSecret,
        writable: false,
        enumerable: false
      }
    });

    this.tokenApi = new TokenApi();
    this.wirelessApi = new WirelessApi(this, 10);
    this.clientApi = new ClientApi(this);
    this.webhook = new WebhookApi(this);
    this.superSim = new SuperSimApi(this);
  }

  // Protected getters for credentials
  protected get clientId(): string {
    return this._clientId;
  }

  protected get clientSecret(): string {
    return this._clientSecret;
  }

  /**
   * Gets a valid authentication token
   * @internal
   */
  async getValidToken(): Promise<string> {
    if (this.#tokenRefreshPromise) {
      await this.#tokenRefreshPromise;
    }
    
    if (!this.#tokenData || this.isTokenExpired()) {
      await this.refreshToken();
    }
    
    return this.#tokenData!.access_token;
  }

  private isTokenExpired(): boolean {
    const bufferTime = 5 * 60 * 1000;
    return !this.#tokenExpiryTime || 
           (this.#tokenExpiryTime.getTime() - bufferTime) <= Date.now();
  }

  private async refreshToken(): Promise<void> {
    if (this.#tokenRefreshPromise) {
      return this.#tokenRefreshPromise;
    }

    let refreshComplete = false;
    this.#tokenRefreshPromise = (async () => {
      try {
        Logger.debug('Refreshing access token...');
        this.#tokenData = await this.tokenApi.getToken(this.clientId, this.clientSecret);
        this.#tokenExpiryTime = new Date(Date.now() + (this.#tokenData.expires_in - 300) * 1000);
        Logger.debug('Token refreshed successfully');
        refreshComplete = true;
      } catch (error) {
        this.#tokenData = undefined;
        this.#tokenExpiryTime = undefined;
        Logger.error('Token refresh failed:', error as Error);
        throw error;
      } finally {
        if (refreshComplete) {
          this.#tokenRefreshPromise = undefined;
        }
      }
    })();

    return this.#tokenRefreshPromise;
  }

  /**
   * Safely dispose of the client instance
   * @public
   */
  dispose(): void {
    this.#tokenData = undefined;
    this.#tokenExpiryTime = undefined;
    
    // Clear any sensitive data
    Object.defineProperties(this, {
      _clientId: { value: '' },
      _clientSecret: { value: '' }
    });
  }
} 