export interface ModelInfo {
  name: string;
  task_type: string;
  version: string;
  description: string;
  adapter_availability: string;
  handler_availability: string;
  supported_modalities?: string[];
  input_resolution?: string;
}

export interface ModelsResponse {
  models: ModelInfo[];
}
