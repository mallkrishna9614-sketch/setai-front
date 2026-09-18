import React from 'react';
import type { ModelResult } from '../../types/investigation';

interface ModelResultsListProps {
  models: ModelResult[];
}

export const ModelResultsList: React.FC<ModelResultsListProps> = ({ models = [] }) => {
  if (!models || models.length === 0) {
    return null;
  }

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">
          Specialist models executed
        </h3>
        <span className="text-xs text-neutral-500">
          {models.length} {models.length === 1 ? 'model' : 'models'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {models.map((m, idx) => {
          const isSuccess = m.status === 'success' || (m as any).success === true;
          const version = m.version || (m as any).model_version || '';
          const task = m.task || (m as any).task_type || '';
          const description = m.description || (m as any).error || '';
          const outputData = m.output ?? (m as any).result ?? ((m as any).error ? { error: (m as any).error } : null);

          return (
            <div
              key={m.model_name ? `${m.model_name}-${m.task || idx}` : `model-res-${idx}`}
              className="p-3.5 bg-neutral-950 border border-neutral-800 rounded space-y-2"
            >
              <div className="flex items-start justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-neutral-200">
                      {m.model_name}
                    </span>
                    {version && (
                      <span className="text-[11px] font-mono text-neutral-500">
                        {version}
                      </span>
                    )}
                  </div>
                  {task && (
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">
                      {task}
                    </span>
                  )}
                </div>

                <span
                  className={`text-[11px] font-medium ${
                    isSuccess ? 'text-status-success' : 'text-status-error'
                  }`}
                >
                  {isSuccess ? 'Success' : 'Error'}
                </span>
              </div>

              {description && (
                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  {description}
                </p>
              )}

              {outputData && (
                <div className="text-[11px] font-mono text-neutral-400 bg-neutral-900 p-2 rounded border border-neutral-800 overflow-x-auto">
                  <pre className="text-neutral-300 font-mono whitespace-pre-wrap break-all">
                    {typeof outputData === 'string'
                      ? outputData
                      : JSON.stringify(outputData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
