import React from 'react';
import type { InvestigationTask } from '../../types/investigation';

interface InvestigationPlanProps {
  tasks: InvestigationTask[];
  isLoading?: boolean;
  executionComplete?: boolean;
}

export const InvestigationPlan: React.FC<InvestigationPlanProps> = ({
  tasks,
  isLoading = false,
  executionComplete = false
}) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  const formatTaskType = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vqa':
        return 'Visual question answering';
      case 'grounding':
        return 'Spatial grounding';
      case 'change_detection':
        return 'Change analysis';
      case 'optical_sar':
        return 'Cross-modal fusion';
      case 'raster_compatibility':
        return 'Raster compatibility';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  const getStatusBadge = (status?: string) => {
    if (executionComplete && status !== 'failed') {
      return <span className="text-[11px] text-status-success font-medium">Completed</span>;
    }
    if (isLoading && status !== 'completed') {
      return <span className="text-[11px] text-neutral-400">Running...</span>;
    }
    switch (status) {
      case 'completed':
        return <span className="text-[11px] text-status-success font-medium">Completed</span>;
      case 'failed':
        return <span className="text-[11px] text-status-error font-medium">Failed</span>;
      case 'running':
        return <span className="text-[11px] text-neutral-300">Running</span>;
      default:
        return <span className="text-[11px] text-neutral-500">Pending</span>;
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-neutral-300">
          Investigation plan
        </h3>
        <span className="text-xs text-neutral-500">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks chained'}
        </span>
      </div>

      {/* Task Flow */}
      <div className="space-y-3 relative">
        {tasks.map((task, index) => {
          const hasDependency = task.depends_on && task.depends_on.length > 0;

          return (
            <div key={task.task_id || index} className="space-y-2">
              {/* Dependency indicator line */}
              {index > 0 && (
                <div className="pl-4 py-0.5">
                  <div className="w-px h-3 bg-neutral-800" />
                </div>
              )}

              {/* Task Item */}
              <div className="bg-neutral-950 border border-neutral-800 rounded p-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-neutral-200">
                      {formatTaskType(task.task_type)}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-500">
                      ({task.task_id})
                    </span>
                  </div>

                  {getStatusBadge(task.status)}
                </div>

                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  "{task.query}"
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-neutral-500 font-mono">
                  <div>
                    <span>Inputs: </span>
                    <span className="text-neutral-400">{task.image_ids.join(', ')}</span>
                  </div>

                  {hasDependency && (
                    <div>
                      <span>Requires: </span>
                      <span className="text-neutral-400">{task.depends_on?.join(', ')}</span>
                    </div>
                  )}

                  {task.parameters && Object.keys(task.parameters).length > 0 && (
                    <div className="truncate max-w-xs text-neutral-500">
                      Params: {JSON.stringify(task.parameters)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
