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

  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5 space-y-4">
      <div className="pb-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-100">Satellite Change Investigation</h2>
        <span className="text-xs text-neutral-500">
          Remote change-analysis output surfaced through SatQuery AI
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[11px] text-neutral-500">Comparison</div>
          <div className="mt-1 text-sm font-semibold text-neutral-100">{data.comparison || '—'}</div>
        </div>
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3">
          <div className="text-[11px] text-neutral-500">Regions</div>
          <div className="mt-1 text-sm font-semibold text-neutral-100">{data.regions ?? '—'}</div>
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

      {data.reproduction_id && (
        <div className="pt-2 border-t border-neutral-800 text-xs">
          <span className="text-neutral-500">Reproduction ID: </span>
          <span className="text-neutral-200 font-mono">{data.reproduction_id}</span>
        </div>
      )}
    </div>
  );
};
