/**
 * SatQuery AI - API Client Architecture
 * 
 * Supports transparent switching between Mock API Mode and Live FastAPI Backend.
 * Can be controlled via:
 * 1. Environment variables (VITE_API_BASE_URL, VITE_USE_MOCK_API)
 * 2. Runtime user override stored in localStorage
 */

const ENV_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
const ENV_MOCK_MODE = import.meta.env.VITE_USE_MOCK_API === 'true' || import.meta.env.VITE_USE_MOCK_API === undefined;

export const STORAGE_KEY_BASE_URL = 'satquery_api_base_url';
export const STORAGE_KEY_MOCK_MODE = 'satquery_use_mock_api';

export function getApiBaseUrl(): string {
  const saved = localStorage.getItem(STORAGE_KEY_BASE_URL);
  return saved || ENV_BASE_URL;
}

export function setApiBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_KEY_BASE_URL, url.trim().replace(/\/+$/, ''));
}

export function isMockMode(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY_MOCK_MODE);
  if (saved !== null) {
    return saved === 'true';
  }
  return ENV_MOCK_MODE;
}

export function setMockMode(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY_MOCK_MODE, enabled ? 'true' : 'false');
}

/**
 * Generic fetch wrapper for live FastAPI backend endpoints
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Only set Content-Type to JSON if body is NOT FormData
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        errorMessage = errorJson.detail || errorJson.message || errorMessage;
      } catch {
        // use fallback statusText
      }
      throw new Error(errorMessage);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend at ${baseUrl}. Ensure FastAPI is running or switch to Mock Mode.`);
    }
    throw error;
  }
}

/**
 * Check connectivity to the live backend
 */
export async function checkBackendHealth(): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  const startTime = performance.now();
  const baseUrl = getApiBaseUrl();

  try {
    const res = await fetch(`${baseUrl}/models/`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(3000)
    });
    const latencyMs = Math.round(performance.now() - startTime);

    if (res.ok) {
      return { ok: true, message: `Connected to live FastAPI backend (${latencyMs}ms)`, latencyMs };
    }
    return { ok: false, message: `Backend responded with HTTP ${res.status}`, latencyMs };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return { ok: false, message: 'Backend unreachable / offline', latencyMs };
  }
}
