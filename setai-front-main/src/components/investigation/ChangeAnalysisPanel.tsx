import React from 'react';
import type { ChangeAnalysisData } from '../../types/investigation';

interface ChangeAnalysisPanelProps {
  data?: ChangeAnalysisData | null;
}


function findArtifact(value: unknown, keys: string[]): string | undefined {
  const seen = new Set<object>();
  const queue: unknown[] = [value];

  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== 'object') continue;
    if (seen.has(current as object)) continue;
    seen.add(current as object);

    if (Array.isArray(current)) {
      queue.push(...current);
      continue;
    }

    const record = current as Record<string, unknown>;
    for (const key of keys) {
      const candidate = record[key];
      if (typeof candidate === 'string' && candidate.trim()) {
        const value = candidate.trim();
        if (value.startsWith('data:image/')) return value;
        if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
        // Some providers return raw base64 without the data URI prefix.
        if (/^[A-Za-z0-9+/=\\s]+$/.test(value) && value.length > 200) {
          return `data:image/png;base64,${value.replace(/\\s/g, '')}`;
        }
      }
    }

    queue.push(...Object.values(record));
  }

  return undefined;
}

function formatNumber(value?: number, digits = 2): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';
}

export const ChangeAnalysisPanel: React.FC<ChangeAnalysisPanelProps> = ({ data }) => {
  if (!data) return null;

  const regionCount = Array.isArray(data.regions) ? data.regions.length : data.regions;
  const modelArtifact =
    data.change_visualization_url ||
    data.change_mask_url ||
    data.sar_mask_url ||
    findArtifact(data.model_output, [
      'change_visualization_url',
      'change_visualization',
      'annotated_image',
      'annotated_image_url',
      'overlay_image',
      'overlay_image_url',
      'current_with_changes',
      'visualization_url',
      'visualization',
      'image_url',
      'artifact_url',
      'change_mask_url',
      'change_mask',
      'change_map',
      'mask_url',
      'image_base64',
      'visualization_base64',
      'overlay_base64',
      'annotated_image_base64',
      'change_visualization_base64',
      'change_mask_base64'
    ]);

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 sm:p-5 space-y-4">
      <div className="pb-3 border-b border-neutral-800 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">Satellite Change Investigation</h2>
          <span className="text-xs text-neutral-500">
            Actual specialist-model change analysis surfaced through SatQuery AI
          </span>
        </div>
        {typeof data.signal === 'number' && Number.isFinite(data.signal) && (
          <div className="text-right shrink-0">
            <div className="text-[10px] uppercase tracking-wide text-neutral-500">Detection signal</div>
            <div className="text-lg font-semibold font-mono text-neutral-100">
              {formatNumber(data.signal <= 1 ? data.signal * 100 : data.signal, 2)}%
            </div>
            <div className="text-[10px] text-neutral-500">model-derived · uncalibrated</div>
          </div>
        )}
      </div>

      {(modelArtifact) && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,0.7fr)] gap-4">
          <div className="rounded border border-neutral-800 bg-neutral-950 overflow-hidden">
            <div className="px-3 py-2 flex items-center justify-between border-b border-neutral-800">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-neutral-400">Current + detected changes</div>
                <div className="text-[10px] text-neutral-600 mt-0.5">Remote specialist visualization</div>
              </div>
              <span className="text-[10px] text-status-success font-medium">MODEL OUTPUT</span>
            </div>
            {modelArtifact ? (
              <img src={modelArtifact} alt="Current satellite image with detected change regions" className="w-full max-h-[560px] object-contain bg-black" loading="eager" />
            ) : data.change_mask_url ? (
              <img src={modelArtifact} alt="Optical satellite change mask" className="w-full max-h-[560px] object-contain bg-black" loading="eager" />
            ) : (
              <img src={modelArtifact} alt="SAR change mask" className="w-full max-h-[560px] object-contain bg-black" loading="eager" />
            )}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 content-start">
            <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[11px] text-neutral-500">Comparison</div>
              <div className="mt-1 text-base font-semibold text-neutral-100">{data.comparison || '—'}</div>
            </div>
            <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[11px] text-neutral-500">Changed area</div>
              <div className="mt-1 text-base font-semibold text-neutral-100">{typeof data.changed_area === 'number' ? `${formatNumber(data.changed_area)}%` : '—'}</div>
            </div>
            <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[11px] text-neutral-500">Detected regions</div>
              <div className="mt-1 text-base font-semibold text-neutral-100">{regionCount ?? '—'}</div>
            </div>
            <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-[11px] text-neutral-500">Detection signal</div>
              <div className="mt-1 text-base font-semibold font-mono text-neutral-100">
                {typeof data.signal === 'number' ? `${formatNumber(data.signal <= 1 ? data.signal * 100 : data.signal, 2)}%` : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {(data.what_changed || data.change_type || data.change_detected !== undefined) && (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-4 space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">What changed</div>
          <div className="text-sm font-medium text-neutral-100">
            {data.what_changed || data.change_type || 'Change detected in the analyzed scene.'}
          </div>
          {data.change_type && data.what_changed && data.change_type !== data.what_changed && (
            <div className="text-xs text-neutral-400">
              Classification: <span className="text-neutral-200">{data.change_type}</span>
            </div>
          )}
          <div className="text-xs text-neutral-400">
            {data.change_detected === undefined
              ? ''
              : data.change_detected
                ? 'The change-analysis model detected a change signal.'
                : 'The change-analysis model did not detect a change signal.'}
          </div>
        </div>
      )}

      {data.region_findings && data.region_findings.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Region-wise semantic analysis</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Descriptions returned by the change-analysis / semantic model.
            </p>
          </div>

          {data.region_findings.map((item, index) => (
            <div
              key={item.id || `change-region-${index}`}
              className="rounded border border-neutral-800 bg-neutral-950 p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-neutral-100">
                  {item.title || item.region || `Region ${index + 1}`}
                </div>
                {item.confidence !== undefined && (
                  <span className="text-xs font-mono text-neutral-400">
                    {formatNumber(item.confidence <= 1 ? item.confidence * 100 : item.confidence, 1)}%
                  </span>
                )}
              </div>
              {item.region && item.title !== item.region && (
                <div className="text-xs text-neutral-500">{item.region}</div>
              )}
              {item.change && (
                <div className="text-sm text-neutral-200">
                  <span className="text-neutral-500">Change: </span>{item.change}
                </div>
              )}
              {item.type && (
                <div className="text-xs text-neutral-400">
                  <span className="text-neutral-500">Type: </span>{item.type}
                </div>
              )}
              {item.evidence && (
                <div className="text-xs text-neutral-400 leading-relaxed">
                  <span className="text-neutral-500">Evidence: </span>{item.evidence}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.why && (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Why?</div>
          <p className="text-sm text-neutral-300 leading-relaxed">{data.why}</p>
        </div>
      )}

      {!data.why && (data.changed_area !== undefined || regionCount !== undefined || data.signal !== undefined) && (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-4">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">Why?</div>
          <p className="text-sm text-neutral-300 leading-relaxed">
            The change specialist detected {regionCount ?? 0} region{regionCount === 1 ? '' : 's'} covering
            {' '}{typeof data.changed_area === 'number' ? `${formatNumber(data.changed_area)}%` : 'an unreported'} of the scene.
            {typeof data.signal === 'number' ? ` Its model-derived detection signal is ${formatNumber(data.signal <= 1 ? data.signal * 100 : data.signal, 2)}%.` : ''}
            {' '}This signal is not a calibrated probability; semantic region descriptions are model observations and should not be treated as ground-truth confirmation.
          </p>
        </div>
      )}

      {data.reproduction_id && (
        <div className="pt-2 border-t border-neutral-800 text-xs">
          <span className="text-neutral-500">Reproduction ID: </span>
          <span className="text-neutral-200 font-mono">{data.reproduction_id}</span>
        </div>
      )}
    </div>
  );
};
