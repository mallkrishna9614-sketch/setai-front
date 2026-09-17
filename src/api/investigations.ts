import type { InvestigationRequest, InvestigationResponse } from '../types/investigation';
import { apiFetch, getApiBaseUrl, isMockMode } from './client';
import { MOCK_INVESTIGATIONS } from '../mocks/investigations';

const LOCAL_STORAGE_MISSIONS_KEY = 'satquery_mission_history';

/**
 * Get stored local missions history (synced across investigations)
 */
export function getStoredMissions(): InvestigationResponse[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MISSIONS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read stored missions:', err);
  }

  // Pre-seed with the mock investigations so history is rich on first load
  const initial = Object.values(MOCK_INVESTIGATIONS);
  try {
    localStorage.setItem(LOCAL_STORAGE_MISSIONS_KEY, JSON.stringify(initial));
  } catch {
    // Ignore storage quota
  }
  return initial;
}

export function saveMissionToHistory(mission: InvestigationResponse): void {
  try {
    const existing = getStoredMissions();
    const filtered = existing.filter(m => m.investigation_id !== mission.investigation_id);
    const updated = [mission, ...filtered];
    localStorage.setItem(LOCAL_STORAGE_MISSIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save mission to history:', err);
  }
}

/**
 * Execute an investigation
 */
export async function createInvestigation(request: InvestigationRequest): Promise<InvestigationResponse> {
  if (isMockMode()) {
    // Simulate multi-stage agentic processing delay
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const q = request.query.toLowerCase();
    const imageCount = request.image_ids.length;

    let response: InvestigationResponse;

    // Smart matcher based on input query & images
    if (q.includes('incompatible') || request.image_ids.includes('img_incompatible_raster')) {
      response = { ...MOCK_INVESTIGATIONS.scenario_compat_fail };
    } else if (q.includes('conflict') || q.includes('drought') || q.includes('submerged') || q.includes('flooded')) {
      response = { ...MOCK_INVESTIGATIONS.scenario_conflict };
    } else if (q.includes('oom') || q.includes('photogrammetric') || q.includes('dense 3d')) {
      response = { ...MOCK_INVESTIGATIONS.scenario_model_fail };
    } else if (q.includes('sar') || q.includes('cross-modal') || request.image_ids.some(id => id.includes('sar'))) {
      response = { ...MOCK_INVESTIGATIONS.scenario_optical_sar };
    } else if (q.includes('ground the altered') || q.includes('increased, decreased') || q.includes('dag')) {
      response = { ...MOCK_INVESTIGATIONS.scenario_dag };
    } else if (q.includes('change') || imageCount >= 2) {
      response = { ...MOCK_INVESTIGATIONS.scenario_change };
    } else if (q.includes('water body') || q.includes('highlight') || q.includes('grounding')) {
      response = { ...MOCK_INVESTIGATIONS.scenario_grounding };
    } else {
      response = { ...MOCK_INVESTIGATIONS.scenario_vqa };
    }

    // Refresh timestamps and query to reflect current execution
    const now = new Date().toISOString();
    const customId = `inv_${Date.now().toString(36).slice(-6)}`;
    const clonedResponse: InvestigationResponse = {
      ...response,
      investigation_id: customId,
      query: request.query,
      created_at: now,
      tasks: response.tasks.map((t, idx) => ({
        ...t,
        task_id: `task_${idx + 1}_${Date.now().toString(36).slice(-4)}`,
        image_ids: request.image_ids,
        query: request.query
      })),
      execution: {
        ...response.execution,
        trace: response.execution.trace.map(tr => ({
          ...tr,
          timestamp: new Date(Date.now() - (response.execution.trace.length - 1) * 200).toISOString()
        }))
      }
    };

    saveMissionToHistory(clonedResponse);
    return clonedResponse;
  }

  // Live FastAPI backend: POST /api/v1/investigations/
  const response = await apiFetch<InvestigationResponse>('/investigations/', {
    method: 'POST',
    body: JSON.stringify(request)
  });

  saveMissionToHistory(response);
  return response;
}

/**
 * Fetch details of a single investigation
 */
export async function getInvestigation(investigationId: string): Promise<InvestigationResponse> {
  if (isMockMode()) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const missions = getStoredMissions();
    const found = missions.find(m => m.investigation_id === investigationId);
    if (found) {
      return found;
    }
    // Fallback to first mock
    return Object.values(MOCK_INVESTIGATIONS)[0];
  }

  return await apiFetch<InvestigationResponse>(`/investigations/${investigationId}`, {
    method: 'GET'
  });
}

/**
 * Download investigation report
 * GET /api/v1/investigations/{investigation_id}/report
 */
export async function downloadReport(investigationId: string, filename?: string): Promise<void> {
  const targetFilename = filename || `SatQuery_Report_${investigationId}.md`;

  if (isMockMode()) {
    const mission = await getInvestigation(investigationId);
    const markdown = generateMarkdownReport(mission);
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
    triggerBlobDownload(blob, targetFilename);
    return;
  }

  // Live backend report download
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/investigations/${investigationId}/report`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: '*/*' }
  });

  if (!response.ok) {
    throw new Error(`Failed to download report (HTTP ${response.status})`);
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, targetFilename);
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generateMarkdownReport(inv: InvestigationResponse): string {
  return `# SATQUERY AI - EARTH OBSERVATION INVESTIGATION REPORT
=============================================================================
Investigation ID : ${inv.investigation_id}
Mission Query    : "${inv.query}"
Status           : ${inv.status.toUpperCase()}
Timestamp        : ${inv.created_at || new Date().toISOString()}
=============================================================================

## 1. MISSION FINDING
Summary: ${inv.finding?.summary || 'No summary available'}
Task Type: ${inv.finding?.task_type || 'N/A'}
${inv.finding?.answer ? `\nAnswer:\n${inv.finding.answer}\n` : ''}
${inv.finding?.change_type ? `\nChange Type: ${inv.finding.change_type}\nChange Detected: ${inv.finding.change_detected ? 'YES' : 'NO'}\n` : ''}
${inv.finding?.cross_modal_finding ? `\nCross-Modal Finding:\n${inv.finding.cross_modal_finding}\n` : ''}

## 2. CONFIDENCE ASSESSMENT
- Composite Score : ${Math.round(inv.execution.confidence.score * 100)}%
- Confidence Label: ${inv.execution.confidence.label}
- Associated Model: ${inv.execution.confidence.associated_model}
- Task Domain     : ${inv.execution.confidence.task_type}
${inv.execution.confidence.factors ? `- Contributing Factors:\n  ${inv.execution.confidence.factors.map(f => `* ${f}`).join('\n  ')}` : ''}

## 3. EVIDENCE GROUNDING
${inv.execution.evidence.map((ev, i) => `### Evidence Item #${i + 1} [${ev.type}]
- Description: ${ev.description}
- Source Model: ${ev.source} (${ev.model_version})
- Task: ${ev.task}
${ev.metrics ? `- Quantified Metrics: ${JSON.stringify(ev.metrics)}` : ''}
`).join('\n')}

## 4. MODEL DISCREPANCY & CONFLICT AUDIT
${inv.execution.conflicts.length === 0 ? 'No conflicting sensory signals detected across models.' : inv.execution.conflicts.map(c => `[CONFLICT DETECTED - SEVERITY: ${c.severity}]
- Type: ${c.conflict_type}
- Affected Tasks: ${c.affected_tasks.join(', ')}
- Details: ${c.description}
`).join('\n')}

## 5. RASTER COMPATIBILITY VERIFICATION
Status: ${inv.execution.compatibility.compatible ? 'VALIDATED COMPATIBLE' : 'COMPATIBILITY FAILED'}
${inv.execution.compatibility.reasons.length > 0 ? `Issues Encountered:\n${inv.execution.compatibility.reasons.map(r => `* ${r}`).join('\n')}` : 'All input rasters share matching CRS, resolution, and valid spatial bounds.'}

## 6. OBSERVABLE EXECUTION TRACE
${inv.execution.trace.map(tr => `[${tr.timestamp}] [${tr.status.toUpperCase()}] ${tr.step}: ${tr.details}`).join('\n')}

=============================================================================
Report generated by SatQuery AI Platform (Smart India Hackathon 2026)
`;
}
