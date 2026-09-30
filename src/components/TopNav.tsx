import React from 'react';
import { Activity, Plus, Shield, Globe2, Radio, Server } from 'lucide-react';

export type ActiveTab = 'globe' | 'connections' | 'packets' | 'whois';

interface TopNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenScanModal: () => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onTabChange,
  onOpenScanModal,
  isSimulating,
  onToggleSimulation,
}) => {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-cyan-500/20 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 select-none">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee] animate-pulse" />
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onTabChange('globe');
          }}
          className="text-lg font-bold tracking-wider text-white font-display uppercase hover:text-cyan-400 transition-colors"
        >
          CYBERPULSE <span className="text-cyan-400 text-xs font-mono ml-1 font-normal">NET-OPTIX</span>
        </a>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
        <button
          onClick={() => onTabChange('globe')}
          className={`flex items-center gap-2 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'globe'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Globe2 className="w-4 h-4" />
          <span>3D-Karte</span>
        </button>

        <button
          onClick={() => onTabChange('connections')}
          className={`flex items-center gap-2 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'connections'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Verbindungen</span>
        </button>

        <button
          onClick={() => onTabChange('packets')}
          className={`flex items-center gap-2 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'packets'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live-Traffic</span>
        </button>

        <button
          onClick={() => onTabChange('whois')}
          className={`flex items-center gap-2 transition-colors pb-0.5 border-b-2 ${
            activeTab === 'whois'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>WHOIS & Routing</span>
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSimulation}
          className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors flex items-center gap-2 border ${
            isSimulating
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
              : 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
          }`}
          title="Echtzeit-Traffic Stream pausieren oder fortsetzen"
        >
          <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'animate-pulse text-emerald-400' : 'text-amber-400'}`} />
          <span className="hidden sm:inline">{isSimulating ? 'TRAFFIC: LIVE' : 'TRAFFIC: PAUSIERT'}</span>
        </button>

        <button
          onClick={onOpenScanModal}
          className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-all shadow-[0_0_15px_-3px_#22d3ee] flex items-center gap-1.5 whitespace-nowrap active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>IP / Domain scannen</span>
        </button>
      </div>
    </header>
  );
};
