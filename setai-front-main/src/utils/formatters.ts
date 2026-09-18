import type { ConfidenceData } from '../types/investigation';

/**
 * Safely normalize confidence from single object or array of confidence results
 */
export function normalizeConfidence(
  confidence: ConfidenceData | ConfidenceData[] | null | undefined
): ConfidenceData | null {
  if (!confidence) {
    return null;
  }

  if (Array.isArray(confidence)) {
    if (confidence.length === 0) {
      return null;
    }

    // The backend may return confidence for multiple tasks.
    // For the main dashboard, select the first valid confidence
    // object rather than treating the array itself as a confidence object.
    const valid = confidence.find(
      item => {
        if (!item) return false;
        const s = item.score !== undefined ? item.score : item.confidence;
        return typeof s === 'number' && Number.isFinite(s);
      }
    );

    const selected = valid || confidence[0] || null;
    if (selected && selected.score === undefined && selected.confidence !== undefined) {
      return {
        ...selected,
        score: selected.confidence
      };
    }
    return selected;
  }

  if (confidence && confidence.score === undefined && confidence.confidence !== undefined) {
    return {
      ...confidence,
      score: confidence.confidence
    };
  }

  return confidence;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatResolution(resX: number | null, resY: number | null): string {
  if (resX === null || resY === null || !Number.isFinite(resX) || !Number.isFinite(resY)) {
    return 'GSD N/A';
  }
  if (Math.abs(resX - resY) < 0.0001) {
    return `${resX}m GSD`;
  }
  return `${resX}m × ${resY}m GSD`;
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch {
    return isoString;
  }
}

export function formatConfidencePercent(
  score?: number | null
): string {
  if (
    score === undefined ||
    score === null ||
    !Number.isFinite(Number(score))
  ) {
    return 'N/A';
  }

  const numericScore = Number(score);

  const pct =
    numericScore <= 1
      ? numericScore * 100
      : numericScore;

  return `${pct.toFixed(1)}%`;
}
