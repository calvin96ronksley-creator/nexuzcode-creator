import React, { useState, useRef, useEffect } from 'react';
import { LivePacket, ProtocolType } from '../types/network';
import { Play, Pause, Trash2, ArrowDownLeft, ArrowUpRight, Search, Terminal } from 'lucide-react';

interface PacketStreamViewProps {
  packets: LivePacket[];
  isStreaming: boolean;
  onToggleStreaming: () => void;
  onClearPackets: () => void;
}

export const PacketStreamView: React.FC<PacketStreamViewProps> = ({
  packets,
  isStreaming,
  onToggleStreaming,
  onClearPackets,
}) => {
  const [filterDirection, setFilterDirection] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [selectedPacket, setSelectedPacket] = useState<LivePacket | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);

  // Auto scroll to bottom when new packets arrive if enabled
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [packets, autoScroll]);

  const filteredPackets = packets.filter(p => {
    if (filterDirection !== 'ALL' && p.direction !== filterDirection) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      return p.targetHost.toLowerCase().includes(q) || p.protocol.toLowerCase().includes(q) || p.snippet.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden p-6 space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold font-display text-white tracking-wide">
              Echtzeit-Paket- und Datenstrom-Inspektor
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Live Stream der übertragenen TCP-, QUIC- und TLS-Pakete im globalen Netz
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleStreaming}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition-colors flex items-center gap-1.5 ${
              isStreaming
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/50'
            }`}
          >
            {isStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isStreaming ? 'Stream anhalten' : 'Stream starten'}</span>
          </button>

          <button
            onClick={onClearPackets}
            title="Log leeren"
            className="p-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilterDirection('ALL')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              filterDirection === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Alle ({packets.length})
          </button>
          <button
            onClick={() => setFilterDirection('IN')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
              filterDirection === 'IN'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3 h-3 text-cyan-400" />
            <span>Inbound</span>
          </button>
          <button
            onClick={() => setFilterDirection('OUT')}
            className={`px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
              filterDirection === 'OUT'
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3 h-3 text-violet-400" />
            <span>Outbound</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pakete filtern..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Main Packet Console Window */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0 overflow-hidden">
        {/* Stream List */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-slate-950/80 border border-slate-800 rounded-xl p-2 font-mono text-xs divide-y divide-slate-900"
        >
          {filteredPackets.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              Keine Pakete im aktuellen Filter vorhanden.
            </div>
          ) : (
            filteredPackets.map((pkt) => {
              const isSelected = selectedPacket?.id === pkt.id;
              return (
                <div
                  key={pkt.id}
                  onClick={() => setSelectedPacket(pkt)}
                  className={`p-2 rounded-lg cursor-pointer transition-colors flex items-center justify-between gap-3 hover:bg-slate-900/80 ${
                    isSelected ? 'bg-cyan-950/40 border border-cyan-500/40' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-500 text-[11px] tabular-nums">
                      {pkt.timestamp}
                    </span>

                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 ${
                        pkt.direction === 'IN'
                          ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/40'
                          : 'bg-violet-950/60 text-violet-300 border border-violet-800/40'
                      }`}
                    >
                      {pkt.direction === 'IN' ? 'RX' : 'TX'}
                    </span>

                    <span className="text-cyan-400 font-semibold">{pkt.protocol}</span>

                    <span className="text-white truncate max-w-[180px] sm:max-w-[260px]">
                      {pkt.targetHost}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0">
                    <span className="hidden md:inline text-slate-500 font-mono">
                      [{pkt.flags.join(', ')}]
                    </span>
                    <span className="text-slate-300 tabular-nums">{pkt.bytes} Bytes</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Packet Deep Inspection Panel */}
        {selectedPacket && (
          <div className="w-full lg:w-80 bg-slate-900/60 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-3 shrink-0 flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                Paket-Header Inspektion
              </span>
              <span className="text-cyan-400">{selectedPacket.id}</span>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Zeitstempel:</span>
                <span className="text-white">{selectedPacket.timestamp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Richtung:</span>
                <span className={selectedPacket.direction === 'IN' ? 'text-cyan-400' : 'text-violet-400'}>
                  {selectedPacket.direction === 'IN' ? 'Eingehend (Download)' : 'Ausgehend (Upload)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zielhost:</span>
                <span className="text-cyan-300 truncate max-w-[160px]">{selectedPacket.targetHost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Protokoll:</span>
                <span className="text-white">{selectedPacket.protocol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Frame-Größe:</span>
                <span className="text-white">{selectedPacket.bytes} Bytes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">TCP Flags:</span>
                <span className="text-emerald-400">{selectedPacket.flags.join(' · ')}</span>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 block mb-1">Payload Rohdaten (Hex / ASCII):</span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[10px] text-cyan-200 break-all leading-relaxed">
                  {selectedPacket.snippet}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
