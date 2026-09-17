import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import type { InvestigationFinding, FindingRegion } from '../../types/investigation';
import { downloadReport } from '../../api/investigations';

interface FindingsPanelProps {
  investigationId: string;
  finding?: InvestigationFinding;
  status: 'completed' | 'failed' | 'in_progress';
  message?: string;
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({
  investigationId,
  finding,
  status,
  message
}) => {
  const [downloading, setDownloading] = useState<boolean>(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReport(investigationId);
    } catch (err: any) {
      alert(`Report download failed: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const isCompleted = status === 'completed';
  const isFailed = status === 'failed';

  return (
    <div
      className={`rounded-lg border p-5 space-y-4 ${
        isFailed
          ? 'bg-neutral-900 border-status-error/30'
          : 'bg-neutral-900 border-neutral-800'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">
            Mission finding
          </h2>
          <span className="text-xs text-neutral-500">
            Grounded outcome from specialist models
          </span>
        </div>

        {/* Download Report Button */}
        {isCompleted && (
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-neutral-400" />
            )}
            <span>Download report</span>
          </button>
        )}
      </div>

      {/* Body Content */}
      <div className="space-y-4">
        {isFailed ? (
          <div className="p-3 bg-status-errorMuted border border-status-error/20 rounded text-status-error text-xs space-y-1">
            <span className="font-medium block">Investigation halted</span>
            <p className="text-neutral-300 font-sans">{message || 'An error occurred during execution.'}</p>
          </div>
        ) : (
          <>
            {/* Finding Summary */}
            {finding?.summary && (
              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-medium">
                  Summary
                </span>
                <p className="text-sm text-neutral-100 leading-relaxed font-sans font-medium">
                  {finding.summary}
                </p>
              </div>
            )}

            {/* VQA Answer */}
            {finding?.answer && (
              <div className="space-y-1 pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-400 font-medium">
                  Analysis answer
                </span>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {finding.answer}
                </p>
              </div>
            )}

            {/* Scene Caption */}
            {finding?.scene && (
              <div className="space-y-1 pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-400 font-medium">
                  Scene description
                </span>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {finding.scene}
                </p>
              </div>
            )}

            {/* Change Detection Decision */}
            {finding?.change_detected !== undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-400 block mb-1">
                    Change detected:
                  </span>
                  <span
                    className={`font-medium ${
                      finding.change_detected ? 'text-status-warning' : 'text-neutral-300'
                    }`}
                  >
                    {finding.change_detected ? 'Yes — change verified' : 'No significant change'}
                  </span>
                </div>

                {finding.change_type && (
                  <div>
                    <span className="text-neutral-400 block mb-1">
                      Dynamics classification:
                    </span>
                    <span className="text-neutral-200">
                      {finding.change_type}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Cross-Modal Optical-SAR Finding */}
            {finding?.cross_modal_finding && (
              <div className="space-y-1 pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-400 font-medium">
                  Cross-modal optical and SAR verification
                </span>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  {finding.cross_modal_finding}
                </p>
              </div>
            )}

            {/* Extracted Spatial Regions */}
            {finding?.regions && finding.regions.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-neutral-800">
                <span className="text-xs text-neutral-400 font-medium">
                  Extracted spatial regions
                </span>
                <div className="space-y-1.5">
                  {finding.regions.map((reg: FindingRegion) => (
                    <div
                      key={reg.id}
                      className="p-2 bg-neutral-950 border border-neutral-800 rounded flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <span className="text-neutral-200 font-medium">
                        {reg.label}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                        {reg.geo_coordinates && (
                          <span>
                            {reg.geo_coordinates.latitude}°N, {reg.geo_coordinates.longitude}°E
                          </span>
                        )}
                        <span>
                          [{reg.bbox.map(n => n.toFixed(2)).join(', ')}]
                        </span>
                        {reg.confidence && (
                          <span className="text-neutral-300">
                            {(reg.confidence * 100).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
