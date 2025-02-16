export interface Fleet {
  sid: string;
  account_sid: string;
  unique_name: string;
  data_enabled: boolean;
  data_limit: number;
  sms_commands_enabled: boolean;
  sms_commands_url?: string;
  sms_commands_method?: 'GET' | 'POST';
  ip_commands_url?: string;
  ip_commands_method?: 'GET' | 'POST';
  network_access_profile_sid?: string;
  date_created: string;
  date_updated: string;
  url: string;
}

export interface Sim {
  sid: string;
  account_sid: string;
  unique_name: string;
  status: string;
  fleet_sid: string | null;
  iccid: string;
  date_created: string;
  date_updated: string;
  url: string;
  links: {
    billing_periods: string;
    sim_ip_addresses: string;
  };
}

export interface IpCommand {
  sid: string;
  account_sid: string;
  sim_sid: string;
  status: string;
  direction: 'to_sim' | 'from_sim';
  payload: string;
  payload_type: 'text' | 'binary';
  date_created: string;
  date_updated: string;
  url: string;
}

export interface SmsCommand {
  sid: string;
  account_sid: string;
  sim_sid: string;
  status: string;
  direction: 'to_sim' | 'from_sim';
  payload: string;
  date_created: string;
  date_updated: string;
  url: string;
} 