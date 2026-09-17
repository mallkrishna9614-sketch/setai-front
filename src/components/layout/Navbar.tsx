import React from 'react';

export type NavTab = 'investigate' | 'missions' | 'models' | 'reports';

interface NavbarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  missionCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  missionCount = 0
}) => {
  const tabs: { id: NavTab; label: string; count?: number }[] = [
    { id: 'investigate', label: 'Investigate' },
    { id: 'missions', label: 'Missions', count: missionCount > 0 ? missionCount : undefined },
    { id: 'models', label: 'Models' },
    { id: 'reports', label: 'Reports' },
  ];

  return (
    <nav className="border-b border-neutral-800 bg-neutral-900/60 px-6">
      <div className="max-w-[1600px] mx-auto flex items-center gap-6">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 text-xs font-medium transition-colors relative flex items-center gap-1.5 ${
                isActive
                  ? 'text-neutral-100'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="text-[11px] text-neutral-500 font-mono">
                  ({tab.count})
                </span>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand-teal" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
