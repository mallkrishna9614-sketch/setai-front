import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { ImageMetadata } from '../../types/image';
import { renderGeoTIFF } from '../../utils/geotiffRenderer';

interface GeoTIFFCanvasProps {
  image: ImageMetadata;
  className?: string;
  style?: React.CSSProperties;
  onRenderSuccess?: (width: number, height: number) => void;
}

function isDataUriOrSvg(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('data:image/svg') || url.startsWith('data:image/png') || url.startsWith('data:image/jpeg');
}

function isTiffSource(img: ImageMetadata): boolean {
  if (img.file) return true;
  const fname = (img.filename || '').toLowerCase();
  const isTiffName = fname.endsWith('.tif') || fname.endsWith('.tiff');
  const url = img.preview_url || '';
  return isTiffName || url.startsWith('blob:') || url.endsWith('.tif') || url.endsWith('.tiff');
}

export const GeoTIFFCanvas: React.FC<GeoTIFFCanvasProps> = ({
  image,
  className = '',
  style,
  onRenderSuccess
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onRenderSuccessRef = useRef(onRenderSuccess);

  useEffect(() => {
    onRenderSuccessRef.current = onRenderSuccess;
  }, [onRenderSuccess]);

  const isTiff = isTiffSource(image);
  const isDataUri = isDataUriOrSvg(image.preview_url);
  const source = image.file || image.preview_url;
  const cacheKey = `${image.image_id}_${image.filename}_${image.file_size_bytes}`;

  const [renderedKey, setRenderedKey] = useState<string | null>(null);
  const [asyncError, setAsyncError] = useState<string | null>(null);

  const derivedError = !source ? 'Unable to render GeoTIFF preview: No file source or preview URL provided.' : null;
  const effectiveError = derivedError || asyncError;
  const isDecoding = Boolean(source && (isTiff || !isDataUri) && renderedKey !== cacheKey && !effectiveError);

  useEffect(() => {
    // If it's a data URI (e.g. demo mock SVGs), skip GeoTIFF decoding
    if (!isTiff && isDataUri) {
      return;
    }

    if (!source) {
      return;
    }

    let isCancelled = false;

    renderGeoTIFF(source, cacheKey)
      .then((result) => {
        if (isCancelled) return;

        const targetCanvas = canvasRef.current;
        if (!targetCanvas) return;

        targetCanvas.width = result.width;
        targetCanvas.height = result.height;
        const ctx = targetCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, result.width, result.height);
          ctx.drawImage(result.canvas, 0, 0);
        }

        setRenderedKey(cacheKey);
        setAsyncError(null);

        if (onRenderSuccessRef.current) {
          onRenderSuccessRef.current(result.width, result.height);
        }
      })
      .catch((err: any) => {
        if (isCancelled) return;
        setAsyncError(`Unable to render GeoTIFF preview: ${err.message || 'Decoding failed'}`);
      });

    return () => {
      isCancelled = true;
    };
  }, [image.image_id, image.file, image.preview_url, image.filename, image.file_size_bytes, isTiff, isDataUri, source, cacheKey]);

  // Fallback for mock demo SVG data URIs
  if (!isTiff && isDataUri) {
    return (
      <img
        src={image.preview_url}
        alt={image.filename}
        className={`${className} object-contain pointer-events-none`}
        style={style}
      />
    );
  }

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`} style={style}>
      {/* Target Canvas for actual decoded raster pixels */}
      <canvas
        ref={canvasRef}
        className={`max-w-full max-h-full object-contain pointer-events-none transition-opacity duration-200 ${
          isDecoding || effectiveError ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          imageRendering: 'auto'
        }}
      />

      {/* Loading state */}
      {isDecoding && !effectiveError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-neutral-950/80 backdrop-blur-xs p-4 text-center">
          <Loader2 className="w-6 h-6 text-neutral-300 animate-spin" />
          <span className="text-xs text-neutral-300 font-medium">
            Rendering GeoTIFF...
          </span>
          <span className="text-[10px] text-neutral-500 font-mono">
            Decoding scientific raster & calculating contrast stretch
          </span>
        </div>
      )}

      {/* Error state */}
      {effectiveError && !isDecoding && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-neutral-950/90 border border-status-error/30">
          <div className="w-10 h-10 rounded-full bg-status-errorMuted border border-status-error/40 flex items-center justify-center mb-3">
            <AlertCircle className="w-5 h-5 text-status-error" />
          </div>
          <p className="text-xs text-status-error font-medium max-w-sm mb-1">
            {effectiveError}
          </p>
          <div className="text-[10px] font-mono text-neutral-400 mt-2">
            {image.filename} ({image.width}×{image.height} · {image.dtype})
          </div>
        </div>
      )}
    </div>
  );
};
