import React, { useState } from 'react';
import type { EvidenceItem, EvidenceType } from '../../types/investigation';

interface EvidencePanelProps {
  evidence: EvidenceItem[];
}

export const EvidencePanel: React.FC<EvidencePanelProps> = ({ evidence = [] }) => {
  const [selectedFilter, setSelectedFilter] = useState<EvidenceType | 'ALL'>('ALL');

  if (!evidence || evidence.length === 0) {
    return null;
  }

  const categories: (EvidenceType | 'ALL')[] = ['ALL', 'Visual', 'Scene', 'Spatial', 'Temporal', 'Cross-modal'];

  const filteredItems = selectedFilter === 'ALL'
    ? evidence
    : evidence.filter(item => item.type === selectedFilter);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h3 className="text-xs font-medium text-neutral-300">
            Grounded evidence
          </h3>
          <span className="text-xs text-neutral-500">
            {evidence.length} observations collected
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-xs">
          {categories.map((cat) => {
            const count = cat === 'ALL' ? evidence.length : evidence.filter(e => e.type === cat).length;
            if (cat !== 'ALL' && count === 0) return null;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFilter(cat)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  selectedFilter === cat
                    ? 'bg-neutral-800 text-neutral-100 font-medium'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {cat === 'ALL' ? 'All' : cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-neutral-950 border border-neutral-800 rounded space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-300 font-medium">
                {item.type} observation
              </span>
              <span className="text-neutral-500 font-mono text-[11px]">
                {item.source} · {item.model_version}
              </span>
            </div>

            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              {item.description}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-900 text-[11px] text-neutral-500 font-mono">
              <span>Task: {item.task}</span>
              {item.metrics && Object.keys(item.metrics).length > 0 && (
                <span>
                  Metrics: {JSON.stringify(item.metrics)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
