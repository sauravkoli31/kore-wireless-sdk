export interface SecretCreated {
  id: string;
  name: string;
  secret: string;
  status: 'active' | 'pending';
  last_modified: string;
}

export interface SecretResponse {
  id: string;
  name: string;
  status: 'active' | 'pending';
  last_modified: string;
}

export interface PaginatedSecretResponse {
  data: SecretResponse[];
  meta_data: {
    count: number;
    page_size: number;
    page_number: number;
    previous_page_url?: string;
    next_page_url?: string;
  };
}

export interface CreateSecretRequest {
  Name: string;
}

export interface ModifySecretRequest {
  Name?: string;
  Status?: 'active' | 'pending';
} 