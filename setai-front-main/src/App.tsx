import { useState } from 'react';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import type { NavTab } from './components/layout/Navbar';
import { SettingsModal } from './components/layout/SettingsModal';
import { InvestigatePage } from './pages/InvestigatePage';
import { MissionsPage } from './pages/MissionsPage';
import { ModelsPage } from './pages/ModelsPage';
import { ReportsPage } from './pages/ReportsPage';
import { useBackendStatus } from './hooks/useBackendStatus';
import type { ScenarioDefinition } from './mocks/scenarios';
import type { InvestigationResponse } from './types/investigation';
import { getStoredMissions } from './api/investigations';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('investigate');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioDefinition | null>(null);
  const [missionCount, setMissionCount] = useState<number>(() => getStoredMissions().length);

  const {
    mockMode,
    baseUrl,
    status,
    latencyMs,
    toggleMockMode,
    updateBaseUrl
  } = useBackendStatus();

  const handleMissionCompleted = () => {
    setMissionCount(getStoredMissions().length);
  };

  const handleSelectScenario = (sc: ScenarioDefinition) => {
    setSelectedScenario(sc);
    setActiveTab('investigate');
  };

  const handleSelectMissionForWorkspace = (mission: InvestigationResponse) => {
    const sc: ScenarioDefinition = {
      id: mission.investigation_id,
      name: mission.investigation_id,
      badge: mission.tasks[0]?.task_type || 'Mission',
      category: 'Single-Image',
      description: mission.query,
      query: mission.query,
      images: [],
      response: mission
    };
    setSelectedScenario(sc);
    setActiveTab('investigate');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Primary Header */}
      <Header
        status={status}
        mockMode={mockMode}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Primary Tab Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        missionCount={missionCount}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 pt-6">
        {activeTab === 'investigate' && (
          <InvestigatePage
            onMissionCompleted={handleMissionCompleted}
            selectedScenario={selectedScenario}
            onClearScenario={() => setSelectedScenario(null)}
          />
        )}

        {activeTab === 'missions' && (
          <MissionsPage
            onSelectMissionForWorkspace={handleSelectMissionForWorkspace}
          />
        )}

        {activeTab === 'models' && <ModelsPage />}

        {activeTab === 'reports' && <ReportsPage />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mockMode={mockMode}
        onToggleMockMode={toggleMockMode}
        baseUrl={baseUrl}
        onUpdateBaseUrl={updateBaseUrl}
        onSelectScenario={handleSelectScenario}
      />

      {/* Quiet Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-950 py-4 px-6 mt-auto text-xs text-neutral-500 font-sans">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-neutral-400 font-medium">SatQuery AI</span>
            <span> — Agentic vision-language assistant for remote-sensing analysis</span>
          </div>

          <div className="flex items-center gap-4 text-neutral-500 text-[11px]">
            <span>Observable execution</span>
            <span>·</span>
            <span>ISRO/SAC specification</span>
            <span>·</span>
            <span>Smart India Hackathon 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
