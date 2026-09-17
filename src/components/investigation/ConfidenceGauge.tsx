import React from 'react';
import type { ConfidenceData } from '../../types/investigation';
import { formatConfidencePercent } from '../../utils/formatters';

interface ConfidenceGaugeProps {
  confidence?: ConfidenceData;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence }) => {
  if (!confidence) return null;

  const pct = confidence.score <= 1.0 ? confidence.score * 100 : confidence.score;
  const isHigh = confidence.label === 'HIGH';
  const isMed = confidence.label === 'MEDIUM';

  const barColor = isHigh
    ? 'bg-status-success'
    : isMed
    ? 'bg-status-warning'
    : 'bg-status-error';

  const labelText = isHigh
    ? 'High confidence'
    : isMed
    ? 'Medium confidence'
    : 'Low confidence';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">
          Confidence assessment
        </h3>
        <span
          className={`text-xs font-medium ${
            isHigh
              ? 'text-status-success'
              : isMed
              ? 'text-status-warning'
              : 'text-status-error'
          }`}
        >
          {labelText}
        </span>
      </div>

      {/* Numerical Metric & Precision Bar */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-semibold font-mono text-neutral-100">
            {formatConfidencePercent(confidence.score)}
          </span>
          <span className="text-xs text-neutral-400">
            Computed by {confidence.associated_model || 'Consensus engine'}
          </span>
        </div>

        {/* Minimal horizontal gauge track */}
        <div className="w-full h-1.5 bg-neutral-950 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      </div>

      {/* Validation Context */}
      <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
        <div className="flex items-center justify-between text-neutral-400">
          <span>Task domain:</span>
          <span className="text-neutral-200 font-medium">{confidence.task_type}</span>
        </div>

        {confidence.factors && confidence.factors.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-neutral-400 block">
              Contributing factors:
            </span>
            <ul className="space-y-1">
              {confidence.factors.map((factor, idx) => (
                <li
                  key={idx}
                  className="text-neutral-300 font-sans flex items-start gap-1.5 leading-relaxed"
                >
                  <span className="text-neutral-500">•</span>
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
