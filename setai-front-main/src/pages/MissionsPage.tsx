import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import type { InvestigationResponse } from '../types/investigation';
import { getInvestigation, getStoredMissions, downloadReport } from '../api/investigations';
import { formatDateTime, formatConfidencePercent } from '../utils/formatters';

const getConfidenceInfo = (confidence?: any) => {
  if (!confidence) return { score: undefined, label: 'N/A' };
  const conf = Array.isArray(confidence) ? (confidence[0] ?? null) : confidence;
  if (!conf) return { score: undefined, label: 'N/A' };
  const score = conf.score !== undefined ? conf.score : conf.confidence;
  const label = conf.label || 'N/A';
  return { score, label };
};

interface MissionsPageProps {
  onSelectMissionForWorkspace: (mission: InvestigationResponse) => void;
}

export const MissionsPage: React.FC<MissionsPageProps> = ({
  onSelectMissionForWorkspace
}) => {
  const [missions, setMissions] = useState<InvestigationResponse[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'completed' | 'failed'>('ALL');
  const [selectedMission, setSelectedMission] = useState<InvestigationResponse | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = () => {
    const list = getStoredMissions();
    setMissions(list);
    if (list.length > 0 && !selectedMission) {
      setSelectedMission(list[0]);
    }
  };

  const handleSelectMission = async (id: string) => {
    setLoadingDetails(true);
    try {
      const details = await getInvestigation(id);
      setSelectedMission(details);
    } catch (err: any) {
      alert(`Failed to load mission details: ${err.message}`);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await downloadReport(id);
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const filteredMissions = missions.filter((m) => {
    const matchesSearch =
      m.query.toLowerCase().includes(search.toLowerCase()) ||
      m.investigation_id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-sm font-semibold text-neutral-100">
            Mission history
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Audit log of dispatched agentic queries and results
          </p>
        </div>

        <button
          onClick={loadMissions}
          className="px-3 py-1.5 rounded bg-neutral-900 hover:bg-neutral-850 text-xs text-neutral-300 border border-neutral-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or query text..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded pl-9 pr-3 py-1.5 text-xs text-neutral-200 font-sans focus:outline-none focus:border-neutral-700"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 text-xs">
          {(['ALL', 'completed', 'failed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === st
                  ? 'bg-neutral-800 text-neutral-100 font-medium'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'completed' ? 'Completed' : 'Failed'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Table & Inspection Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Missions Table */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-neutral-950/80 text-[11px] text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Investigation ID</th>
                  <th className="px-4 py-2.5 font-medium">Directive</th>
                  <th className="px-4 py-2.5 font-medium">Confidence</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800">
                {filteredMissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 text-xs">
                      No missions match current filter.
                    </td>
                  </tr>
                ) : (
                  filteredMissions.map((m) => {
                    const isSelected = selectedMission?.investigation_id === m.investigation_id;
                    const isCompleted = m.status === 'completed';
                    const { score } = getConfidenceInfo(m.execution?.confidence);
                    const hasValidScore = typeof score === 'number' && Number.isFinite(score);

                    return (
                      <tr
                        key={m.investigation_id}
                        onClick={() => handleSelectMission(m.investigation_id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-850 text-neutral-100'
                            : 'hover:bg-neutral-850/50 text-neutral-300'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                          {m.investigation_id}
                          <span className="block text-[11px] text-neutral-500 font-normal">
                            {formatDateTime(m.created_at)}
                          </span>
                        </td>

                        <td className="px-4 py-3 max-w-xs truncate" title={m.query}>
                          {m.query}
                        </td>

                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                          {isCompleted && hasValidScore ? (
                            <span
                              className={`font-medium ${
                                score >= 0.8
                                  ? 'text-status-success'
                                  : score >= 0.5
                                  ? 'text-status-warning'
                                  : 'text-status-error'
                              }`}
                            >
                              {formatConfidencePercent(score)}
                            </span>
                          ) : (
                            <span className="text-neutral-500">N/A</span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-[11px] font-medium ${
                              isCompleted ? 'text-status-success' : 'text-status-error'
                            }`}
                          >
                            {isCompleted ? 'Completed' : 'Failed'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => handleDownload(e, m.investigation_id)}
                            className="p-1 text-neutral-400 hover:text-neutral-200 transition-colors"
                            title="Download report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Mission Preview */}
        <div className="lg:col-span-5 space-y-4">
          {selectedMission ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                <div>
                  <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                    <span>Inspection details</span>
                    {loadingDetails && <Loader2 className="w-3 h-3 text-neutral-400 animate-spin" />}
                  </span>
                  <h3 className="text-xs font-mono font-medium text-neutral-200">
                    {selectedMission.investigation_id}
                  </h3>
                </div>

                <button
                  onClick={() => onSelectMissionForWorkspace(selectedMission)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-700 transition-colors"
                >
                  <ExternalLink className="w-3 h-3 text-neutral-400" />
                  <span>Inspect in workspace</span>
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-neutral-400 font-medium">
                  Directive
                </span>
                <p className="text-xs text-neutral-200 bg-neutral-950 p-3 rounded border border-neutral-800 font-sans leading-relaxed">
                  "{selectedMission.query}"
                </p>
              </div>

              {selectedMission.finding && (
                <div className="space-y-1">
                  <span className="text-xs text-neutral-400 font-medium">
                    Finding
                  </span>
                  <p className="text-xs text-neutral-200 bg-neutral-950 p-3 rounded border border-neutral-800 font-sans leading-relaxed">
                    {selectedMission.finding.summary}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-[11px] text-neutral-500 block">Confidence</span>
                  <span className="text-sm font-semibold font-mono text-neutral-100">
                    {formatConfidencePercent(getConfidenceInfo(selectedMission.execution?.confidence).score)}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {getConfidenceInfo(selectedMission.execution?.confidence).label}
                  </span>
                </div>

                <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800">
                  <span className="text-[11px] text-neutral-500 block">Evidence items</span>
                  <span className="text-sm font-semibold font-mono text-neutral-100">
                    {selectedMission.execution?.evidence?.length || 0}
                  </span>
                  <span className="text-[11px] text-neutral-400 block mt-0.5">
                    {selectedMission.execution?.model_results?.length || 0} models used
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => handleDownload(e, selectedMission.investigation_id)}
                className="w-full py-2 bg-neutral-850 hover:bg-neutral-800 text-xs text-neutral-200 border border-neutral-700 rounded flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-neutral-400" />
                <span>Download audit report (.md)</span>
              </button>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-8 text-center text-neutral-500 text-xs">
              Select a mission from the table to inspect details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
