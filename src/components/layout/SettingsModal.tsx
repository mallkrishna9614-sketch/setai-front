import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { checkBackendHealth } from '../../api/client';
import { DEMO_SCENARIOS } from '../../mocks/scenarios';
import type { ScenarioDefinition } from '../../mocks/scenarios';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mockMode: boolean;
  onToggleMockMode: (enable: boolean) => void;
  baseUrl: string;
  onUpdateBaseUrl: (url: string) => void;
  onSelectScenario?: (scenario: ScenarioDefinition) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  mockMode,
  onToggleMockMode,
  baseUrl,
  onUpdateBaseUrl,
  onSelectScenario
}) => {
  const [urlInput, setUrlInput] = useState<string>(baseUrl);
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latencyMs: number } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkBackendHealth();
      setTestResult(res);
    } catch {
      setTestResult({ ok: false, message: 'Connection test failed', latencyMs: 0 });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveUrl = () => {
    onUpdateBaseUrl(urlInput);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="text-sm font-semibold text-neutral-100">
            System configuration
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-neutral-300">
              Execution mode
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleMockMode(true)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  mockMode
                    ? 'bg-neutral-800 text-neutral-100 border-neutral-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                Mock API mode
              </button>
              <button
                type="button"
                onClick={() => onToggleMockMode(false)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  !mockMode
                    ? 'bg-neutral-800 text-neutral-100 border-neutral-600'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-neutral-200'
                }`}
              >
                Live FastAPI backend
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {mockMode
                ? 'Simulated pipeline running locally with all 8 mock scenarios.'
                : `Dispatching real HTTP requests to ${baseUrl}.`}
            </p>
          </div>

          {/* FastAPI Base URL Config */}
          <div className="space-y-2 pt-2 border-t border-neutral-800">
            <label className="block text-xs font-medium text-neutral-300">
              FastAPI base URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://127.0.0.1:8000/api/v1"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-neutral-100 font-mono focus:outline-none focus:border-neutral-600"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                className="px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs rounded border border-neutral-700 transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-850 hover:bg-neutral-800 text-neutral-300 text-xs rounded border border-neutral-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${testing ? 'animate-spin' : ''}`} />
                <span>Test ping</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded text-xs ${
                  testResult.ok
                    ? 'bg-status-successMuted text-status-success border border-status-success/20'
                    : 'bg-status-errorMuted text-status-error border border-status-error/20'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Preset scenarios */}
          {onSelectScenario && (
            <div className="space-y-2 pt-2 border-t border-neutral-800">
              <label className="block text-xs font-medium text-neutral-300">
                Demo presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {DEMO_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => {
                      onSelectScenario(scenario);
                      onClose();
                    }}
                    className="text-left p-2.5 rounded bg-neutral-950 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850 transition-colors"
                  >
                    <div className="text-xs font-medium text-neutral-200 mb-0.5">
                      {scenario.name}
                    </div>
                    <div className="text-[11px] text-neutral-400 line-clamp-2">
                      {scenario.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
