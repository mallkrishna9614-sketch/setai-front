import React, { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';
import type { ImageMetadata, Modality } from '../types/image';
import type { InvestigationResponse } from '../types/investigation';
import { uploadImage } from '../api/images';
import { createInvestigation } from '../api/investigations';
import { isMockMode } from '../api/client';
import { MissionInput } from '../components/investigation/MissionInput';
import { ImageUploader } from '../components/investigation/ImageUploader';
import { ImageViewer } from '../components/investigation/ImageViewer';
import { InvestigationPlan } from '../components/investigation/InvestigationPlan';
import { FindingsPanel } from '../components/investigation/FindingsPanel';
import { EvidencePanel } from '../components/investigation/EvidencePanel';
import { ConfidenceGauge } from '../components/investigation/ConfidenceGauge';
import { ModelResultsList } from '../components/investigation/ModelResultsList';
import { ConflictWarning } from '../components/investigation/ConflictWarning';
import { ExecutionTrace } from '../components/investigation/ExecutionTrace';
import { CompatibilityStatus } from '../components/investigation/CompatibilityStatus';
import { ChangeAnalysisPanel } from '../components/investigation/ChangeAnalysisPanel';
import {
  SpecialistResultPanel,
  extractSpecialistRegions,
  deriveSpecialistChangeAnalysis
} from '../components/investigation/SpecialistResultPanel';
import { DEMO_SCENARIOS } from '../mocks/scenarios';
import type { ScenarioDefinition } from '../mocks/scenarios';
import { MOCK_IMAGES } from '../mocks/images';

interface InvestigatePageProps {
  onMissionCompleted?: () => void;
  selectedScenario?: ScenarioDefinition | null;
  onClearScenario?: () => void;
}

export const InvestigatePage: React.FC<InvestigatePageProps> = ({
  onMissionCompleted,
  selectedScenario,
  onClearScenario
}) => {
  const [query, setQuery] = useState<string>(
    'Describe the land-cover and major objects visible in this image.'
  );
  const [images, setImages] = useState<ImageMetadata[]>(() =>
    isMockMode() ? [MOCK_IMAGES.img_s2_optical_t1] : []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (investigation?.status === 'completed') {
      window.setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [investigation?.investigation_id, investigation?.status]);

  const applyScenario = (sc: ScenarioDefinition) => {
    setQuery(sc.query);
    setImages(sc.images);
    setInvestigation(sc.response);
    setError(null);
    if (onClearScenario) {
      onClearScenario();
    }
  };

  React.useEffect(() => {
    if (selectedScenario) {
      applyScenario(selectedScenario);
    }
  }, [selectedScenario]);

  const handleAddImage = (image: ImageMetadata) => {
    if (images.length >= 2) return;
    setImages(prev => [...prev, image]);
    setError(null);
  };

  const handleRemoveImage = (imageId: string) => {
    setImages(prev => {
      const target = prev.find(img => img.image_id === imageId);
      if (target?.preview_url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.preview_url);
      }
      return prev.filter(img => img.image_id !== imageId);
    });
  };

  const handleUpdateModality = (imageId: string, modality: Modality) => {
    setImages(prev =>
      prev.map(img => (img.image_id === imageId ? { ...img, modality } : img))
    );
  };

  const handleUploadFile = async (file: File, modality: Modality) => {
    try {
      const res = await uploadImage(file, modality);
      if (res.image) {
        setImages(prev => {
          const nonMock = !isMockMode()
            ? prev.filter(img => !img.image_id.startsWith('img_mock_') && !img.image_id.startsWith('img_s2_'))
            : prev;

          if (nonMock.length === 0) {
            return [{ ...res.image, slot_label: 'Image 1' }];
          }
          if (nonMock.length === 1) {
            return [...nonMock, { ...res.image, slot_label: 'Image 2' }];
          }
          return [{ ...res.image, slot_label: 'Image 1' }, nonMock[1]];
        });
        setError(null);
      }
    } catch (uploadErr: any) {
      setError(uploadErr.message || 'Image upload failed.');
    }
  };

  const handleInvestigate = async () => {
    if (!query.trim()) {
      setError('Please enter an Earth observation query.');
      return;
    }
    if (images.length === 0) {
      setError('Please upload a satellite image (GeoTIFF, PNG, or JPEG) to investigate.');
      return;
    }

    // Safety check: prevent sending mock image IDs to live FastAPI backend
    if (!isMockMode()) {
      const mockImages = images.filter(
        i => i.image_id.startsWith('img_mock_') || i.image_id.startsWith('img_s2_')
      );
      if (mockImages.length > 0) {
        setError('Please upload a satellite image (GeoTIFF, PNG, or JPEG) to investigate with the live backend.');
        return;
      }
    }

    const imageIds = images.map(i => i.image_id);
    console.log('SatQuery AI - Investigation Request:', {
      query: query.trim(),
      image_ids: imageIds
    });

    setIsLoading(true);
    setError(null);

    try {
      const response = await createInvestigation({
        query: query.trim(),
        image_ids: imageIds
      });
      console.log('SatQuery AI - Live Investigation Response:', response);
      console.log('SatQuery AI - Confidence:', response?.execution?.confidence);
      console.log(
        'SatQuery AI - CONFIDENCE TYPE:',
        Array.isArray(response?.execution?.confidence)
          ? 'array'
          : typeof response?.execution?.confidence
      );
      setInvestigation(response);
      if (onMissionCompleted) {
        onMissionCompleted();
      }
    } catch (err: any) {
      setError(err.message || 'Investigation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetWorkspace = () => {
    images.forEach(img => {
      if (img.preview_url?.startsWith('blob:')) {
        URL.revokeObjectURL(img.preview_url);
      }
    });
    setQuery('Describe the land-cover and major objects visible in this image.');
    setImages(isMockMode() ? [MOCK_IMAGES.img_s2_optical_t1] : []);
    setInvestigation(null);
    setError(null);
  };

  const modelResults = investigation?.execution?.model_results || [];
  const specialistRegions = investigation
    ? extractSpecialistRegions(modelResults)
    : [];
  const displayRegions = investigation?.finding?.regions?.length
    ? investigation.finding.regions
    : specialistRegions;
  const derivedChangeAnalysis = investigation
    ? deriveSpecialistChangeAnalysis(modelResults)
    : null;
  const changeAnalysis = investigation?.execution?.change_analysis || derivedChangeAnalysis;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Demo Presets Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-3 flex items-center justify-between gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0 text-xs font-medium text-neutral-400">
          <span>Presets:</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {DEMO_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => applyScenario(sc)}
              className="px-2.5 py-1 text-xs rounded bg-neutral-950 hover:bg-neutral-850 text-neutral-300 hover:text-neutral-100 border border-neutral-800 hover:border-neutral-700 shrink-0 transition-colors"
            >
              {sc.name}
            </button>
          ))}
        </div>

        <button
          onClick={handleResetWorkspace}
          className="p-1 text-neutral-500 hover:text-neutral-300 rounded shrink-0 transition-colors"
          title="Reset workspace"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Investigation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <MissionInput
            query={query}
            onChangeQuery={setQuery}
            onInvestigate={handleInvestigate}
            isLoading={isLoading}
          />

          <ImageUploader
            images={images}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
            onUpdateModality={handleUpdateModality}
            onUploadFile={handleUploadFile}
            isLoading={isLoading}
          />

          {/* Primary Action Button */}
          <button
            onClick={handleInvestigate}
            disabled={isLoading || images.length === 0}
            className="w-full py-2.5 px-4 rounded-md font-medium text-xs tracking-wide transition-colors flex items-center justify-center gap-2 bg-brand-teal hover:bg-brand-tealHover text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Executing investigation...</span>
              </>
            ) : (
              <span>Investigate</span>
            )}
          </button>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded bg-status-errorMuted border border-status-error/30 text-status-error text-xs">
              {error}
            </div>
          )}

          {investigation?.execution?.compatibility && (
            <CompatibilityStatus
              compatibility={investigation.execution.compatibility}
            />
          )}

          {investigation?.execution?.confidence && (
            <ConfidenceGauge
              confidence={investigation.execution.confidence}
            />
          )}
        </div>

        {/* Right Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ImageViewer
            images={images}
            regions={displayRegions}
            isLoading={isLoading}
          />

          {changeAnalysis && (
            <div ref={resultsRef} className="scroll-mt-6">
              <ChangeAnalysisPanel data={changeAnalysis} />
            </div>
          )}

          {modelResults.length > 0 && (
            <SpecialistResultPanel models={modelResults} />
          )}

          {investigation?.finding && (
            <FindingsPanel
              investigationId={investigation.investigation_id}
              finding={investigation.finding}
              status={investigation.status}
              message={investigation.message}
            />
          )}

          {investigation?.tasks && investigation.tasks.length > 0 && (
            <InvestigationPlan
              tasks={investigation.tasks}
              isLoading={isLoading}
            />
          )}

          {investigation?.execution?.conflicts && (
            <ConflictWarning
              conflicts={investigation.execution.conflicts}
            />
          )}

          {investigation?.execution?.evidence && (
            <EvidencePanel
              evidence={investigation.execution.evidence}
            />
          )}

          {investigation?.execution?.model_results && (
            <ModelResultsList
              models={investigation.execution.model_results}
            />
          )}

          {investigation?.execution?.trace && (
            <ExecutionTrace
              trace={investigation.execution.trace}
              defaultExpanded={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};
