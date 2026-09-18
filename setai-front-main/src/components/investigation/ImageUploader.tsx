import React, { useRef, useState } from 'react';
import { UploadCloud, Trash2, Loader2 } from 'lucide-react';
import type { ImageMetadata, Modality } from '../../types/image';
import { formatBytes, formatResolution } from '../../utils/formatters';
import { MOCK_IMAGES } from '../../mocks/images';

interface ImageUploaderProps {
  images: ImageMetadata[];
  onAddImage: (image: ImageMetadata) => void;
  onRemoveImage: (imageId: string) => void;
  onUpdateModality: (imageId: string, modality: Modality) => void;
  onUploadFile: (file: File, modality: Modality) => Promise<void>;
  isLoading: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  images,
  onAddImage,
  onRemoveImage,
  onUpdateModality,
  onUploadFile,
  isLoading
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedModality, setSelectedModality] = useState<Modality>('Optical');
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInvestigationCategory = () => {
    if (images.length === 0) return 'No imagery loaded';
    if (images.length === 1) return 'Single image';
    
    const modalities = images.map(i => i.modality);
    const hasOptical = modalities.includes('Optical') || modalities.includes('Multispectral');
    const hasSar = modalities.includes('SAR');

    if (hasOptical && hasSar) {
      return 'Cross-modal pair (Optical + SAR)';
    }
    if (modalities.every(m => m === 'Optical' || m === 'Multispectral')) {
      return 'Bi-temporal pair';
    }
    return 'Dual sensor pair';
  };

  const getValidationWarning = () => {
    if (images.length < 2) return null;
    const img1 = images[0];
    const img2 = images[1];

    if (img1.crs !== img2.crs && img1.crs !== null && img2.crs !== null) {
      return `CRS mismatch: ${img1.crs} vs ${img2.crs}. Automated reprojection required.`;
    }
    if (
      img1.resolution_x !== null &&
      img2.resolution_x !== null &&
      Math.abs(img1.resolution_x - img2.resolution_x) > 20
    ) {
      return `Resolution discrepancy: ${img1.resolution_x}m vs ${img2.resolution_x}m GSD.`;
    }
    return null;
  };

  const validationWarning = getValidationWarning();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await processUploadedFile(file);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await processUploadedFile(file);
      e.target.value = '';
    }
  };

  const processUploadedFile = async (file: File) => {
    if (images.length >= 2) {
      alert('Maximum of 2 images supported.');
      return;
    }

    setUploading(true);
    try {
      await onUploadFile(file, selectedModality);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const loadPreset = (presetKey: keyof typeof MOCK_IMAGES) => {
    if (images.length >= 2) return;
    const preset = MOCK_IMAGES[presetKey];
    onAddImage({
      ...preset,
      slot_label: images.length === 0 ? 'Image 1' : 'Image 2'
    });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">
          Satellite imagery
        </h3>
        <span className="text-xs text-neutral-400 font-normal">
          {getInvestigationCategory()}
        </span>
      </div>

      {/* Validation Advisory */}
      {validationWarning && (
        <div className="p-2.5 rounded bg-status-warningMuted border border-status-warning/30 text-status-warning text-xs">
          {validationWarning}
        </div>
      )}

      {/* Uploaded Images List */}
      <div className="space-y-3">
        {images.map((img, idx) => {
          const slotLabel = idx === 0 ? 'Image 1' : 'Image 2';
          return (
            <div
              key={img.image_id || idx}
              className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-2"
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-medium text-neutral-400 shrink-0">
                    {slotLabel}:
                  </span>
                  <span className="text-xs font-mono text-neutral-200 truncate">
                    {img.filename}
                  </span>
                </div>

                <button
                  onClick={() => onRemoveImage(img.image_id)}
                  disabled={isLoading}
                  title="Remove image"
                  className="text-neutral-500 hover:text-neutral-300 p-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Modality & Specs */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-900">
                {/* Modality toggle */}
                <div className="flex items-center gap-1 text-xs">
                  {(['Optical', 'Multispectral', 'SAR'] as Modality[]).map((mod) => (
                    <button
                      key={mod}
                      type="button"
                      onClick={() => onUpdateModality(img.image_id, mod)}
                      disabled={isLoading}
                      className={`px-2 py-0.5 rounded text-xs transition-colors ${
                        img.modality === mod
                          ? 'bg-neutral-800 text-neutral-100 font-medium'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {mod}
                    </button>
                  ))}
                </div>

                {/* Specs in plain readable text */}
                <div className="text-[11px] font-mono text-neutral-400">
                  {img.width}×{img.height} · {img.bands}b ({img.dtype}) · {img.crs} · {formatResolution(img.resolution_x, img.resolution_y)} · {formatBytes(img.file_size_bytes)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Zone */}
      {images.length < 2 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>Next image modality:</span>
            <div className="flex items-center gap-1">
              {(['Optical', 'Multispectral', 'SAR'] as Modality[]).map((mod) => (
                <button
                  key={mod}
                  type="button"
                  onClick={() => setSelectedModality(mod)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    selectedModality === mod
                      ? 'bg-neutral-800 text-neutral-100 font-medium'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {mod}
                </button>
              ))}
            </div>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded p-4 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-neutral-500 bg-neutral-900'
                : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/60 hover:bg-neutral-950'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".tif,.tiff,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center justify-center gap-2 text-neutral-400 text-xs">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
                  <span>Processing image metadata...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 text-neutral-400" />
                  <span>Drop GeoTIFF / TIFF / PNG / JPEG file or click to browse</span>
                </>
              )}
            </div>
          </div>

          {/* Quick preset links */}
          <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            <span>Or load sample:</span>
            <button
              type="button"
              onClick={() => loadPreset('img_s2_optical_t1')}
              className="text-neutral-400 hover:text-neutral-200 hover:underline"
            >
              Optical T1
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => loadPreset('img_s2_optical_t2')}
              className="text-neutral-400 hover:text-neutral-200 hover:underline"
            >
              Optical T2
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => loadPreset('img_s1_sar_t1')}
              className="text-neutral-400 hover:text-neutral-200 hover:underline"
            >
              SAR IW (VV/VH)
            </button>
            <span>·</span>
            <button
              type="button"
              onClick={() => loadPreset('img_l9_multispectral')}
              className="text-neutral-400 hover:text-neutral-200 hover:underline"
            >
              Landsat-9
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
