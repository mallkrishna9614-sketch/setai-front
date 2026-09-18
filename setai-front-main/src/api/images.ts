import type { ImageMetadata, ImageUploadResponse, Modality } from '../types/image';
import { apiFetch, isMockMode } from './client';

export async function uploadImage(file: File, modality: Modality): Promise<ImageUploadResponse> {
  if (isMockMode()) {
    // Simulate brief network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Create a local blob preview for rendering the user's uploaded file
    const previewUrl = URL.createObjectURL(file);
    const id = `img_mock_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Generate realistic remote-sensing metadata according to the modality
    let bands = 3;
    let dtype = 'uint8';
    let resolution = 10.0;
    if (modality === 'Multispectral') {
      bands = 12;
      dtype = 'uint16';
      resolution = 10.0;
    } else if (modality === 'SAR') {
      bands = 2; // VV, VH
      dtype = 'float32';
      resolution = 10.0;
    }

    const mockImage: ImageMetadata = {
      image_id: id,
      filename: file.name,
      modality,
      width: 1024,
      height: 1024,
      bands,
      dtype,
      crs: 'EPSG:32643',
      resolution_x: resolution,
      resolution_y: resolution,
      bounds: [72.82, 18.92, 72.95, 19.05],
      transform: [resolution, 0.0, 271200.0, 0.0, -resolution, 2108000.0],
      file_size_bytes: file.size,
      preview_url: previewUrl,
      file
    };

    return { image: mockImage };
  }

  // TIFF file validation: accept .tif and .tiff
  const filename = file.name.toLowerCase();
  if (!filename.endsWith('.tif') && !filename.endsWith('.tiff')) {
    throw new Error('Only GeoTIFF files (.tif, .tiff) are accepted.');
  }

  // Live FastAPI backend: POST /api/v1/images/upload
  const modalityMap = {
    Optical: 'optical',
    Multispectral: 'multispectral',
    SAR: 'sar',
  } as const;

  const backendModality = modalityMap[modality];

  if (!backendModality) {
    throw new Error(`Invalid modality: ${modality}`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('modality', backendModality);

  const response = await apiFetch<ImageUploadResponse>('/images/upload', {
    method: 'POST',
    body: formData
  });

  console.log('SatQuery AI - Upload Success:', response);

  // Attach local blob preview and file reference for client-side GeoTIFF rendering
  if (response.image) {
    response.image.file = file;
    if (!response.image.preview_url) {
      response.image.preview_url = URL.createObjectURL(file);
    }
  }

  return response;
}
