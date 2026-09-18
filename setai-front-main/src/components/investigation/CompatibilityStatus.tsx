import React from 'react';
import type { CompatibilityData } from '../../types/investigation';

interface CompatibilityStatusProps {
  compatibility?: CompatibilityData;
}

export const CompatibilityStatus: React.FC<CompatibilityStatusProps> = ({
  compatibility
}) => {
  if (!compatibility) return null;

  const isCompatible = compatibility.compatible;

  return (
    <div
      className={`rounded-lg border p-4 space-y-2 ${
        isCompatible
          ? 'bg-neutral-900 border-neutral-800'
          : 'bg-neutral-900 border-status-error/30'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <h4 className="font-medium text-neutral-300">
          Raster compatibility
        </h4>
        <span
          className={`font-medium ${
            isCompatible ? 'text-status-success' : 'text-status-error'
          }`}
        >
          {isCompatible ? 'Compatible' : 'Compatibility issue'}
        </span>
      </div>

      {!isCompatible && compatibility.reasons.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-neutral-400 block">
            Issues identified:
          </span>
          <ul className="space-y-1 bg-neutral-950 p-3 rounded border border-neutral-800">
            {compatibility.reasons.map((reason, idx) => (
              <li
                key={reason || `reason-${idx}`}
                className="text-xs text-neutral-300 font-sans flex items-start gap-2 leading-relaxed"
              >
                <span className="text-status-error">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          Input rasters verified for coordinate reference system, spatial overlap, and resolution alignment.
        </p>
      )}
    </div>
  );
};
