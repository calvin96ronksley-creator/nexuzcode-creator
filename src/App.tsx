import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TopNav, ActiveTab } from './components/TopNav';
import { NetworkStatsBar } from './components/NetworkStatsBar';
import { NetworkGlobe3D } from './components/NetworkGlobe3D';
import { ConnectionDetailDrawer } from './components/ConnectionDetailDrawer';
import { ConnectionsListView } from './components/ConnectionsListView';
import { PacketStreamView } from './components/PacketStreamView';
import { WhoisHubView } from './components/WhoisHubView';
import { ScanModal } from './components/ScanModal';
import { INITIAL_CONNECTIONS, LOCAL_ORIGIN, generateRandomPacket } from './services/networkData';
import { NetworkConnection, ProtocolType, LivePacket } from './types/network';

export default function App() {
  const [connections, setConnections] = useState<NetworkConnection[]>(INITIAL_CONNECTIONS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('globe');
  const [selectedConnection, setSelectedConnection] = useState<NetworkConnection | null>(null);
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null);
  const [isScanModalOpen, setIsScanModalOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [activeProtocolFilter, setActiveProtocolFilter] = useState<ProtocolType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [livePackets, setLivePackets] = useState<LivePacket[]>([]);

  // Seed initial packets
  useEffect(() => {
    const initialPackets: LivePacket[] = [];
    for (let i = 0; i < 18; i++) {
      initialPackets.push(generateRandomPacket(connections));
    }
    setLivePackets(initialPackets);
  }, []);

  // Real-time packet stream ticker & dynamic bandwidth fluctuation
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      // 1. Generate live packet
      setLivePackets(prev => {
        const nextPkt = generateRandomPacket(connections);
        return [...prev.slice(-150), nextPkt];
      });

      // 2. Fluctuate bandwidth and slight latency jitter for realism
      setConnections(prev =>
        prev.map(c => {
          const jitter = (Math.random() - 0.5) * 0.4;
          const rxFluct = (Math.random() - 0.5) * 25;
          const txFluct = (Math.random() - 0.5) * 12;
          return {
            ...c,
            latencyMs: Math.max(1.5, c.latencyMs + jitter * 0.2),
            rxKbps: Math.max(20, c.rxKbps + rxFluct),
            txKbps: Math.max(10, c.txKbps + txFluct),
            totalPackets: c.totalPackets + Math.floor(Math.random() * 3) + 1,
          };
        })
      );
    }, 1200);

    return () => clearInterval(interval);
  }, [isSimulating, connections]);

  // Filter connections by protocol & search query
  const filteredConnections = useMemo(() => {
    return connections.filter(conn => {
      if (activeProtocolFilter !== 'ALL' && conn.protocol !== activeProtocolFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          conn.name.toLowerCase().includes(q) ||
          conn.host.toLowerCase().includes(q) ||
          conn.ip.toLowerCase().includes(q) ||
          conn.city.toLowerCase().includes(q) ||
          conn.whois.asn.toLowerCase().includes(q) ||
          conn.whois.asnOrg.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [connections, activeProtocolFilter, searchQuery]);

  // Aggregate stats
  const totalRxKbps = useMemo(() => {
    return connections.reduce((acc, c) => acc + c.rxKbps, 0);
  }, [connections]);

  const totalTxKbps = useMemo(() => {
    return connections.reduce((acc, c) => acc + c.txKbps, 0);
  }, [connections]);

  const avgLatencyMs = useMemo(() => {
    if (connections.length === 0) return 0;
    return connections.reduce((acc, c) => acc + c.latencyMs, 0) / connections.length;
  }, [connections]);

  const handleSelectConnection = (conn: NetworkConnection) => {
    setSelectedConnection(conn);
  };

  const handleAddConnection = (newConn: NetworkConnection) => {
    setConnections(prev => [newConn, ...prev]);
    setSelectedConnection(newConn);
    setActiveTab('globe');
  };

  const handleFocusOnGlobe = (conn: NetworkConnection) => {
    setSelectedConnection(conn);
    setActiveTab('globe');
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#030712] text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Header following anti-slop rules */}
      <TopNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenScanModal={() => setIsScanModalOpen(true)}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
      />

      {/* 2. Global Telemetry Bar */}
      <NetworkStatsBar
        totalConnections={connections.length}
        totalRxKbps={totalRxKbps}
        totalTxKbps={totalTxKbps}
        avgLatencyMs={avgLatencyMs}
        activeProtocolFilter={activeProtocolFilter}
        onFilterChange={setActiveProtocolFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 3. Main Viewport Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {activeTab === 'globe' && (
          <div className="relative w-full h-full">
            {/* 3D WebGL Globe Canvas */}
            <NetworkGlobe3D
              connections={filteredConnections}
              localOrigin={LOCAL_ORIGIN}
              selectedConnection={selectedConnection}
              onSelectConnection={handleSelectConnection}
              hoveredConnectionId={hoveredConnectionId}
              onHoverConnection={setHoveredConnectionId}
            />

            {/* Floating Top-Right Mini Overlay HUD (Quick Node Cards) */}
            <div className="absolute top-4 right-4 z-20 hidden md:flex flex-col gap-2 max-w-[280px] pointer-events-none">
              <div className="p-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-xl pointer-events-auto shadow-2xl">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-mono text-cyan-400 font-semibold tracking-wide">
                    ROUTING-FEED
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {filteredConnections.length} AKTIV
                  </span>
                </div>

                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                  {filteredConnections.slice(0, 5).map(c => {
                    const isSelected = selectedConnection?.id === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConnection(c)}
                        className={`w-full text-left p-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between gap-2 border ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-500/50 text-white'
                            : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-cyan-500/30'
                        }`}
                      >
                        <div className="truncate">
                          <span className="font-semibold block truncate">{c.city}</span>
                          <span className="text-[10px] text-slate-500 truncate block">{c.ip}</span>
                        </div>
                        <span className={`text-[11px] font-bold shrink-0 ${c.latencyMs > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {c.latencyMs.toFixed(0)}ms
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Floating Bottom Center Helper */}
            <div className="absolute bottom-6 right-6 z-20 hidden lg:flex items-center gap-3 px-3 py-2 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Klicke auf beliebige Knoten zur Hop-by-Hop Traceroute & WHOIS Analyse</span>
            </div>
          </div>
        )}

        {activeTab === 'connections' && (
          <ConnectionsListView
            connections={filteredConnections}
            selectedConnection={selectedConnection}
            onSelectConnection={handleSelectConnection}
            onFocusOnGlobe={handleFocusOnGlobe}
          />
        )}

        {activeTab === 'packets' && (
          <PacketStreamView
            packets={livePackets}
            isStreaming={isSimulating}
            onToggleStreaming={() => setIsSimulating(!isSimulating)}
            onClearPackets={() => setLivePackets([])}
          />
        )}

        {activeTab === 'whois' && (
          <WhoisHubView
            connections={filteredConnections}
            onSelectConnection={handleSelectConnection}
          />
        )}
      </main>

      {/* 4. Slide-out Connection Detail & Traceroute Drawer */}
      <ConnectionDetailDrawer
        connection={selectedConnection}
        onClose={() => setSelectedConnection(null)}
        onSelectOnGlobe={handleFocusOnGlobe}
      />

      {/* 5. Scan & Add Target Modal */}
      <ScanModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        onAddConnection={handleAddConnection}
      />
    </div>
  );
}
