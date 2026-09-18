import type { ImageMetadata } from '../types/image';
import type { InvestigationResponse } from '../types/investigation';
import { MOCK_IMAGES } from './images';
import { MOCK_INVESTIGATIONS } from './investigations';

export interface ScenarioDefinition {
  id: string;
  name: string;
  badge: string;
  category: 'Single-Image' | 'Bi-Temporal' | 'Cross-Modal' | 'Failure & Conflict';
  description: string;
  query: string;
  images: ImageMetadata[];
  response: InvestigationResponse;
}

export const DEMO_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'vqa',
    name: '1. Single-Image VQA & Land-Cover',
    badge: 'Optical',
    category: 'Single-Image',
    description: 'Natural language scene characterization and land-use identification over coastal urban imagery.',
    query: 'Describe the land-cover and major objects visible in this image.',
    images: [MOCK_IMAGES.img_s2_optical_t1],
    response: MOCK_INVESTIGATIONS.scenario_vqa
  },
  {
    id: 'grounding',
    name: '2. Spatial Entity Grounding',
    badge: 'Target Localization',
    category: 'Single-Image',
    description: 'Text-guided spatial boundary extraction and bounding polygon generation for a target water body.',
    query: 'Highlight the water body referred to in the query.',
    images: [MOCK_IMAGES.img_s2_optical_t1],
    response: MOCK_INVESTIGATIONS.scenario_grounding
  },
  {
    id: 'change',
    name: '3. Bi-Temporal Change Detection',
    badge: 'T1 vs T2 Pair',
    category: 'Bi-Temporal',
    description: 'Siamese difference modeling over two Sentinel-2 passes to detect urban expansion and vegetation clearing.',
    query: 'What changed between these two dates, and where did the change occur?',
    images: [MOCK_IMAGES.img_s2_optical_t1, MOCK_IMAGES.img_s2_optical_t2],
    response: MOCK_INVESTIGATIONS.scenario_change
  },
  {
    id: 'dag',
    name: '4. Multi-Step DAG Pipeline',
    badge: 'Change → Grounding',
    category: 'Bi-Temporal',
    description: 'Chained agentic execution: Change Analysis identifies urban shift, followed by spatial Grounding on altered sectors.',
    query: 'Has the built-up area increased, decreased, or remained unchanged? Ground the altered sectors.',
    images: [MOCK_IMAGES.img_s2_optical_t1, MOCK_IMAGES.img_s2_optical_t2],
    response: MOCK_INVESTIGATIONS.scenario_dag
  },
  {
    id: 'optical_sar',
    name: '5. Optical + SAR Cross-Modal Fusion',
    badge: 'Multi-Sensor',
    category: 'Cross-Modal',
    description: 'Sentinel-2 optical spectrum combined with Sentinel-1 SAR C-band microwave backscatter for all-weather verification.',
    query: 'Use the optical and SAR images together to identify built-up and water-covered regions.',
    images: [MOCK_IMAGES.img_s2_optical_t1, MOCK_IMAGES.img_s1_sar_t1],
    response: MOCK_INVESTIGATIONS.scenario_optical_sar
  },
  {
    id: 'compat_fail',
    name: '6. Raster Compatibility Audit Failure',
    badge: 'Mismatch Error',
    category: 'Failure & Conflict',
    description: 'Demonstrates spatial safety gates: catches mismatched CRS (EPSG:32643 vs EPSG:4326), disjoint bounds, and resolution discrepancy.',
    query: 'Compare changes between these two candidate satellite tiles.',
    images: [MOCK_IMAGES.img_s2_optical_t1, MOCK_IMAGES.img_incompatible_raster],
    response: MOCK_INVESTIGATIONS.scenario_compat_fail
  },
  {
    id: 'conflict',
    name: '7. Multi-Model Sensory Conflict',
    badge: 'Discrepancy Detected',
    category: 'Failure & Conflict',
    description: 'Simulates sensor disagreement: Optical indices indicate drought/bare soil, while SAR indicates saturated sub-canopy water.',
    query: 'Determine whether the western agricultural sector is flooded or in vegetative drought.',
    images: [MOCK_IMAGES.img_s2_optical_t1, MOCK_IMAGES.img_s1_sar_t1],
    response: MOCK_INVESTIGATIONS.scenario_conflict
  },
  {
    id: 'model_fail',
    name: '8. Specialist Model OOM Failure',
    badge: 'Graceful Degradation',
    category: 'Failure & Conflict',
    description: 'Demonstrates robust error handling when high-compute 3D photogrammetric elevation modeling exceeds GPU limits.',
    query: 'Run dense 3D photogrammetric elevation reconstruction and sub-pixel edge vectorization.',
    images: [MOCK_IMAGES.img_s2_optical_t1],
    response: MOCK_INVESTIGATIONS.scenario_model_fail
  }
];
