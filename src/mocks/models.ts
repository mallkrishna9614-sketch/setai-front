import type { ModelInfo } from '../types/model';

export const MOCK_MODELS: ModelInfo[] = [
  {
    name: 'SatQuery RS-VLM',
    version: 'v0.1.0',
    task_type: 'VQA & Scene Reasoning',
    description: 'Remote-sensing vision-language model fine-tuned on multi-sensor satellite imagery (Optical, Sentinel-2, Landsat) for complex spatial queries.',
    adapter_availability: 'LoRA RS-EarthV2 (Active)',
    handler_availability: 'Ready (Inference Engine V2)',
    supported_modalities: ['Optical', 'Multispectral'],
    input_resolution: '10m - 30m GSD'
  },
  {
    name: 'SatQuery Change Model',
    version: 'v0.1.0',
    task_type: 'Change Analysis',
    description: 'Bi-temporal Siamese transformer for detecting surface transformations, urban expansion, and environmental dynamics across acquisition pairs.',
    adapter_availability: 'None (Dense Feature Backbone)',
    handler_availability: 'Ready (TorchScript V1)',
    supported_modalities: ['Optical', 'Multispectral', 'SAR'],
    input_resolution: '10m - 20m GSD'
  },
  {
    name: 'SatQuery Grounding',
    version: 'v0.1.0',
    task_type: 'Grounding & Entity Localization',
    description: 'Text-guided spatial locator generating georeferenced bounding boxes and candidate masks for specific targets (water bodies, runways, infrastructure).',
    adapter_availability: 'EarthGround-LoRA (Active)',
    handler_availability: 'Ready (ONNX Runtime)',
    supported_modalities: ['Optical', 'Multispectral'],
    input_resolution: '10m GSD'
  },
  {
    name: 'SatQuery Optical-SAR Fusion',
    version: 'v0.1.0',
    task_type: 'Optical-SAR Cross-Modal Analysis',
    description: 'Co-registered multi-modal fusion network leveraging optical spectral signatures alongside Sentinel-1 SAR C-band microwave backscatter.',
    adapter_availability: 'CrossModal-AlignV1 (Active)',
    handler_availability: 'Ready (TensorRT)',
    supported_modalities: ['Optical', 'SAR'],
    input_resolution: '10m GSD'
  },
  {
    name: 'SatQuery Scene Captioner',
    version: 'v0.1.0',
    task_type: 'Scene Captioning',
    description: 'Specialist generative summarizer producing concise, scientifically grounded descriptions of land-use classifications and dominant morphological features.',
    adapter_availability: 'RS-Cap-V3 (Active)',
    handler_availability: 'Ready (Inference Engine V2)',
    supported_modalities: ['Optical', 'Multispectral'],
    input_resolution: '10m - 30m GSD'
  }
];
