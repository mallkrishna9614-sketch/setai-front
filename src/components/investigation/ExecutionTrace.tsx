import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { TraceStep } from '../../types/investigation';

interface ExecutionTraceProps {
  trace: TraceStep[];
  defaultExpanded?: boolean;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({
  trace = [],
  defaultExpanded = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  if (!trace || trace.length === 0) {
    return null;
  }

  const formatStepName = (step: string) => {
    return step
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
      {/* Header Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between bg-neutral-900 hover:bg-neutral-850 transition-colors text-left"
      >
        <div>
          <h3 className="text-xs font-medium text-neutral-200">
            Execution trace
          </h3>
          <span className="text-xs text-neutral-500">
            Observable pipeline milestones
          </span>
        </div>

        <div className="flex items-center gap-3 text-neutral-400">
          <span className="text-xs font-mono text-neutral-500">
            {trace.length} steps
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-5 pt-2 border-t border-neutral-800 bg-neutral-950/40 space-y-3">
          <div className="space-y-3 pl-2">
            {trace.map((step, idx) => (
              <div key={idx} className="space-y-0.5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-200">
                      {formatStepName(step.step)}
                    </span>
                    <span
                      className={`text-[11px] font-mono ${
                        step.status === 'completed'
                          ? 'text-status-success'
                          : step.status === 'failed'
                          ? 'text-status-error'
                          : 'text-neutral-400'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-neutral-500">
                    {step.timestamp}
                  </span>
                </div>

                <div className="text-neutral-400 font-sans leading-relaxed pl-0.5">
                  {typeof step.details === 'string'
                    ? step.details
                    : typeof step.details === 'object' && step.details !== null
                    ? JSON.stringify(step.details)
                    : String(step.details ?? '')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
