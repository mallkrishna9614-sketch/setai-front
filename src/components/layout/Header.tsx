import React from 'react';
import { Settings } from 'lucide-react';
import type { BackendConnectionStatus } from '../../types/api';

interface HeaderProps {
  status: BackendConnectionStatus;
  mockMode: boolean;
  latencyMs: number | null;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  mockMode,
  latencyMs,
  onOpenSettings
}) => {
  return (
    <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-teal" />
          <div className="flex items-baseline gap-2.5">
            <span className="text-sm font-semibold tracking-tight text-neutral-100 font-sans">
              SatQuery AI
            </span>
            <span className="hidden sm:inline text-xs text-neutral-400 font-normal">
              Ask the Earth. Get Evidence.
            </span>
          </div>
        </div>

        {/* Right status indicator & settings trigger */}
        <div className="flex items-center gap-4">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Configure backend gateway"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                mockMode
                  ? 'bg-status-warning'
                  : status === 'connected'
                  ? 'bg-status-success'
                  : 'bg-status-error'
              }`}
            />
            <span className="font-normal">
              {mockMode
                ? 'Mock mode'
                : status === 'connected'
                ? `Connected (${latencyMs || 0}ms)`
                : 'Backend offline'}
            </span>
          </button>

          <div className="w-px h-3.5 bg-neutral-800" />

          <button
            onClick={onOpenSettings}
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 transition-colors"
            title="System settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
