import { TokenResponse, ErrorResponse, UnauthorizedError } from '../types/responses';
import { createHash } from 'crypto';

/**
 * Handles authentication token operations
 * @internal
 */
export class TokenApi {
  private readonly baseURL: string;
  private readonly requestTimeout = 30000; // 30 seconds
  private readonly maxRetries = 3;

  constructor(baseURL: string = 'https://api.korewireless.com/api-services') {
    this.baseURL = baseURL;
  }

  /**
   * Get an access token using client credentials
   * @param clientId - The client ID
   * @param clientSecret - The client secret
   * @param grantType - The grant type (default: 'client_credentials')
   * @returns Promise containing the token response
   * @throws {UnauthorizedError} If credentials are invalid
   * @throws {Error} If the request fails
   */
  async getToken(
    clientId: string,
    clientSecret: string,
    grantType: string = 'client_credentials'
  ): Promise<TokenResponse> {
    let retryCount = 0;
    let lastError: Error | null = null;

    while (retryCount < this.maxRetries) {
      try {
        return await this.makeTokenRequest(clientId, clientSecret, grantType);
      } catch (error) {
        lastError = error as Error;
        if (!this.shouldRetry(error) || retryCount === this.maxRetries - 1) {
          throw error;
        }
        retryCount++;
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
      }
    }

    throw lastError;
  }

  private async makeTokenRequest(
    clientId: string,
    clientSecret: string,
    grantType: string
  ): Promise<TokenResponse> {
    // Hash credentials for request ID to avoid logging sensitive data
    const requestId = this.generateRequestId(clientId);
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', grantType);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.baseURL}/v1/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'cache-control': 'no-cache',
          'X-Request-ID': requestId,
        },
        body: params,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw this.createUnauthorizedError(data);
        } else {
          throw this.createErrorResponse(data, response.status);
        }
      }

      this.validateTokenResponse(data);
      return data as TokenResponse;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Token request timeout');
        }
        throw new Error(`Failed to get token: ${error.message}`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateTokenResponse(data: unknown): asserts data is TokenResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid token response format');
    }

    const { access_token, expires_in, token_type, scope } = data as Partial<TokenResponse>;

    if (!access_token || typeof access_token !== 'string') {
      throw new Error('Invalid access token in response');
    }
    if (!expires_in || typeof expires_in !== 'number') {
      throw new Error('Invalid expiration time in response');
    }
    if (!token_type || typeof token_type !== 'string') {
      throw new Error('Invalid token type in response');
    }
    if (scope !== undefined && typeof scope !== 'string') {
      throw new Error('Invalid scope in response');
    }
  }

  private createUnauthorizedError(data: unknown): UnauthorizedError {
    const error = new Error('Authentication failed') as UnauthorizedError;
    error.name = 'UnauthorizedError';
    if (typeof data === 'object' && data !== null) {
      const { error: code, error_description } = data as Record<string, unknown>;
      error.error = String(code || 'unauthorized');
      error.error_description = String(error_description || 'Invalid credentials');
    }
    return error;
  }

  private createErrorResponse(data: unknown, status: number): ErrorResponse {
    return {
      code: status,
      message: typeof data === 'object' && data !== null && 'message' in data
        ? String(data.message)
        : 'Failed to get token',
    };
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      if (error.name === 'UnauthorizedError') {
        return false; // Don't retry auth failures
      }
      return error.name === 'AbortError' || error.message.includes('network');
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateRequestId(clientId: string): string {
    // Create a hash of the client ID to use in request tracking without exposing sensitive data
    const hash = createHash('sha256')
      .update(clientId)
      .digest('hex')
      .slice(0, 8);
    
    return `${Date.now()}-${hash}`;
  }
} 