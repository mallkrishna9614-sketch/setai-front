import React from 'react';
import type {
  ChangeAnalysisData,
  ChangeRegionFinding,
  FindingRegion,
  ModelResult
} from '../../types/investigation';
import { formatConfidencePercent } from '../../utils/formatters';

interface SpecialistResultPanelProps {
  models: ModelResult[];
}

interface NormalizedModelOutput {
  task: string;
  modelName: string;
  version: string;
  status: string;
  answer?: string;
  caption?: string;
  finding?: string;
  changeDetected?: boolean;
  changeType?: string;
  changedAreaPercent?: number;
  regions?: FindingRegion[];
  evidence?: Array<Record<string, unknown>>;
  regionFindings?: ChangeRegionFinding[];
  whatChanged?: string;
  why?: string;
  changeVisualizationUrl?: string;
  changeMaskUrl?: string;
  sarMaskUrl?: string;
  raw?: unknown;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function firstRecord(...values: unknown[]): Record<string, unknown> | null {
  for (const value of values) {
    const record = asRecord(value);
    if (record) return record;
  }
  return null;
}

function finiteNumber(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function normalizeRegion(value: unknown, index: number): FindingRegion | null {
  const record = asRecord(value);
  if (!record) return null;

  const rawBbox = record.bbox;
  let bbox: [number, number, number, number] | null = null;

  if (Array.isArray(rawBbox) && rawBbox.length === 4) {
    const nums = rawBbox.map(finiteNumber);
    if (nums.every((n): n is number => n !== undefined)) {
      bbox = [nums[0], nums[1], nums[2], nums[3]];
    }
  } else if (
    finiteNumber(record.x) !== undefined &&
    finiteNumber(record.y) !== undefined &&
    finiteNumber(record.width) !== undefined &&
    finiteNumber(record.height) !== undefined
  ) {
    const x = finiteNumber(record.x)!;
    const y = finiteNumber(record.y)!;
    const width = finiteNumber(record.width)!;
    const height = finiteNumber(record.height)!;
    bbox = [y, x, y + height, x + width];
  } else if (
    finiteNumber(record.x1) !== undefined &&
    finiteNumber(record.y1) !== undefined &&
    finiteNumber(record.x2) !== undefined &&
    finiteNumber(record.y2) !== undefined
  ) {
    bbox = [
      finiteNumber(record.y1)!,
      finiteNumber(record.x1)!,
      finiteNumber(record.y2)!,
      finiteNumber(record.x2)!
    ];
  }

  if (!bbox) return null;

  const label = String(record.label ?? record.name ?? record.type ?? `Region ${index + 1}`);
  const confidence = finiteNumber(record.confidence);

  return {
    id: String(record.id ?? `ml-region-${index + 1}`),
    label,
    bbox,
    confidence
  };
}

function normalizeRegions(value: unknown): FindingRegion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => normalizeRegion(item, index))
    .filter((item): item is FindingRegion => item !== null);
}



function textValue(record: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function findNestedText(record: Record<string, unknown> | null, ...keys: string[]): string | undefined {
  if (!record) return undefined;

  const wanted = new Set(keys.map(key => key.toLowerCase()));

  const scalarText = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    return undefined;
  };

  const extractArtifactValue = (value: unknown): string | undefined => {
    const direct = scalarText(value);
    if (direct) return direct;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

    const obj = value as Record<string, unknown>;
    for (const key of ['url', 'src', 'href', 'path', 'uri', 'data_url', 'image_url']) {
      const found = scalarText(obj[key]);
      if (found) return found;
    }
    return undefined;
  };

  const queue: unknown[] = [record];
  const seen = new Set<object>();

  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== 'object') continue;
    if (seen.has(value as object)) continue;
    seen.add(value as object);

    if (Array.isArray(value)) {
      queue.push(...value);
      continue;
    }

    const obj = value as Record<string, unknown>;

    for (const [key, child] of Object.entries(obj)) {
      const normalizedKey = key.toLowerCase();
      if (wanted.has(normalizedKey)) {
        const extracted = extractArtifactValue(child);
        if (extracted) return extracted;
      }

      if (
        normalizedKey.includes('visual') ||
        normalizedKey.includes('overlay') ||
        normalizedKey.includes('mask') ||
        normalizedKey.includes('artifact') ||
        normalizedKey.includes('annotated')
      ) {
        const extracted = extractArtifactValue(child);
        if (extracted) return extracted;
      }

      if (child && typeof child === 'object') {
        queue.push(child);
      }
    }
  }

  return undefined;
}

function normalizeRegionFindings(value: unknown): ChangeRegionFinding[] {
  if (!Array.isArray(value)) return [];

  return value.map((item, index) => {
    const record = asRecord(item) || {};
    const rawBbox = record.bbox;
    let bbox: [number, number, number, number] | undefined;

    if (Array.isArray(rawBbox) && rawBbox.length === 4) {
      const nums = rawBbox.map(finiteNumber);
      if (nums.every((n): n is number => n !== undefined)) {
        bbox = [nums[0], nums[1], nums[2], nums[3]];
      }
    }

    const confidence = finiteNumber(record.confidence ?? record.score);

    return {
      id: String(record.id ?? record.region_id ?? index + 1),
      title: textValue(record, 'title', 'name', 'region_name') || `Region ${index + 1}`,
      region: textValue(record, 'region', 'location', 'position'),
      change: textValue(record, 'change', 'description', 'finding', 'summary', 'semantic_description'),
      type: textValue(record, 'type', 'change_type', 'class', 'label'),
      evidence: textValue(record, 'evidence', 'evidence_description'),
      confidence,
      bbox
    };
  }).filter(item => Boolean(item.change || item.type || item.evidence || item.region));
}

function unwrapOutput(model: ModelResult): Record<string, unknown> | null {
  const direct = asRecord(model.output);
  if (!direct) {
    const result = asRecord((model as unknown as Record<string, unknown>).result);
    return result;
  }

  const nested = firstRecord(direct.result, direct.output, direct.data);
  return nested || direct;
}

function normalizeModel(model: ModelResult): NormalizedModelOutput {
  const rawModel = model as unknown as Record<string, unknown>;
  const output = unwrapOutput(model);
  const task = String(model.task || rawModel.task_type || '').toLowerCase();
  const modelName = model.model_name || String(rawModel.model_name || 'Specialist model');
  const version = model.version || String(rawModel.model_version || '');
  const success = rawModel.success !== undefined
    ? Boolean(rawModel.success)
    : undefined;
  const status = model.status || (success === false ? 'failed' : 'success');

  if (!output) {
    return {
      task,
      modelName,
      version,
      status,
      raw: model.output ?? rawModel.result
    };
  }

  const answer = typeof output.answer === 'string' ? output.answer : undefined;
  const caption = typeof output.caption === 'string' ? output.caption : undefined;
  const finding =
    typeof output.finding === 'string'
      ? output.finding
      : typeof output.cross_modal_finding === 'string'
        ? output.cross_modal_finding
        : undefined;

  const changedAreaPercent =
    finiteNumber(output.changed_area_percent) ??
    finiteNumber(output.changed_area_percentage) ??
    finiteNumber(output.changed_area);

  const changeDetected =
    typeof output.change_detected === 'boolean'
      ? output.change_detected
      : undefined;

  const changeType =
    typeof output.change_type === 'string'
      ? output.change_type
      : typeof output.change_class === 'string'
        ? output.change_class
        : undefined;

  const regions = normalizeRegions(
    output.regions ??
    output.changed_regions ??
    output.detections ??
    output.region_findings ??
    output.change_findings
  );

  const regionFindings = normalizeRegionFindings(
    output.region_findings ??
    output.region_analysis ??
    output.semantic_findings ??
    output.change_findings ??
    output.findings ??
    output.descriptions ??
    output.regions ??
    output.changed_regions ??
    output.detections
  );

  const whatChanged =
    textValue(output, 'what_changed', 'change_summary', 'summary', 'answer', 'description') ??
    (changeType ? `Detected change classified as ${changeType}.` : undefined);

  const why = textValue(
    output,
    'why',
    'explanation',
    'reason',
    'analysis',
    'rationale'
  );

  const changeVisualizationUrl = findNestedText(
    output,
    'change_visualization_url',
    'change_visualization',
    'annotated_image',
    'overlay_image',
    'current_with_changes',
    'visualization_url',
    'visualization',
    'overlay_url',
    'annotated_image_url',
    'artifact_url',
    'image_url'
  );
  const changeMaskUrl = findNestedText(
    output,
    'change_mask_url',
    'change_mask',
    'change_map',
    'mask_url'
  );
  const sarMaskUrl = findNestedText(
    output,
    'sar_mask_url',
    'sar_change_mask',
    'sar_mask'
  );

  const evidence = Array.isArray(output.evidence)
    ? output.evidence.filter(asRecord) as Array<Record<string, unknown>>
    : undefined;

  return {
    task,
    modelName,
    version,
    status,
    answer,
    caption,
    finding,
    changeDetected,
    changeType,
    changedAreaPercent,
    regions,
    evidence,
    regionFindings,
    whatChanged,
    why,
    changeVisualizationUrl,
    changeMaskUrl,
    sarMaskUrl,
    raw: output
  };
}

export function extractSpecialistRegions(models: ModelResult[]): FindingRegion[] {
  const regions: FindingRegion[] = [];
  for (const model of models || []) {
    regions.push(...(normalizeModel(model).regions || []));
  }
  return regions;
}

export function deriveSpecialistChangeAnalysis(
  models: ModelResult[]
): ChangeAnalysisData | null {
  for (const model of models || []) {
    const normalized = normalizeModel(model);
    if (!normalized.task.includes('change')) continue;

    const raw = asRecord(normalized.raw);
    const comparison =
      typeof raw?.comparison === 'string'
        ? raw.comparison
        : undefined;

    const referenceImage =
      typeof raw?.reference_image === 'string'
        ? raw.reference_image
        : undefined;

    const matchScore = finiteNumber(raw?.match_score);
    const signal = finiteNumber(raw?.signal);

    if (
      normalized.changedAreaPercent === undefined &&
      (normalized.regions?.length ?? 0) === 0 &&
      normalized.changeDetected === undefined &&
      !normalized.changeType &&
      !comparison &&
      matchScore === undefined &&
      signal === undefined
    ) {
      continue;
    }

    return {
      comparison,
      reference_image: referenceImage,
      match_score: matchScore,
      changed_area: normalized.changedAreaPercent,
      regions: normalized.regions ?? [],
      signal,
      change_detected: normalized.changeDetected,
      change_type: normalized.changeType,
      what_changed: normalized.whatChanged,
      why: normalized.why,
      region_findings: normalized.regionFindings,
      change_visualization_url: normalized.changeVisualizationUrl,
      change_mask_url: normalized.changeMaskUrl,
      sar_mask_url: normalized.sarMaskUrl,
      // Preserve the complete provider payload for frontend artifact resolution.
      model_output: raw ?? undefined
    };
  }

  return null;
}

function renderJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export const SpecialistResultPanel: React.FC<SpecialistResultPanelProps> = ({
  models = []
}) => {
  const normalized = models.map(normalizeModel);
  if (normalized.length === 0) return null;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-100">AI specialist analysis</h2>
          <span className="text-xs text-neutral-500">
            Actual output returned by the configured remote/local model
          </span>
        </div>
        <span className="text-xs text-neutral-500">
          {normalized.length} {normalized.length === 1 ? 'model' : 'models'}
        </span>
      </div>

      <div className="space-y-4">
        {normalized.map((result, index) => {
          const isSuccess =
            result.status === 'success' ||
            result.status === 'completed' ||
            result.status === 'ok';

          const rawRecord = asRecord(result.raw);
          const confidence =
            finiteNumber(rawRecord?.confidence) ??
            finiteNumber(rawRecord?.score);

          const taskLabel =
            result.task === 'vqa'
              ? 'Visual Question Answering'
              : result.task === 'caption'
                ? 'Scene Description'
                : result.task.includes('change')
                  ? 'Bi-Temporal Change Analysis'
                  : result.task.includes('fusion')
                    ? 'Optical + SAR Cross-Modal Analysis'
                    : result.task || 'Earth Observation Analysis';

          return (
            <div
              key={`${result.modelName}-${result.task}-${index}`}
              className="rounded border border-neutral-800 bg-neutral-950 p-4 space-y-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-neutral-100">
                    {result.modelName}
                    {result.version ? (
                      <span className="ml-2 font-mono text-[11px] text-neutral-500">
                        {result.version}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">{taskLabel}</div>
                </div>
                <span
                  className={`text-[11px] font-medium ${
                    isSuccess ? 'text-status-success' : 'text-status-error'
                  }`}
                >
                  {isSuccess ? 'Success' : 'Error'}
                </span>
              </div>

              {result.answer && (
                <div className="rounded border border-neutral-800 bg-neutral-900 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                    AI analysis
                  </div>
                  <p className="text-sm text-neutral-100 leading-relaxed">
                    {result.answer}
                  </p>
                </div>
              )}

              {result.caption && (
                <div className="rounded border border-neutral-800 bg-neutral-900 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                    Scene description
                  </div>
                  <p className="text-sm text-neutral-100 leading-relaxed">
                    {result.caption}
                  </p>
                </div>
              )}

              {result.finding && (
                <div className="rounded border border-neutral-800 bg-neutral-900 p-3">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500 mb-1">
                    Finding
                  </div>
                  <p className="text-sm text-neutral-100 leading-relaxed">
                    {result.finding}
                  </p>
                </div>
              )}

              {result.task.includes('change') && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded border border-neutral-800 bg-neutral-900 p-2.5">
                    <div className="text-[10px] text-neutral-500">Change detected</div>
                    <div className="mt-1 text-xs font-semibold text-neutral-100">
                      {result.changeDetected === undefined
                        ? 'N/A'
                        : result.changeDetected
                          ? 'Yes'
                          : 'No'}
                    </div>
                  </div>
                  <div className="rounded border border-neutral-800 bg-neutral-900 p-2.5">
                    <div className="text-[10px] text-neutral-500">Change type</div>
                    <div className="mt-1 text-xs font-semibold text-neutral-100">
                      {result.changeType || 'N/A'}
                    </div>
                  </div>
                  <div className="rounded border border-neutral-800 bg-neutral-900 p-2.5">
                    <div className="text-[10px] text-neutral-500">Changed area</div>
                    <div className="mt-1 text-xs font-semibold text-neutral-100">
                      {result.changedAreaPercent === undefined
                        ? 'N/A'
                        : `${result.changedAreaPercent.toFixed(2)}%`}
                    </div>
                  </div>
                  <div className="rounded border border-neutral-800 bg-neutral-900 p-2.5">
                    <div className="text-[10px] text-neutral-500">Regions</div>
                    <div className="mt-1 text-xs font-semibold text-neutral-100">
                      {result.regions?.length ?? 0}
                    </div>
                  </div>
                </div>
              )}

              {confidence !== undefined && (
                <div className="text-xs text-neutral-400">
                  Model confidence:{' '}
                  <span className="text-neutral-200 font-medium">
                    {formatConfidencePercent(confidence)}
                  </span>
                </div>
              )}

              {result.evidence && result.evidence.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                    Model evidence
                  </div>
                  {result.evidence.map((item, evidenceIndex) => (
                    <div
                      key={`model-evidence-${index}-${evidenceIndex}`}
                      className="rounded border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-neutral-300"
                    >
                      {String(item.description ?? item.text ?? item.type ?? 'Evidence returned by model.')}
                    </div>
                  ))}
                </div>
              )}

              {!result.answer &&
                !result.caption &&
                !result.finding &&
                !result.task.includes('change') && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-neutral-500 hover:text-neutral-300">
                      View raw model output
                    </summary>
                    <pre className="mt-2 rounded bg-neutral-900 border border-neutral-800 p-2 text-[11px] text-neutral-300 whitespace-pre-wrap break-all overflow-x-auto">
                      {renderJson(result.raw)}
                    </pre>
                  </details>
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
