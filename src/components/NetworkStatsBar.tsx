import React from 'react';
import { ArrowDown, ArrowUp, Zap, ShieldCheck, Search, Filter } from 'lucide-react';
import { ProtocolType } from '../types/network';

interface NetworkStatsBarProps {
  totalConnections: number;
  totalRxKbps: number;
  totalTxKbps: number;
  avgLatencyMs: number;
  activeProtocolFilter: ProtocolType | 'ALL';
  onFilterChange: (proto: ProtocolType | 'ALL') => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const NetworkStatsBar: React.FC<NetworkStatsBarProps> = ({
  totalConnections,
  totalRxKbps,
  totalTxKbps,
  avgLatencyMs,
  activeProtocolFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}) => {
  const formatSpeed = (kbps: number) => {
    if (kbps > 1024) {
      return `${(kbps / 1024).toFixed(2)} MB/s`;
    }
    return `${kbps.toFixed(1)} KB/s`;
  };

  const protocols: (ProtocolType | 'ALL')[] = ['ALL', 'HTTPS', 'QUIC', 'DNS', 'WSS', 'gRPC'];

  return (
    <div className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 text-xs">
      {/* Telemetry Numbers without pills - clean typographic separators */}
      <div className="flex flex-wrap items-center gap-6 font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Knoten:</span>
          <span className="text-cyan-400 font-bold tabular-nums text-sm">{totalConnections}</span>
          <span className="text-slate-600">aktiv</span>
        </div>

        <span className="text-slate-800 hidden sm:inline">|</span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Download:</span>
          <div className="flex items-center text-cyan-300 gap-1 font-semibold tabular-nums">
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>{formatSpeed(totalRxKbps)}</span>
          </div>
        </div>

        <span className="text-slate-800 hidden sm:inline">|</span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Upload:</span>
          <div className="flex items-center text-violet-300 gap-1 font-semibold tabular-nums">
            <ArrowUp className="w-3.5 h-3.5 text-violet-400" />
            <span>{formatSpeed(totalTxKbps)}</span>
          </div>
        </div>

        <span className="text-slate-800 hidden sm:inline">|</span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Ø Latenz:</span>
          <div className="flex items-center text-emerald-300 gap-1 font-semibold tabular-nums">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>{avgLatencyMs.toFixed(1)} ms</span>
          </div>
        </div>

        <span className="text-slate-800 hidden lg:inline">|</span>

        <div className="hidden lg:flex items-center gap-2 text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>TLS 1.3 Verschlüsselt</span>
        </div>
      </div>

      {/* Interactive Controls: Search + Protocol Segmented Filter (Allowed interactive buttons) */}
      <div className="flex items-center gap-3 w-full lg:w-auto">
        {/* Search */}
        <div className="relative flex-1 lg:w-56">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="IP, Host, Stadt suchen..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono transition-colors"
          />
        </div>

        {/* Protocol filter segmented tabs */}
        <div className="flex items-center p-0.5 bg-slate-900/90 border border-slate-800 rounded-lg overflow-x-auto">
          <div className="px-2 py-1 text-[11px] text-slate-500 hidden xl:flex items-center gap-1 border-r border-slate-800">
            <Filter className="w-3 h-3" />
            <span>Protokoll:</span>
          </div>
          {protocols.map(proto => (
            <button
              key={proto}
              onClick={() => onFilterChange(proto)}
              className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors whitespace-nowrap ${
                activeProtocolFilter === proto
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {proto}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
