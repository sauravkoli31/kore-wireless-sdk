export interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface PingResponse {
  message: string;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

export interface UnauthorizedError {
  error: string;
  error_description: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    page_size: number;
    total: number;
    next_page_url?: string;
    prev_page_url?: string;
  };
}

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