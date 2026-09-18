import * as GeoTIFF from 'geotiff';

export interface GeoTIFFRenderOptions {
  /** Selected band index for grayscale display (0-indexed). Defaults to 0 */
  grayBand?: number;
  /** Selected band indices for RGB display (0-indexed). Defaults to [0, 1, 2] */
  rgbBands?: [number, number, number];
  /** Lower percentile for contrast stretching (default 0.02 = 2%) */
  lowerPercentile?: number;
  /** Upper percentile for contrast stretching (default 0.98 = 98%) */
  upperPercentile?: number;
  /** Optional nodata value to exclude from stretch calculation */
  noDataValue?: number;
}

export interface GeoTIFFMetadata {
  width: number;
  height: number;
  bands: number;
  bitsPerSample: number | number[];
  sampleFormat?: number | number[];
  dtype: string;
}

export interface RenderedGeoTIFFResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  metadata: GeoTIFFMetadata;
}

// In-memory cache for rendered raster canvases to avoid repeated decodes
const renderCache = new Map<string, RenderedGeoTIFFResult>();

/**
 * Calculates robust percentile-based display range [pMin, pMax]
 * to make satellite uint16 / float scientific values visible.
 */
export function calculateDisplayRange(
  values: ArrayLike<number>,
  lowerPercent: number = 0.02,
  upperPercent: number = 0.98,
  noDataValue?: number
): { min: number; max: number } {
  const len = values.length;
  if (len === 0) return { min: 0, max: 255 };

  // Subsample up to 40,000 points evenly across the raster for instant calculation
  const maxSamples = 40000;
  const step = Math.max(1, Math.floor(len / maxSamples));
  const sample: number[] = [];

  for (let i = 0; i < len; i += step) {
    const val = values[i];
    if (
      Number.isFinite(val) &&
      (noDataValue === undefined || val !== noDataValue)
    ) {
      sample.push(val);
    }
  }

  if (sample.length === 0) {
    return { min: 0, max: 255 };
  }

  sample.sort((a, b) => a - b);

  const lowerIdx = Math.max(0, Math.min(sample.length - 1, Math.floor(sample.length * lowerPercent)));
  const upperIdx = Math.max(0, Math.min(sample.length - 1, Math.floor(sample.length * upperPercent)));

  let min = sample[lowerIdx];
  let max = sample[upperIdx];

  // If min and max coincide (e.g. flat surface or extreme clamp), expand to sample boundaries
  if (max <= min) {
    min = sample[0];
    max = sample[sample.length - 1];
  }

  if (max <= min) {
    max = min + 1;
  }

  return { min, max };
}

/**
 * Determines a human-readable dtype from bitsPerSample and sampleFormat
 */
function resolveDtype(bits: number | number[], sampleFormat?: number | number[]): string {
  const b = Array.isArray(bits) ? bits[0] : bits;
  const f = Array.isArray(sampleFormat) ? sampleFormat[0] : sampleFormat;

  if (f === 3) {
    return b === 64 ? 'float64' : 'float32';
  }
  if (f === 2) {
    return `int${b}`;
  }
  return `uint${b}`;
}

/**
 * Reads and renders a GeoTIFF from a File, Blob, ArrayBuffer, or URL into an offscreen HTMLCanvasElement
 */
export async function renderGeoTIFF(
  source: File | Blob | ArrayBuffer | string,
  cacheKey?: string,
  options: GeoTIFFRenderOptions = {}
): Promise<RenderedGeoTIFFResult> {
  if (cacheKey && renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey)!;
  }

  let tiff: GeoTIFF.GeoTIFF;

  try {
    if (typeof source === 'string') {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch file (${response.status}: ${response.statusText})`);
      }
      const buffer = await response.arrayBuffer();
      tiff = await GeoTIFF.fromArrayBuffer(buffer);
    } else if (source instanceof ArrayBuffer) {
      tiff = await GeoTIFF.fromArrayBuffer(source);
    } else {
      // File or Blob
      tiff = await GeoTIFF.fromBlob(source);
    }
  } catch (err: any) {
    throw new Error(`Unable to read GeoTIFF structure: ${err?.message || 'Invalid TIFF file'}`);
  }

  let image: GeoTIFF.GeoTIFFImage;
  try {
    image = await tiff.getImage();
  } catch (err: any) {
    throw new Error(`Unable to parse GeoTIFF image header: ${err?.message || 'Unsupported format'}`);
  }

  const width = image.getWidth();
  const height = image.getHeight();
  const bands = image.getSamplesPerPixel();
  const bitsPerSample = image.getBitsPerSample();
  const sampleFormat = image.getSampleFormat();
  const dtype = resolveDtype(bitsPerSample, sampleFormat);

  if (!width || !height || width <= 0 || height <= 0) {
    throw new Error(`Invalid raster dimensions: ${width}x${height}`);
  }

  let rasters: GeoTIFF.ReadRasterResult;
  try {
    rasters = await image.readRasters({ interleave: false });
  } catch (err: any) {
    throw new Error(`Failed to decode raster pixels: ${err?.message || 'Unknown decode error'}`);
  }

  // Create an offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D rendering context is not supported by this browser.');
  }

  const imageData = ctx.createImageData(width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  const lowerPct = options.lowerPercentile ?? 0.02;
  const upperPct = options.upperPercentile ?? 0.98;

  // Decide visualization mode:
  // - Multiband RGB if at least 3 bands exist
  // - Single-band grayscale otherwise
  const isRGB = bands >= 3 && !options.grayBand;

  if (isRGB) {
    const rIdx = options.rgbBands?.[0] ?? 0;
    const gIdx = options.rgbBands?.[1] ?? 1;
    const bIdx = options.rgbBands?.[2] ?? 2;

    const rBand = (rasters[rIdx] || rasters[0]) as ArrayLike<number>;
    const gBand = (rasters[gIdx] || rasters[Math.min(1, bands - 1)]) as ArrayLike<number>;
    const bBand = (rasters[bIdx] || rasters[Math.min(2, bands - 1)]) as ArrayLike<number>;

    const rRange = calculateDisplayRange(rBand, lowerPct, upperPct, options.noDataValue);
    const gRange = calculateDisplayRange(gBand, lowerPct, upperPct, options.noDataValue);
    const bRange = calculateDisplayRange(bBand, lowerPct, upperPct, options.noDataValue);

    const rScale = rRange.max > rRange.min ? 255 / (rRange.max - rRange.min) : 0;
    const gScale = gRange.max > gRange.min ? 255 / (gRange.max - gRange.min) : 0;
    const bScale = bRange.max > bRange.min ? 255 / (bRange.max - bRange.min) : 0;

    for (let i = 0; i < totalPixels; i++) {
      const rv = rBand[i];
      const gv = gBand[i];
      const bv = bBand[i];

      const rClamped = rv < rRange.min ? rRange.min : rv > rRange.max ? rRange.max : rv;
      const gClamped = gv < gRange.min ? gRange.min : gv > gRange.max ? gRange.max : gv;
      const bClamped = bv < bRange.min ? bRange.min : bv > bRange.max ? bRange.max : bv;

      const px = i * 4;
      data[px] = Math.round((rClamped - rRange.min) * rScale);
      data[px + 1] = Math.round((gClamped - gRange.min) * gScale);
      data[px + 2] = Math.round((bClamped - bRange.min) * bScale);
      data[px + 3] = 255;
    }
  } else {
    // Single band (1-band uint16 or chosen grayscale band)
    const bandIdx = options.grayBand ?? 0;
    const grayBand = (rasters[bandIdx] || rasters[0]) as ArrayLike<number>;
    const range = calculateDisplayRange(grayBand, lowerPct, upperPct, options.noDataValue);
    const scale = range.max > range.min ? 255 / (range.max - range.min) : 0;

    for (let i = 0; i < totalPixels; i++) {
      const v = grayBand[i];
      const clamped = v < range.min ? range.min : v > range.max ? range.max : v;
      const norm = Math.round((clamped - range.min) * scale);

      const px = i * 4;
      data[px] = norm;
      data[px + 1] = norm;
      data[px + 2] = norm;
      data[px + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const result: RenderedGeoTIFFResult = {
    canvas,
    width,
    height,
    metadata: {
      width,
      height,
      bands,
      bitsPerSample,
      sampleFormat,
      dtype
    }
  };

  if (cacheKey) {
    renderCache.set(cacheKey, result);
  }

  return result;
}

/**
 * Clears cached rendered canvases
 */
export function clearGeoTIFFCache(key?: string): void {
  if (key) {
    renderCache.delete(key);
  } else {
    renderCache.clear();
  }
}
