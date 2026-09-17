/**
 * Utility formatters for remote-sensing metadata and values
 */

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatResolution(resX: number, resY: number): string {
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

export function formatConfidencePercent(score: number): string {
  // If score is already 0..100 or 0..1
  const pct = score <= 1.0 ? score * 100 : score;
  return `${pct.toFixed(1)}%`;
}
