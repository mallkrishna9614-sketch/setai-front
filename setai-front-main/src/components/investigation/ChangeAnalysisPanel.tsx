import React from 'react';
import type { ChangeAnalysisData } from '../../types/investigation';

interface ChangeAnalysisPanelProps {
  data?: ChangeAnalysisData | null;
}

function formatNumber(value?: number, digits = 2): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '—';
}

export const ChangeAnalysisPanel: React.FC<ChangeAnalysisPanelProps> = ({ data }) => {
  if (!data) return null;

  const regionCount = Array.isArray(data.regions) ? data.regions.length : data.regions;

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 space-y-4">
      <div className="pb-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-100">Satellite Change Investigation</h2>
        <span className="text-xs text-neutral-500">
          Remote change-analysis output surfaced through SatQuery AI
        </span>
      </div>

      {(data.what_changed || data.change_type || data.change_detected !== undefined) && (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-4 space-y-2">
          <div className="text-[11px] uppercase tracking-wide text-neutral-500">What changed</div>
          <div className="text-sm font-medium text-neutral-100">
            {data.what_changed || data.change_type || 'Change detected in the analyzed scene.'}
          </div>
          <div className="text-xs text-neutral-400">
            {data.change_detected === undefined
              ? ''
              : data.change_detected
                ? 'The change-analysis model detected a change signal.'
                : 'The change-analysis model did not detect a change signal.'}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[11px] text-neutral-500">Comparison</div>
          <div className="mt-1 text-sm font-semibold text-neutral-100">{data.comparison || '—'}</div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[11px] text-neutral-500">Regions</div>
          <div className="mt-1 text-sm font-semibold text-neutral-100">{regionCount ?? '—'}</div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[11px] text-neutral-500">Changed area</div>
          <div className="mt-1 text-sm font-semibold text-neutral-100">
            {typeof data.changed_area === 'number' ? `${formatNumber(data.changed_area)}%` : '—'}
          </div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[11px] text-neutral-500">Match score</div>
          <div className="mt-1 text-sm font-semibold text-neutral-100">{formatNumber(data.match_score, 4)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <span className="text-neutral-500 block mb-1">Reference / before</span>
          <span className="text-neutral-200 font-mono">{data.reference_image || 'Remote reference'}</span>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <span className="text-neutral-500 block mb-1">Signal</span>
          <span className="text-neutral-200 font-mono">{formatNumber(data.signal, 2)}</span>
        </div>
      </div>

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

      {data.reproduction_id && (
        <div className="pt-2 border-t border-neutral-800 text-xs">
          <span className="text-neutral-500">Reproduction ID: </span>
          <span className="text-neutral-200 font-mono">{data.reproduction_id}</span>
        </div>
      )}
    </div>
  );
};
