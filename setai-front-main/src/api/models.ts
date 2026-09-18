import type { ModelsResponse } from '../types/model';
import { apiFetch, isMockMode } from './client';
import { MOCK_MODELS } from '../mocks/models';

export async function getModels(): Promise<ModelsResponse> {
  if (isMockMode()) {
    // Return mock specialist models catalog
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { models: MOCK_MODELS };
  }

  // Live FastAPI backend: GET /api/v1/models/
  return await apiFetch<ModelsResponse>('/models/', {
    method: 'GET'
  });
}
