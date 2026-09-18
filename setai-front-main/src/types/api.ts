export interface ApiError {
  message: string;
  detail?: string;
  status_code?: number;
}

export type BackendConnectionStatus = 'connected' | 'offline_mock' | 'checking' | 'error';
