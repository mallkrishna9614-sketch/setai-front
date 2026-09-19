import React from 'react';
import type { ConfidenceData } from '../../types/investigation';
import { formatConfidencePercent, normalizeConfidence } from '../../utils/formatters';

interface ConfidenceGaugeProps {
  confidence?: ConfidenceData | ConfidenceData[];
  /** Optional task/model signal shown separately from the composite pipeline confidence. */
  modelSignal?: number;
  modelSignalLabel?: string;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({ confidence, modelSignal, modelSignalLabel = 'Model-derived detection signal' }) => {
  const normalizedConfidence = normalizeConfidence(confidence);

  if (!normalizedConfidence) {
    return null;
  }

  const rawScore = normalizedConfidence.score !== undefined
    ? normalizedConfidence.score
    : normalizedConfidence.confidence;

  const hasValidScore =
    typeof rawScore === 'number' &&
    Number.isFinite(rawScore);

  if (!hasValidScore) {
    console.warn(
      'SatQuery AI: confidence score missing from backend response',
      confidence
    );
  }

  const pct = hasValidScore
    ? rawScore <= 1
      ? rawScore * 100
      : rawScore
    : 0;

  const rawLabel = String(normalizedConfidence.label || '').toUpperCase();
  const isHigh = hasValidScore && rawLabel === 'HIGH';
  const isMed = hasValidScore && rawLabel === 'MEDIUM';

  const barColor = hasValidScore
    ? isHigh
      ? 'bg-status-success'
      : isMed
      ? 'bg-status-warning'
      : 'bg-status-error'
    : 'bg-neutral-700';

  const labelText = !hasValidScore
    ? 'Confidence unavailable'
    : isHigh
    ? 'High confidence'
    : isMed
    ? 'Medium confidence'
    : 'Low confidence';

  const modelName =
    typeof normalizedConfidence.associated_model === 'string'
      ? normalizedConfidence.associated_model
      : typeof normalizedConfidence.model?.name === 'string'
      ? normalizedConfidence.model.name
      : 'Consensus engine';

  const taskDomain = normalizedConfidence.task_type || 'General EO';
  const isChangeTask = taskDomain.toLowerCase().includes('change');

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">
          {isChangeTask ? 'Pipeline confidence' : 'Confidence assessment'}
        </h3>
        <span
          className={`text-xs font-medium ${
            !hasValidScore
              ? 'text-neutral-500'
              : isHigh
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
            {hasValidScore ? formatConfidencePercent(rawScore) : 'N/A'}
          </span>
          <span className="text-xs text-neutral-400 text-right">
            {isChangeTask ? 'Composite evidence score' : `Computed by ${modelName}`}
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

      {typeof modelSignal === 'number' && Number.isFinite(modelSignal) && (
        <div className="rounded border border-neutral-800 bg-neutral-950 p-3 space-y-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">{modelSignalLabel}</span>
            <span className="text-sm font-semibold font-mono text-neutral-100">
              {formatConfidencePercent(modelSignal)}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            This is the specialist model's detection signal. It is separate from the composite pipeline confidence and is not a calibrated probability.
          </p>
        </div>
      )}

      {/* Validation Context */}
      <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
        <div className="flex items-center justify-between text-neutral-400">
          <span>Task domain:</span>
          <span className="text-neutral-200 font-medium">{taskDomain}</span>
        </div>

        {normalizedConfidence.factors && normalizedConfidence.factors.length > 0 && (
          <div className="space-y-1 pt-1">
            <span className="text-neutral-400 block">
              Contributing factors:
            </span>
            <ul className="space-y-1">
              {normalizedConfidence.factors.map((factor, idx) => (
                <li
                  key={`factor-${idx}`}
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
