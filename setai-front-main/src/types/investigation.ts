export type EvidenceType = 'Visual' | 'Scene' | 'Spatial' | 'Temporal' | 'Cross-modal';

export interface InvestigationTask {
  task_id: string;
  task_type: string;
  image_ids: string[];
  query: string;
  parameters: Record<string, any>;
  depends_on?: string[];
  status?: 'pending' | 'running' | 'completed' | 'failed';
}

export interface ModelResult {
  model_name: string;
  version: string;
  task: string;
  description: string;
  output?: Record<string, any> | string;
  status: string;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  description: string;
  source: string; // source / model
  task: string;
  model_version: string;
  metrics?: Record<string, any>;
}

export interface ConfidenceData {
  score?: number | null;
  confidence?: number | null;
  label?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  associated_model?: string;
  task_type?: string;
  task_id?: string;
  model?: { name?: string; version?: string } | Record<string, string>;
  factors?: string[];
}

export interface ConflictItem {
  conflict_id: string;
  conflict_type: string;
  affected_tasks: string[];
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CompatibilityData {
  compatible: boolean;
  reasons: string[];
}

export interface TraceStep {
  step: 
    | 'mission_received'
    | 'plan_created'
    | 'plan_validation'
    | 'raster_compatibility'
    | 'dependency_resolution'
    | 'model_execution'
    | 'evidence_collection'
    | 'conflict_detection'
    | 'confidence_calculation'
    | 'investigation_completed'
    | string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed' | string;
  timestamp: string;
  details?: string | Record<string, any>;
}

export interface FindingRegion {
  id: string;
  label: string;
  // Normalized bounding box [ymin, xmin, ymax, xmax] or [x, y, width, height]
  bbox: [number, number, number, number];
  geo_coordinates?: {
    latitude: number;
    longitude: number;
  };
  confidence?: number;
}

export interface InvestigationFinding {
  summary: string;
  task_type: string;
  answer?: string;
  scene?: string;
  change_detected?: boolean;
  change_type?: string;
  regions?: FindingRegion[];
  cross_modal_finding?: string;
}

export interface ChangeAnalysisData {
  comparison?: string;
  reference_image?: string;
  match_score?: number;
  changed_area?: number;
  regions?: number | FindingRegion[];
  signal?: number;
  reproduction_id?: string;
}

export interface ExecutionData {
  model_results: ModelResult[];
  evidence: EvidenceItem[];
  confidence: ConfidenceData | ConfidenceData[];
  conflicts: ConflictItem[];
  compatibility?: CompatibilityData;
  trace: TraceStep[];
  change_analysis?: ChangeAnalysisData | null;
}

export interface InvestigationResponse {
  investigation_id: string;
  status: 'completed' | 'failed' | 'in_progress';
  query: string;
  tasks: InvestigationTask[];
  execution: ExecutionData;
  finding?: InvestigationFinding;
  message: string;
  created_at?: string;
}

export interface InvestigationRequest {
  query: string;
  image_ids: string[];
}
