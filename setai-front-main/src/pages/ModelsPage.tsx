import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import type { ModelInfo } from '../types/model';
import { getModels } from '../api/models';

export const ModelsPage: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getModels();
      setModels(res.models || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models from registry');
    } finally {
      setLoading(false);
    }
  };

  const filteredModels = models.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.task_type.toLowerCase().includes(search.toLowerCase()) ||
      m.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-sm font-semibold text-neutral-100">
            Specialist model registry
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Remote-sensing vision-language backbones and feature networks
          </p>
        </div>

        <button
          onClick={fetchModels}
          disabled={loading}
          className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-850 text-xs text-neutral-300 border border-neutral-800 transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by name, task, or description..."
          className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-1.5 text-xs text-neutral-200 font-sans focus:outline-none focus:border-neutral-700"
        />
      </div>

      {error && (
        <div className="p-3 rounded bg-status-errorMuted border border-status-error/30 text-status-error text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center p-12 text-neutral-500 text-xs">
          Querying model catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModels.map((model, idx) => (
            <div
              key={idx}
              className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-100">
                      {model.name}
                    </h3>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      {model.task_type}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-500">
                    {model.version}
                  </span>
                </div>

                <p className="text-xs text-neutral-300 font-sans leading-relaxed">
                  {model.description}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="space-y-1.5 pt-3 border-t border-neutral-800 text-xs">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Adapter:</span>
                  <span className="text-neutral-200">{model.adapter_availability}</span>
                </div>

                <div className="flex items-center justify-between text-neutral-400">
                  <span>Handler:</span>
                  <span className="text-neutral-200">{model.handler_availability}</span>
                </div>

                {model.supported_modalities && (
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Modalities:</span>
                    <span className="text-neutral-200">
                      {model.supported_modalities.join(', ')}
                    </span>
                  </div>
                )}

                {model.input_resolution && (
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Native GSD:</span>
                    <span className="text-neutral-200 font-mono text-[11px]">{model.input_resolution}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
