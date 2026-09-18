import React from 'react';
import type { ConflictItem } from '../../types/investigation';

interface ConflictWarningProps {
  conflicts: ConflictItem[];
}

export const ConflictWarning: React.FC<ConflictWarningProps> = ({ conflicts = [] }) => {
  if (!conflicts || conflicts.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-status-warning/40 bg-neutral-900 p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-status-warning/20">
        <div>
          <h3 className="text-xs font-semibold text-status-warning">
            Model conflict detected
          </h3>
          <span className="text-[11px] text-neutral-400">
            Sensory discrepancy between specialist models
          </span>
        </div>

        <span className="text-xs font-medium text-status-warning">
          {conflicts.length} {conflicts.length === 1 ? 'discrepancy' : 'discrepancies'}
        </span>
      </div>

      {/* Conflicts List */}
      <div className="space-y-3 pt-1">
        {conflicts.map((c) => (
          <div
            key={c.conflict_id}
            className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-medium text-neutral-200">
                {c.conflict_type}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  c.severity === 'HIGH' ? 'text-status-error' : 'text-status-warning'
                }`}
              >
                {c.severity === 'HIGH' ? 'High severity' : 'Medium severity'}
              </span>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              {c.description}
            </p>

            <div className="text-[11px] font-mono text-neutral-500 pt-1 border-t border-neutral-900">
              Affected tasks: <span className="text-neutral-300">{c.affected_tasks.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
