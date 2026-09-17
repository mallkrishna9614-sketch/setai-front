import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Eye
} from 'lucide-react';
import type { ImageMetadata } from '../../types/image';
import type { FindingRegion } from '../../types/investigation';

interface ImageViewerProps {
  images: ImageMetadata[];
  regions?: FindingRegion[];
  isLoading?: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  regions = [],
  isLoading = false
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSwipeMode, setIsSwipeMode] = useState<boolean>(false);
  const [swipePosition, setSwipePosition] = useState<number>(50); // percentage
  const [mouseCoords, setMouseCoords] = useState<{ x: number; y: number; lat?: number; lon?: number } | null>(null);
  const [showOverlays, setShowOverlays] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const swipeBarRef = useRef<HTMLDivElement>(null);

  const hasMultipleImages = images.length > 1;
  const currentImage = images[activeImageIndex] || images[0];

  useEffect(() => {
    if (images.length === 2 && !isSwipeMode) {
      setIsSwipeMode(true);
    } else if (images.length < 2) {
      setIsSwipeMode(false);
    }
  }, [images.length]);

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

    if (containerRef.current && currentImage) {
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;

      const px = Math.round(relX * currentImage.width);
      const py = Math.round(relY * currentImage.height);

      let lat: number | undefined;
      let lon: number | undefined;

      if (currentImage.bounds && currentImage.bounds.length === 4) {
        const [minX, minY, maxX, maxY] = currentImage.bounds;
        lon = Number((minX + relX * (maxX - minX)).toFixed(5));
        lat = Number((maxY - relY * (maxY - minY)).toFixed(5));
      }

      setMouseCoords({ x: px, y: py, lat, lon });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
              {currentImage.width}×{currentImage.height} · {currentImage.crs}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Multi-image switchers */}
          {hasMultipleImages && !isSwipeMode && (
            <div className="flex items-center bg-neutral-900 rounded border border-neutral-800 p-0.5 text-xs">
              {images.map((img, idx) => (
                <button
                  key={img.image_id}
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

          {/* Swipe comparison toggle */}
          {hasMultipleImages && (
            <button
              type="button"
              onClick={() => setIsSwipeMode(!isSwipeMode)}
              className={`px-2.5 py-1 rounded text-xs transition-colors border ${
                isSwipeMode
                  ? 'bg-neutral-800 text-neutral-100 border-neutral-700 font-medium'
                  : 'text-neutral-400 border-transparent hover:text-neutral-200'
              }`}
            >
              Swipe comparison
            </button>
          )}

          {/* Overlays toggle */}
          {regions.length > 0 && (
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
              <span>Overlays ({regions.length})</span>
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
        className="flex-1 relative bg-neutral-950 overflow-hidden select-none cursor-grab active:cursor-grabbing flex items-center justify-center bg-subtle-grid"
      >
        {/* Loading overlay */}
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
              Upload a satellite raster (.tif / GeoTIFF) or load a sample preset to display spatial data.
            </p>
          </div>
        ) : (
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.1s ease-out'
            }}
          >
            {isSwipeMode && images.length >= 2 ? (
              /* Split-screen swipe view */
              <div className="relative w-[600px] h-[600px] max-w-full max-h-full aspect-square border border-neutral-800 shadow-lg overflow-hidden">
                {/* Image 2 (Underneath) */}
                <img
                  src={images[1].preview_url}
                  alt={images[1].filename}
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                />
                <div className="absolute top-3 right-3 bg-neutral-950/80 px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10">
                  {images[1].slot_label || 'Image 2'} ({images[1].modality})
                </div>

                {/* Image 1 (Clipped) */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${swipePosition}%` }}
                >
                  <img
                    src={images[0].preview_url}
                    alt={images[0].filename}
                    className="absolute inset-0 w-[600px] h-[600px] max-w-none object-contain pointer-events-none"
                  />
                  <div className="absolute top-3 left-3 bg-neutral-950/80 px-2 py-0.5 rounded text-[11px] font-mono text-neutral-300 border border-neutral-800 z-10">
                    {images[0].slot_label || 'Image 1'} ({images[0].modality})
                  </div>
                </div>

                {/* Vertical Swipe Divider */}
                <div
                  ref={swipeBarRef}
                  className="swipe-handle absolute top-0 bottom-0 w-0.5 bg-neutral-200 cursor-ew-resize z-20 flex items-center justify-center"
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

                {/* Overlays */}
                {showOverlays &&
                  regions.map((reg) => {
                    const [ymin, xmin, ymax, xmax] = reg.bbox;
                    return (
                      <div
                        key={reg.id}
                        className="absolute border border-status-error bg-status-error/15 rounded z-25 pointer-events-none"
                        style={{
                          top: `${ymin * 100}%`,
                          left: `${xmin * 100}%`,
                          width: `${(xmax - xmin) * 100}%`,
                          height: `${(ymax - ymin) * 100}%`
                        }}
                      >
                        <div className="absolute -top-5 left-0 bg-neutral-900 border border-neutral-800 text-neutral-200 px-1.5 py-0.5 rounded text-[10px] font-sans">
                          {reg.label} {reg.confidence ? `· ${(reg.confidence * 100).toFixed(1)}%` : ''}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              /* Single image view */
              <div className="relative w-[600px] h-[600px] max-w-full max-h-full aspect-square border border-neutral-800 shadow-lg overflow-hidden bg-neutral-950">
                <img
                  src={currentImage?.preview_url}
                  alt={currentImage?.filename}
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Overlays */}
                {showOverlays &&
                  regions.map((reg) => {
                    const [ymin, xmin, ymax, xmax] = reg.bbox;
                    return (
                      <div
                        key={reg.id}
                        className="absolute border border-status-error bg-status-error/15 rounded z-20 pointer-events-none"
                        style={{
                          top: `${ymin * 100}%`,
                          left: `${xmin * 100}%`,
                          width: `${(xmax - xmin) * 100}%`,
                          height: `${(ymax - ymin) * 100}%`
                        }}
                      >
                        <div className="absolute -top-5 left-0 bg-neutral-900 border border-neutral-800 text-neutral-200 px-1.5 py-0.5 rounded text-[10px] font-sans whitespace-nowrap">
                          {reg.label} {reg.confidence ? `· ${(reg.confidence * 100).toFixed(1)}%` : ''}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* Bottom coordinate readout */}
        {images.length > 0 && mouseCoords && (
          <div className="absolute bottom-3 left-4 bg-neutral-900/90 border border-neutral-800 rounded px-2.5 py-1 text-[11px] font-mono text-neutral-400 flex items-center gap-2 pointer-events-none z-20">
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
