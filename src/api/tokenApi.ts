import { TokenResponse, ErrorResponse, UnauthorizedError } from '../types/responses';

export class TokenApi {
  private baseURL: string;

  constructor(baseURL: string = 'https://api.korewireless.com/api-services') {
    this.baseURL = baseURL;
  }

  /**
   * Get an access token using client credentials
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @param grantType - The grant type (default: 'client_credentials')
   * @returns Promise containing the token response
   */
  async getToken(
    clientId: string,
    clientSecret: string,
    grantType: string = 'client_credentials'
  ): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', grantType);
    try {
      const response = await fetch(`${this.baseURL}/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'cache-control': 'no-cache',
        },
        body: params,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw data as UnauthorizedError;
        } else {
          throw data as ErrorResponse;
        }
      }

      return data as TokenResponse;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get token: ${error.message}`);
      }
      throw error;
    }
  }
} 