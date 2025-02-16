/**
 * Authentication token response
 * @public
 */
export interface TokenResponse {
  /** The access token string */
  access_token: string;
  /** Time in seconds until the token expires */
  expires_in: number;
  /** The type of token (usually "Bearer") */
  token_type: string;
  /** Optional scope of the token */
  scope?: string;
}

/**
 * API health check response
 * @public
 */
export interface PingResponse {
  /** Status message */
  message: string;
}

/**
 * Standard error response
 * @public
 */
export interface ErrorResponse {
  /** Error code */
  code: number;
  /** Error message */
  message: string;
}

/**
 * Authentication error response
 * @public
 */
export interface UnauthorizedError extends Error {
  /** Error type */
  error: string;
  /** Detailed error description */
  error_description: string;
}

/**
 * Paginated response wrapper
 * @public
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Pagination metadata */
  meta: {
    /** Current page number */
    page: number;
    /** Number of items per page */
    page_size: number;
    /** Total number of items */
    total: number;
    /** URL for the next page, if available */
    next_page_url?: string;
    /** URL for the previous page, if available */
    prev_page_url?: string;
  };
}

/**
 * Helper function to handle paginated responses
 * @param fetchPage - Function to fetch a page of results
 * @returns AsyncGenerator that yields items one at a time
 * @public
 */
export async function* paginate<T>(
  fetchPage: (pageToken?: string) => Promise<PaginatedResponse<T>>
): AsyncGenerator<T, void, unknown> {
  let pageToken: string | undefined;
  
  do {
    const response = await fetchPage(pageToken);
    
    for (const item of response.data) {
      yield item;
    }
    
    pageToken = response.meta.next_page_url;
  } while (pageToken);
} 