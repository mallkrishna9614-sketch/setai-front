import React, { useState, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye,
  Columns2,
  SlidersHorizontal
} from 'lucide-react';
import type { ImageMetadata } from '../../types/image';
import type { FindingRegion } from '../../types/investigation';
import { GeoTIFFCanvas } from './GeoTIFFCanvas';
import { clearGeoTIFFCache } from '../../utils/geotiffRenderer';
import { getApiBaseUrl } from '../../api/client';

// Remote SatQuery ML artifact host. The ML service returns artifact filenames
// such as train_11.png; resolve those against the ML service instead of Vercel.
const ML_ARTIFACT_BASE_URL = (import.meta.env.VITE_ML_BASE_URL || 'https://epa-writings-duo-acting.trycloudflare.com').replace(/\/+$/, '');

interface ImageViewerProps {
  images: ImageMetadata[];
  regions?: FindingRegion[];
  changeVisualizationUrl?: string;
  changeMaskUrl?: string;
  referenceImageUrl?: string | Record<string, any>;
  modelOutput?: Record<string, any>;
  isLoading?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  regions = [],
  changeVisualizationUrl,
  changeMaskUrl,
  referenceImageUrl,
  modelOutput,
  isLoading = false
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'side-by-side' | 'swipe' | 'single'>('side-by-side');
  const [swipePosition, setSwipePosition] = useState<number>(50); // percentage
  const [mouseCoords, setMouseCoords] = useState<{ 
    x: number; 
    y: number; 
    lat?: number; 
    lon?: number;
    slot?: string;
  } | null>(null);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [referenceArtifactReady, setReferenceArtifactReady] = useState<boolean>(false);
  const [changeArtifactReady, setChangeArtifactReady] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const swipeBarRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;
  const changeArtifact = changeVisualizationUrl || changeMaskUrl;

  const findArtifact = (value: unknown, keys: string[]): string | undefined => {
    const seen = new Set<object>();
    const queue: Array<{ value: unknown }> = [{ value }];

    const asImageSource = (candidate: unknown): string | undefined => {
      if (typeof candidate !== 'string') return undefined;
      const text = candidate.trim();
      if (!text) return undefined;
      if (/^data:image\//i.test(text) || /^blob:/i.test(text) || /^https?:\/\//i.test(text) || /^\//.test(text)) {
        return text;
      }

      const looksLikeBase64 = /^[A-Za-z0-9+/=\s_-]+$/.test(text) && text.length > 200;
      if (looksLikeBase64) {
        return `data:image/jpeg;base64,${text.replace(/\s/g, '')}`;
      }
      return undefined;
    };

    while (queue.length) {
      const { value: current } = queue.shift()!;
      if (!current || typeof current !== 'object') continue;
      if (seen.has(current as object)) continue;
      seen.add(current as object);

      if (Array.isArray(current)) {
        current.forEach(item => queue.push({ value: item }));
        continue;
      }

      const record = current as Record<string, unknown>;

      for (const key of keys) {
        const candidate = asImageSource(record[key]);
        if (candidate) return candidate;
      }

      for (const [key, candidate] of Object.entries(record)) {
        const source = asImageSource(candidate);
        if (source && /base64|image|visual|overlay|mask|change|reference|historical|before|current/i.test(key)) {
          return source;
        }
        if (candidate && typeof candidate === 'object') {
          queue.push({ value: candidate });
        }
      }
    }

    return undefined;
  };

  const resolveArtifactCandidates = (value?: string): string[] => {
    if (!value) return [];
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (/^data:/i.test(trimmed) || /^blob:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
      return [trimmed];
    }
    if (trimmed.startsWith('//')) return [window.location.protocol + trimmed];
    if (trimmed.startsWith('/')) return [getApiBaseUrl() + trimmed];

    // Remote ML may return generated artifacts as bare filenames.
    // Try the common static prefixes because the ML host may not expose
    // generated files from its root path.
    if (/^[^/\\]+\.(png|jpe?g|webp|gif|tiff?)$/i.test(trimmed)) {
      const name = encodeURIComponent(trimmed);
      return [
        ML_ARTIFACT_BASE_URL + '/' + name,
        ML_ARTIFACT_BASE_URL + '/artifacts/' + name,
        ML_ARTIFACT_BASE_URL + '/outputs/' + name,
        ML_ARTIFACT_BASE_URL + '/results/' + name,
        ML_ARTIFACT_BASE_URL + '/static/' + name,
        ML_ARTIFACT_BASE_URL + '/generated/' + name
      ];
    }

    return [ML_ARTIFACT_BASE_URL + '/' + trimmed.replace(/^\/+/, '')];
  };

  const resolveArtifactUrl = (value?: string): string | undefined => {
    return resolveArtifactCandidates(value)[0];
  };

  // The remote temporal model performs the historical lookup internally.
  // Surface its reference image and annotated/current artifact even though
  // the user uploaded only one image.
  const isDirectArtifactPointer = (value: unknown): value is string => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return /^data:image\\//i.test(trimmed) ||
      /^blob:/i.test(trimmed) ||
      /^https?:\\/\\//i.test(trimmed) ||
      trimmed.startsWith('/');
  };

  const remoteChangeArtifact =
    (isDirectArtifactPointer(changeArtifact) ? changeArtifact : undefined) ||
    normalizeEmbeddedArtifact(findArtifact(modelOutput, [
      'change_visualization_base64',
      'overlay_base64',
      'annotated_image_base64',
      'visualization_base64',
      'image_base64',
      'image_data_url',
      'data_url'
    ])) ||
    findArtifact(modelOutput, [
      'change_visualization_url',
      'change_visualization',
      'annotated_image_url',
      'annotated_image',
      'overlay_image_url',
      'overlay_image',
      'current_with_changes',
      'current_image_with_changes',
      'visualization_url',
      'visualization',
      'artifact_url',
      'image_url'
    ]);

  const normalizeEmbeddedArtifact = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^data:image\//i.test(trimmed) || /^blob:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.length > 200 && /^[A-Za-z0-9+/=\s_-]+$/.test(trimmed)) {
      return `data:image/png;base64,${trimmed.replace(/\s/g, '')}`;
    }
    return undefined;
  };

  const remoteReferenceArtifact =
    (isDirectArtifactPointer(referenceImageUrl) ? referenceImageUrl : undefined) ||
    normalizeEmbeddedArtifact(findArtifact(modelOutput, [
      'reference_base64',
      'reference_image_base64',
      'historical_image_base64',
      'before_image_base64',
      'image_base64',
      'image_data_url',
      'data_url'
    ])) ||
    findArtifact(referenceImageUrl, ['url','src','href','path','uri','image_url','data_url']) ||
    findArtifact(modelOutput, [
      'reference_image_url',
      'reference_image',
      'reference',
      'before_image_url',
      'before_image',
      'historical_image_url',
      'historical_image',
      'historical_base64',
      'before_image',
      'before_base64'
    ]);

  const resolvedChangeArtifact = resolveArtifactUrl(remoteChangeArtifact);
  const resolvedReferenceArtifact = resolveArtifactUrl(remoteReferenceArtifact);
  const extractViewerRegions = (value: unknown): FindingRegion[] => {
    const found: FindingRegion[] = [];
    const seen = new Set<object>();
    const regionKeys = new Set([
      'regions', 'region_findings', 'changed_regions', 'detections',
      'change_findings', 'semantic_findings', 'findings'
    ]);

    const toNumber = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const visit = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (seen.has(node as object)) return;
      seen.add(node as object);

      if (Array.isArray(node)) {
        node.forEach(visit);
        return;
      }

      const obj = node as Record<string, unknown>;
      for (const [key, child] of Object.entries(obj)) {
        const lower = key.toLowerCase();
        if (regionKeys.has(lower) && Array.isArray(child)) {
          child.forEach((item, index) => {
            if (!item || typeof item !== 'object') return;
            const r = item as Record<string, unknown>;
            const raw = r.bbox;
            let bbox: [number, number, number, number] | null = null;

            if (Array.isArray(raw) && raw.length === 4) {
              const nums = raw.map(toNumber);
              if (nums.every((n): n is number => n !== undefined)) {
                bbox = [nums[0], nums[1], nums[2], nums[3]];
              }
            } else {
              const x = toNumber(r.x);
              const y = toNumber(r.y);
              const w = toNumber(r.width);
              const h = toNumber(r.height);
              const x1 = toNumber(r.x1);
              const y1 = toNumber(r.y1);
              const x2 = toNumber(r.x2);
              const y2 = toNumber(r.y2);
              if (x !== undefined && y !== undefined && w !== undefined && h !== undefined) {
                bbox = [y, x, y + h, x + w];
              } else if (x1 !== undefined && y1 !== undefined && x2 !== undefined && y2 !== undefined) {
                bbox = [y1, x1, y2, x2];
              }
            }

            if (bbox) {
              found.push({
                id: String(r.id ?? ('ml-change-' + (found.length + index + 1))),
                label: String(r.change ?? r.type ?? r.label ?? r.title ?? ('Detected change ' + (index + 1))),
                bbox,
                confidence: toNumber(r.confidence ?? r.score)
              });
            }
          });
        }
        if (child && typeof child === 'object') visit(child);
      }
    };

    visit(value);
    return found;
  };

  const viewerRegions = regions.length > 0 ? regions : extractViewerRegions(modelOutput);
  const hasRemoteTemporalComparison = Boolean(resolvedReferenceArtifact || viewerRegions.length);
  
  React.useEffect(() => {
    setReferenceArtifactReady(false);
  }, [resolvedReferenceArtifact]);

  React.useEffect(() => {
    setChangeArtifactReady(false);
  }, [resolvedChangeArtifact]);

  const effectiveViewMode = images.length < 2 ? 'single' : viewMode;
  const currentImage = images[activeImageIndex] || images[0];

  React.useEffect(() => {
    return () => {
      // Clear cached canvases on unmount
      clearGeoTIFFCache();
      previewUrlCache.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlCache.current.clear();
    };
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !(e.target as HTMLElement).closest('.swipe-handle')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleImagePanelMouseMove = (e: React.MouseEvent<HTMLDivElement>, targetImage: ImageMetadata) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const px = Math.round(relX * targetImage.width);
    const py = Math.round(relY * targetImage.height);

    let lat: number | undefined;
    let lon: number | undefined;

    if (targetImage.bounds && targetImage.bounds.length === 4) {
      const [minX, minY, maxX, maxY] = targetImage.bounds;
      lon = Number((minX + relX * (maxX - minX)).toFixed(5));
      lat = Number((maxY - relY * (maxY - minY)).toFixed(5));
    }

    setMouseCoords({
      x: px,
      y: py,
      lat,
      lon,
      slot: targetImage.slot_label
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isGeoTIFF = (image: ImageMetadata) => /\.(tif|tiff)$/i.test(image.filename);

  const resolvePreviewUrl = (value?: string): string | undefined => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/^data:/i.test(trimmed) || /^blob:/i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('//')) return window.location.protocol + trimmed;
    if (trimmed.startsWith('/')) return getApiBaseUrl() + trimmed;
    return getApiBaseUrl() + '/' + trimmed;
  };

  const previewUrlCache = useRef<Map<string, string>>(new Map());

  const getLocalPreviewUrl = (image: ImageMetadata): string => {
    if (!image.file) return '';
    const key = image.image_id || image.filename;
    const cached = previewUrlCache.current.get(key);
    if (cached) return cached;
    const url = URL.createObjectURL(image.file);
    previewUrlCache.current.set(key, url);
    return url;
  };

  const RemoteArtifactImage: React.FC<{
    value?: string;
    alt: string;
    className: string;
    onReady: () => void;
    onFail: () => void;
  }> = ({ value, alt, className, onReady, onFail }) => {
    const candidates = React.useMemo(() => resolveArtifactCandidates(value), [value]);
    const [index, setIndex] = React.useState(0);

    React.useEffect(() => {
      setIndex(0);
    }, [value]);

    if (!candidates.length) return null;

    return (
      <img
        src={candidates[index]}
        alt={alt}
        className={className}
        loading="eager"
        onLoad={onReady}
        onError={() => {
          if (index + 1 < candidates.length) {
            setIndex(index + 1);
          } else {
            onFail();
          }
        }}
      />
    );
  };

  const renderImage = (image: ImageMetadata, className?: string) => {
    if (!isGeoTIFF(image)) {
      // Prefer the original browser File for uploaded PNG/JPEG images.
      // Backend preview URLs may point to temporary/internal paths.
      const localSrc = getLocalPreviewUrl(image);
      const src = localSrc || resolvePreviewUrl(image.preview_url) || '';
      if (!src) {
        return (
          <div className="text-xs text-neutral-500 text-center p-4">
            Preview unavailable for this image.
          </div>
        );
      }
      return (
        <img
          src={src}
          alt={image.filename}
          className={className || 'max-w-full max-h-full object-contain'}
          draggable={false}
          onError={(event) => {
            console.warn('SatQuery AI - image preview failed:', src);
            const localSrc = image.file ? URL.createObjectURL(image.file) : '';
            if (localSrc && event.currentTarget.src !== localSrc) {
              event.currentTarget.src = localSrc;
              return;
            }
            event.currentTarget.style.display = 'none';
          }}
        />
      );
    }
    return <GeoTIFFCanvas image={image} className={className} />;
  };

  const renderChangeFallback = () => {
    if (changeArtifactReady || !viewerRegions.length) return null;
    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {viewerRegions.map((reg, index) => {
          const values = reg.bbox.map(Number);
          const maxValue = Math.max(...values.map(v => Math.abs(v)));
          const scale = maxValue > 1 ? (maxValue <= 2048 ? 1024 : maxValue) : 1;
          const [ymin, xmin, ymax, xmax] = values.map(v => Math.max(0, Math.min(1, v / scale)));
          return (
            <div
              key={'change-fallback-' + (reg.id || index)}
              className="absolute rounded border-2 border-red-400 bg-red-500/30 shadow-[0_0_14px_rgba(239,68,68,0.55)] z-30"
              style={{
                top: (ymin * 100) + '%',
                left: (xmin * 100) + '%',
                width: Math.max(1, (xmax - xmin) * 100) + '%',
                height: Math.max(1, (ymax - ymin) * 100) + '%'
              }}
            >
              <span className="absolute -top-5 left-0 rounded bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white whitespace-nowrap z-40">
                AI CHANGE
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const renderOverlays = (keyPrefix: string) => {
    if (!showOverlays || !viewerRegions.length) return null;

    const normalizeBbox = (bbox: FindingRegion['bbox']) => {
      const values = bbox.map(Number);
      const maxValue = Math.max(...values.map(v => Math.abs(v)));

      // Remote models may return pixel coordinates (0..1024) while
      // the viewer uses normalized coordinates (0..1).
      if (maxValue > 1) {
        const scale = maxValue <= 2048 ? 1024 : maxValue;
        return values.map(v => Math.max(0, Math.min(1, v / scale))) as [
          number, number, number, number
        ];
      }

      return values.map(v => Math.max(0, Math.min(1, v))) as [
        number, number, number, number
      ];
    };

    return viewerRegions.map((reg, rIdx) => {
      const [ymin, xmin, ymax, xmax] = normalizeBbox(reg.bbox);
      const cx = (xmin + xmax) / 2;
      const cy = (ymin + ymax) / 2;

      return (
        <React.Fragment key={reg.id || `${keyPrefix}-${rIdx}`}>
          <div
            className="absolute border border-status-error bg-status-error/15 rounded z-20 pointer-events-none"
            style={{
              top: `${ymin * 100}%`,
              left: `${xmin * 100}%`,
              width: `${Math.max(0.5, (xmax - xmin) * 100)}%`,
              height: `${Math.max(0.5, (ymax - ymin) * 100)}%`
            }}
          >
            <div className="absolute -top-5 left-0 bg-neutral-900 border border-neutral-800 text-neutral-200 px-1.5 py-0.5 rounded text-[10px] font-sans whitespace-nowrap shadow-md">
              {reg.label} {typeof reg.confidence === 'number' && Number.isFinite(reg.confidence) ? `· ${(reg.confidence <= 1 ? reg.confidence * 100 : reg.confidence).toFixed(1)}%` : ''}
            </div>
          </div>
          <div
            className="absolute z-30 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-status-warning border-2 border-white shadow-[0_0_0_2px_rgba(0,0,0,0.55)] pointer-events-none"
            style={{ left: `${cx * 100}%`, top: `${cy * 100}%` }}
            title={reg.label}
          />
        </React.Fragment>
      );
    });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col h-full min-h-[460px]">
      {/* Viewport Header Toolbar */}
      <div className="bg-neutral-950/80 px-4 py-2.5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-medium text-neutral-200">
            Satellite imagery preview
          </span>
          {currentImage && (
            <span className="text-neutral-500 font-mono text-[11px]">
              {currentImage.width}×{currentImage.height} · {currentImage.bands}b ({currentImage.dtype}) · {currentImage.crs}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Comparison Mode Toggles (when 2 images are loaded) */}
          {hasMultipleImages && (
            <div className="flex items-center bg-neutral-900 rounded border border-neutral-800 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('side-by-side')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  effectiveViewMode === 'side-by-side'
                    ? 'bg-neutral-800 text-neutral-100 font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="View Image 1 and Image 2 side-by-side"
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>Side-by-side</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('swipe')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors ${
                  effectiveViewMode === 'swipe'
                    ? 'bg-neutral-800 text-neutral-100 font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Interactive swipe slider comparison"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Swipe</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2 py-1 rounded transition-colors ${
                  effectiveViewMode === 'single'
                    ? 'bg-neutral-800 text-neutral-100 font-medium shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
                title="Single image view"
              >
                Single
              </button>
            </div>
          )}

          {/* Single Image Slot Selector (when in single view or 1 image) */}
          {hasMultipleImages && effectiveViewMode === 'single' && (
            <div className="flex items-center bg-neutral-900 rounded border border-neutral-800 p-0.5 text-xs">
              {images.map((img, idx) => (
                <button
                  key={img.image_id || idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    activeImageIndex === idx
                      ? 'bg-neutral-800 text-neutral-100 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {img.slot_label || `Image ${idx + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Overlays toggle */}
          {viewerRegions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowOverlays(!showOverlays)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                showOverlays
                  ? 'text-neutral-200'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Overlays ({viewerRegions.length})</span>
            </button>
          )}

          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 bg-neutral-900 rounded border border-neutral-800">
            <button
              onClick={handleZoomOut}
              disabled={images.length === 0}
              className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[11px] font-mono text-neutral-400 select-none">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={images.length === 0}
              className="p-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-30"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetView}
              disabled={images.length === 0}
              className="p-1 text-neutral-400 hover:text-neutral-200 border-l border-neutral-800 disabled:opacity-30"
              title="Reset view"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 relative bg-neutral-950 overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center bg-subtle-grid min-h-[420px]"
      >
        {/* Loading overlay for pipeline execution */}
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-neutral-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 rounded-full border border-neutral-600 border-t-neutral-200 animate-spin" />
            <span className="text-xs text-neutral-300 font-sans">
              Executing investigation pipeline...
            </span>
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 ? (
          <div className="text-center p-8 max-w-sm space-y-2">
            <h4 className="text-sm font-medium text-neutral-300">
              No imagery loaded
            </h4>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Upload a satellite image (GeoTIFF, PNG, or JPEG) or load a sample preset to display spatial data.
            </p>
          </div>
        ) : (
          <div
            className="w-full h-full relative flex items-center justify-center p-4"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {/* 1. SIDE-BY-SIDE COMPARISON (Image 1 and Image 2 displayed side-by-side) */}
            {hasRemoteTemporalComparison ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-full max-h-full">
                {/* Historical/reference panel. Always keep the uploaded image as a visual fallback. */}
                <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] max-w-[46vw] max-h-[72vh] aspect-square border border-neutral-800 shadow-xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                  {renderImage(images[0], 'w-full h-full object-contain')}
                  {resolvedReferenceArtifact && referenceArtifactReady && (
                    <RemoteArtifactImage
                      value={remoteReferenceArtifact}
                      alt="Historical satellite reference used by the temporal change model"
                      className="absolute inset-0 w-full h-full object-contain z-10"
                      onReady={() => setReferenceArtifactReady(true)}
                      onFail={() => setReferenceArtifactReady(false)}
                    />
                  )}
                  {resolvedReferenceArtifact && !referenceArtifactReady && (
                    <RemoteArtifactImage
                      value={remoteReferenceArtifact}
                      alt=""
                      className="hidden"
                      onReady={() => setReferenceArtifactReady(true)}
                      onFail={() => setReferenceArtifactReady(false)}
                    />
                  )}
                  <div className="absolute top-2.5 left-2.5 bg-neutral-950/90 px-2 py-1 rounded text-[11px] font-mono text-neutral-200 border border-neutral-800 z-10 shadow-md">
                    <span className="font-semibold">Historical reference</span>
                  </div>
                </div>

                {/* Current panel. Always show the user's current upload; ML visualization is an overlay. */}
                <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] max-w-[46vw] max-h-[72vh] aspect-square border border-neutral-800 shadow-xl overflow-hidden bg-neutral-950 flex items-center justify-center">
                  {renderImage(currentImage, 'w-full h-full object-contain')}
                  {resolvedChangeArtifact && changeArtifactReady && (
                    <RemoteArtifactImage
                      value={remoteChangeArtifact}
                      alt="Current satellite image with AI-detected changes"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                      onReady={() => setChangeArtifactReady(true)}
                      onFail={() => setChangeArtifactReady(false)}
                    />
                  )}
                  {resolvedChangeArtifact && !changeArtifactReady && (
                    <RemoteArtifactImage
                      value={remoteChangeArtifact}
                      alt=""
                      className="hidden"
                      onReady={() => setChangeArtifactReady(true)}
                      onFail={() => setChangeArtifactReady(false)}
                    />
                  )}
                  <div className="absolute top-2.5 left-2.5 bg-neutral-950/90 px-2 py-1 rounded text-[11px] font-mono text-neutral-200 border border-neutral-800 z-20 shadow-md">
                    <span className="font-semibold">Current + detected changes</span>
                  </div>
                  {renderChangeFallback()}
                  {renderOverlays('remote-change')}
                </div>
              </div>
            ) : effectiveViewMode === 'side-by-side' && images.length >= 2 ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-full max-h-full">
                {/* Image 1 Panel */}
                <div
                  onMouseMove={(e) => handleImagePanelMouseMove(e, images[0])}
                  className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] max-w-[46vw] max-h-[72vh] aspect-square border border-neutral-800 shadow-xl overflow-hidden bg-neutral-950 flex items-center justify-center"
                >
                  {renderImage(images[0])}
                  <div className="absolute top-2.5 left-2.5 bg-neutral-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10 flex items-center gap-1.5 shadow-md">
                    <span className="font-semibold text-neutral-100">{images[0].slot_label || 'Image 1'}</span>
                    <span className="text-neutral-500">·</span>
                    <span>{images[0].modality}</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400">{images[0].width}×{images[0].height}</span>
                  </div>
                  {renderOverlays('sbs-img1')}
                </div>

                {/* Image 2 Panel */}
                <div
                  onMouseMove={(e) => handleImagePanelMouseMove(e, images[1])}
                  className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px] max-w-[46vw] max-h-[72vh] aspect-square border border-neutral-800 shadow-xl overflow-hidden bg-neutral-950 flex items-center justify-center"
                >
                  {renderImage(images[1], 'w-full h-full object-contain')}
                  {resolvedChangeArtifact && changeArtifactReady && (
                    <img
                      src={resolvedChangeArtifact}
                      alt="Current satellite image with AI-detected changes"
                      className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                      loading="eager"
                    />
                  )}
                  {resolvedChangeArtifact && !changeArtifactReady && (
                    <img
                      src={resolvedChangeArtifact}
                      alt=""
                      aria-hidden="true"
                      className="hidden"
                      loading="eager"
                      onLoad={() => setChangeArtifactReady(true)}
                      onError={() => {
                        console.warn('SatQuery AI - change artifact unavailable:', resolvedChangeArtifact);
                        setChangeArtifactReady(false);
                      }}
                    />
                  )}
                  <div className="absolute top-2.5 left-2.5 bg-neutral-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10 flex items-center gap-1.5 shadow-md">
                    <span className="font-semibold text-neutral-100">{images[1].slot_label || 'Image 2'}</span>
                    <span className="text-neutral-500">·</span>
                    <span>{images[1].modality}</span>
                    <span className="text-neutral-500">·</span>
                    <span className="text-neutral-400">{images[1].width}×{images[1].height}</span>
                  </div>
                  {renderChangeFallback()}
                  {renderOverlays('sbs-img2')}
                </div>
              </div>
            ) : effectiveViewMode === 'swipe' && images.length >= 2 ? (
              /* 2. SWIPE COMPARISON (Split-screen interactive slider) */
              <div
                onMouseMove={(e) => handleImagePanelMouseMove(e, currentImage)}
                className="relative w-[520px] h-[520px] max-w-full max-h-full aspect-square border border-neutral-800 shadow-xl overflow-hidden bg-neutral-950"
              >
                {/* Image 2 (Underneath) */}
                <div className="absolute inset-0">
                  {renderImage(images[1], 'w-full h-full object-contain')}
                </div>
                <div className="absolute top-3 right-3 bg-neutral-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10">
                  {images[1].slot_label || 'Image 2'} ({images[1].modality})
                </div>

                {/* Image 1 (Clipped on top) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${swipePosition}%` }}
                >
                  <div className="w-[520px] h-[520px] max-w-none">
                    {renderImage(images[0], 'w-[520px] h-[520px] object-contain')}
                  </div>
                  <div className="absolute top-3 left-3 bg-neutral-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10">
                    {images[0].slot_label || 'Image 1'} ({images[0].modality})
                  </div>
                </div>

                {/* Vertical Swipe Divider */}
                <div
                  ref={swipeBarRef}
                  className="swipe-handle absolute top-0 bottom-0 w-0.5 bg-neutral-200 cursor-ew-resize z-25 flex items-center justify-center"
                  style={{ left: `${swipePosition}%` }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const onMove = (moveEvent: MouseEvent) => {
                      if (!containerRef.current) return;
                      const rect = containerRef.current.getBoundingClientRect();
                      const pct = Math.max(0, Math.min(100, ((moveEvent.clientX - rect.left) / rect.width) * 100));
                      setSwipePosition(pct);
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                >
                  <div className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center text-[10px] font-bold shadow-md">
                    ⇄
                  </div>
                </div>

                {renderChangeFallback()}
                {renderOverlays('swipe')}
              </div>
            ) : (
              /* 3. SINGLE IMAGE VIEW */
              <div
                onMouseMove={(e) => handleImagePanelMouseMove(e, currentImage)}
                className="relative w-[520px] h-[520px] max-w-full max-h-full aspect-square border border-neutral-800 shadow-xl overflow-hidden bg-neutral-950 flex items-center justify-center"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {renderImage(currentImage, 'w-full h-full object-contain')}
                </div>
                {resolvedChangeArtifact && changeArtifactReady && (
                  <RemoteArtifactImage
                    value={remoteChangeArtifact}
                    alt="AI detected change overlay"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10"
                    onReady={() => setChangeArtifactReady(true)}
                    onFail={() => setChangeArtifactReady(false)}
                  />
                )}
                <div className="absolute top-2.5 left-2.5 bg-neutral-950/85 backdrop-blur-xs px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10 flex items-center gap-1.5 shadow-md">
                  <span className="font-semibold text-neutral-100">{currentImage.slot_label || 'Image'}</span>
                  <span className="text-neutral-500">·</span>
                  <span>{currentImage.modality}</span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-neutral-400">{currentImage.width}×{currentImage.height}</span>
                </div>

                {renderChangeFallback()}
                {renderOverlays('single')}
              </div>
            )}
          </div>
        )}

        {/* Bottom coordinate readout */}
        {images.length > 0 && mouseCoords && (
          <div className="absolute bottom-3 left-4 bg-neutral-900/90 border border-neutral-800 rounded px-2.5 py-1 text-[11px] font-mono text-neutral-400 flex items-center gap-2 pointer-events-none z-20 backdrop-blur-xs">
            {mouseCoords.slot && (
              <>
                <span className="text-neutral-200 font-medium">{mouseCoords.slot}</span>
                <span className="text-neutral-600">·</span>
              </>
            )}
            {mouseCoords.lat !== undefined && mouseCoords.lon !== undefined ? (
              <span>{mouseCoords.lat}°N, {mouseCoords.lon}°E</span>
            ) : null}
            <span className="text-neutral-600">·</span>
            <span>Pixel [{mouseCoords.x}, {mouseCoords.y}]</span>
          </div>
        )}
      </div>
    </div>
  );
};
