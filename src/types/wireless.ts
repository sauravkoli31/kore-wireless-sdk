// Common Types
export interface ListMeta {
  page_size: number;
  page?: number;
  first_page_url?: string;
  previous_page_url?: string;
  url?: string;
  key?: string;
  next_page_url?: string;
}

export interface UsageApiErrorResponse {
  code: number;
  status: number;
  message: string;
  more_info?: string;
}

export interface PaginationParams {
  pageSize?: number;
  page?: number;
  pageToken?: string;
}

// Usage Records Types
export interface TimePeriod {
  start: string;
  end: string;
}

export interface DataUsageCounts {
  download: number;
  upload: number;
  total: number;
  units: string;
  billed: number;
  billing_units: string;
}

export interface InternationalDataUsageCounts extends DataUsageCounts {
  country_code: string;
}

export interface CommandsUsageCounts {
  from_sim: number;
  to_sim: number;
  total: number;
  billed: number;
  billing_units: string;
}

export interface InternationalCommandsUsageCounts extends CommandsUsageCounts {
  country_code: string;
}

export interface DataUsageDetails {
  download: number;
  upload: number;
  total: number;
  units: string;
  billed: number;
  home: DataUsageCounts;
  national_roaming: DataUsageCounts;
  international_roaming: InternationalDataUsageCounts[];
  billing_units: string;
}

export interface CommandsUsageDetails {
  from_sim: number;
  to_sim: number;
  total: number;
  billed: number;
  home: CommandsUsageCounts;
  national_roaming: CommandsUsageCounts;
  international_roaming: InternationalCommandsUsageCounts[];
  billing_units: string;
}

export interface UsageRecord {
  period: TimePeriod;
  account_sid: string;
  commands: CommandsUsageDetails;
  data: DataUsageDetails;
}

export interface UsageList {
  usage_records: UsageRecord[];
  meta: ListMeta;
}

export interface SIMUsageList {
  usage_records: UsageRecord[];
  meta: ListMeta;
}

export type Granularity = 'all' | 'daily' | 'hourly';

// Rate Plans Types
export interface RatePlan {
  sid?: string;
  unique_name?: string;
  account_sid?: string;
  friendly_name?: string;
  data_enabled?: boolean;
  data_metering?: string;
  data_limit?: number;
  messaging_enabled?: boolean;
  voice_enabled?: boolean;
  national_roaming_enabled?: boolean;
  national_roaming_data_limit?: number;
  international_roaming?: string[];
  international_roaming_data_limit?: number;
  date_created?: string;
  date_updated?: string;
  url?: string;
  usage_notification_url?: string;
  usage_notification_method?: string;
  data_limit_strategy?: string;
}

export interface CreateRatePlanRequest {
  [key: string]: unknown;
  uniqueName?: string;
  friendlyName?: string;
  dataEnabled?: boolean;
  dataLimit?: number;
  dataMetering?: string;
  messagingEnabled?: boolean;
  voiceEnabled?: boolean;
  nationalRoamingEnabled?: boolean;
  internationalRoaming?: string[];
  nationalRoamingDataLimit?: number;
  internationalRoamingDataLimit?: number;
}

// SIMs Types
export type SimStatus = 'new' | 'ready' | 'active' | 'suspended' | 'deactivated' | 'canceled' | 'scheduled' | 'updating';
export type SimResetStatus = 'resetting';

export interface Sim {
  sid?: string;
  unique_name?: string;
  account_sid?: string;
  friendly_name?: string;
  Status?: SimStatus;
  rate_plan_sid?: string;
  iccid?: string;
  eid?: string;
  commands_callback_url?: string;
  commands_callback_method?: 'GET' | 'POST';
  date_created?: string;
  date_updated?: string;
  reset_status?: SimResetStatus;
  links?: {
    rate_plan?: string;
    usage_records?: string;
    data_sessions?: string;
  };
  url?: string;
}

export interface UpdateSimRequest {
  [key: string]: unknown;
  UniqueName?: string;
  CallbackMethod?: 'GET' | 'POST';
  CallbackUrl?: string;
  FriendlyName?: string;
  RatePlan?: string;
  Status?: SimStatus;
  CommandsCallbackMethod?: 'GET' | 'POST';
  CommandsCallbackUrl?: string;
  SmsFallbackMethod?: 'GET' | 'POST';
  SmsFallbackUrl?: string;
  SmsMethod?: 'GET' | 'POST';
  SmsUrl?: string;
  VoiceFallbackMethod?: 'GET' | 'POST';
  VoiceFallbackUrl?: string;
  VoiceMethod?: 'GET' | 'POST';
  VoiceUrl?: string;
  ResetStatus?: SimResetStatus;
  AccountSid?: string;
}

// Commands Types
export type CommandMode = 'text' | 'binary';
export type CommandTransport = 'sms' | 'ip';
export type CommandStatus = 'queued' | 'sent' | 'delivered' | 'received' | 'failed';
export type CommandDirection = 'from_sim' | 'to_sim';

export interface Command {
  sid?: string;
  account_sid?: string;
  sim_sid?: string;
  command?: string;
  command_mode?: CommandMode;
  transport?: CommandTransport;
  delivery_receipt_requested?: boolean;
  status?: CommandStatus;
  direction?: CommandDirection;
  date_created?: string;
  date_updated?: string;
  url?: string;
}

export interface CreateCommandRequest {
  [key: string]: unknown;
  Command: string;
  Sim?: string;
  CallbackMethod?: 'GET' | 'POST';
  CallbackUrl?: string;
  CommandMode?: CommandMode;
  IncludeSid?: 'none' | 'start' | 'end';
  DeliveryReceiptRequested?: boolean;
}

// Data Sessions Types
export interface CellLocationEstimate {
  lat: number;
  lon: number;
}

export interface DataSession {
  sid?: string;
  sim_sid?: string;
  account_sid?: string;
  radio_link?: string;
  operator_mcc?: string;
  operator_mnc?: string;
  operator_country?: string;
  operator_name?: string;
  cell_id?: string;
  cell_location_estimate?: CellLocationEstimate;
  packets_uploaded?: number;
  packets_downloaded?: number;
  last_updated?: string;
  start?: string;
  end?: string;
  imei?: string;
}

/**
 * HTTP request options
 * @internal
 */
export interface RequestOptions {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Base URL */
  baseURL?: string;
  /** Query parameters */
  params?: URLSearchParams;
  /** Request body */
  body?: Record<string, unknown>;
  /** Expected response status codes */
  expectedStatus: number[];
  /** Custom headers */
  headers?: CustomHeaders;
}

export interface ApiError extends Error {
  code: number;
  status: number;
  details?: string;
}

/**
 * Custom headers for API requests
 * @internal
 */
export interface CustomHeaders {
  [key: string]: string | undefined;
  'Content-Type'?: string;
  'Authorization'?: string;
  'Accept'?: string;
}

/**
 * Request interceptor function type
 * @internal
 */
export type RequestInterceptor = (
  request: RequestOptions & { headers: CustomHeaders }
) => Promise<RequestOptions & { headers: CustomHeaders }>;

/**
 * Response interceptor function type
 * @internal
 */
export type ResponseInterceptor = (
  response: Response,
  requestOptions: RequestOptions
) => Promise<Response>;

// Update existing interfaces to include index signatures
export interface CreateSecretRequest {
  [key: string]: unknown;
  Name: string;
}

export interface ModifySecretRequest {
  [key: string]: unknown;
  Name?: string;
  Status?: 'active' | 'pending';
} 