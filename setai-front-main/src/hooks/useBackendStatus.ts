import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth, getApiBaseUrl, isMockMode, setApiBaseUrl, setMockMode } from '../api/client';
import type { BackendConnectionStatus } from '../types/api';

export function useBackendStatus() {
  const [mockMode, setMockModeState] = useState<boolean>(isMockMode());
  const [baseUrl, setBaseUrlState] = useState<string>(getApiBaseUrl());
  const [status, setStatus] = useState<BackendConnectionStatus>(isMockMode() ? 'offline_mock' : 'checking');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const refreshStatus = useCallback(async () => {
    if (mockMode) {
      setStatus('offline_mock');
      setStatusMessage('Mock Mode Active (Backend bypassed)');
      setLatencyMs(null);
      return;
    }

    setStatus('checking');
    setStatusMessage('Checking FastAPI backend health...');
    const result = await checkBackendHealth();
    setLatencyMs(result.latencyMs);

    if (result.ok) {
      setStatus('connected');
      setStatusMessage(result.message);
    } else {
      setStatus('error');
      setStatusMessage(result.message);
    }
  }, [mockMode]);

  useEffect(() => {
    refreshStatus();
    // Poll backend health every 15s if live mode is active
    if (!mockMode) {
      const interval = setInterval(refreshStatus, 15000);
      return () => clearInterval(interval);
    }
  }, [mockMode, refreshStatus]);

  const toggleMockMode = (enable: boolean) => {
    setMockMode(enable);
    setMockModeState(enable);
  };

  const updateBaseUrl = (newUrl: string) => {
    setApiBaseUrl(newUrl);
    setBaseUrlState(newUrl);
    refreshStatus();
  };

  return {
    mockMode,
    baseUrl,
    status,
    latencyMs,
    statusMessage,
    toggleMockMode,
    updateBaseUrl,
    refreshStatus
  };
}
