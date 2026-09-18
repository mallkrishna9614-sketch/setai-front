export type Modality = 'Optical' | 'Multispectral' | 'SAR';

export interface ImageMetadata {
  image_id: string;
  filename: string;
  modality: Modality;
  width: number;
  height: number;
  bands: number;
  dtype: string;
  crs: string | null;
  resolution_x: number | null;
  resolution_y: number | null;
  bounds: [number, number, number, number] | []; // [min_x, min_y, max_x, max_y] (e.g. lon/lat or projected)
  transform: number[];
  file_size_bytes: number;
  preview_url?: string;
  slot_label?: 'Image 1' | 'Image 2';
  file?: File;
}

export interface ImageUploadResponse {
  image: ImageMetadata;
}
