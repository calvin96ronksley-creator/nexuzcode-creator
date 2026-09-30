import React, { useState, useEffect } from 'react';
import { NetworkConnection } from '../types/network';
import { 
  X, Globe, Shield, Activity, Radio, Copy, Check, 
  MapPin, Lock, Play, Layers, Compass, ExternalLink, RefreshCw
} from 'lucide-react';

interface ConnectionDetailDrawerProps {
  connection: NetworkConnection | null;
  onClose: () => void;
  onSelectOnGlobe?: (conn: NetworkConnection) => void;
}

type DetailTab = 'traceroute' | 'whois' | 'traffic';

export const ConnectionDetailDrawer: React.FC<ConnectionDetailDrawerProps> = ({
  connection,
  onClose,
  onSelectOnGlobe,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('traceroute');
  const [copied, setCopied] = useState<boolean>(false);
  const [isPinging, setIsPinging] = useState<boolean>(false);
  const [pingResults, setPingResults] = useState<{ seq: number; timeMs: number }[]>([]);
  const [trafficHistory, setTrafficHistory] = useState<{ rx: number; tx: number; time: string }[]>([]);

  // Reset tab and state when connection changes
  useEffect(() => {
    if (!connection) return;
    setPingResults([]);
    setIsPinging(false);
    
    // Seed initial traffic history for oscilloscope
    const initialHist = [];
    const now = Date.now();
    for (let i = 12; i >= 0; i--) {
      const t = new Date(now - i * 1000).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const variance = (Math.random() - 0.5) * 0.3;
      initialHist.push({
        rx: Math.max(10, connection.rxKbps * (1 + variance)),
        tx: Math.max(5, connection.txKbps * (1 + variance)),
        time: t,
      });
    }
    setTrafficHistory(initialHist);
  }, [connection?.id]);

  // Traffic pulse loop for oscilloscope
  useEffect(() => {
    if (!connection) return;
    const interval = setInterval(() => {
      const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const variance = (Math.random() - 0.5) * 0.35;
      const newRx = Math.max(10, connection.rxKbps * (1 + variance));
      const newTx = Math.max(5, connection.txKbps * (1 + variance));

      setTrafficHistory(prev => [...prev.slice(1), { rx: newRx, tx: newTx, time: now }]);
    }, 1000);

    return () => clearInterval(interval);
  }, [connection]);

  if (!connection) return null;

  const handleCopyWhois = () => {
    const text = JSON.stringify(
      {
        host: connection.host,
        ip: connection.ip,
        asn: connection.whois.asn,
        organization: connection.whois.asnOrg,
        cidr: connection.whois.cidr,
        registrar: connection.whois.registrar,
        abuseContact: connection.whois.abuseContact,
        dnsServers: connection.whois.dnsServers,
      },
      null,
      2
    );
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunPingBurst = () => {
    setIsPinging(true);
    setPingResults([]);
    let seq = 1;
    const burstInterval = setInterval(() => {
      if (seq > 4) {
        clearInterval(burstInterval);
        setIsPinging(false);
        return;
      }
      const jitter = (Math.random() - 0.5) * (connection.jitterMs * 2);
      const measuredTime = Math.max(1.2, connection.latencyMs + jitter);
      setPingResults(prev => [...prev, { seq, timeMs: Number(measuredTime.toFixed(1)) }]);
      seq++;
    }, 350);
  };

  const maxTrafficVal = Math.max(100, ...trafficHistory.map(h => Math.max(h.rx, h.tx)));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] lg:w-[540px] bg-slate-950/95 backdrop-blur-2xl border-l border-cyan-500/30 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.8)] text-slate-200 transition-all">
      {/* Top Header */}
      <div className="p-5 border-b border-slate-800 bg-slate-900/60 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <h2 className="text-base font-bold font-display text-white tracking-wide truncate max-w-[320px]">
              {connection.name}
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="text-cyan-400 font-semibold">{connection.ip}</span>
            <span>·</span>
            <span>Port {connection.port}</span>
            <span>·</span>
            <span className="text-slate-300">{connection.city}, {connection.countryCode}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onSelectOnGlobe && (
            <button
              onClick={() => onSelectOnGlobe(connection)}
              title="Auf Globus zentrieren"
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-colors"
            >
              <Compass className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-3 divide-x divide-slate-800/80 border-b border-slate-800 bg-slate-950/50 p-3 text-center">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Latenz (RTT)</span>
          <span className={`text-sm font-bold font-mono ${connection.latencyMs > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {connection.latencyMs.toFixed(1)} ms
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Protokoll</span>
          <span className="text-sm font-bold font-mono text-cyan-400">
            {connection.protocol}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block uppercase font-mono">Sicherheit</span>
          <span className="text-sm font-bold font-mono text-slate-200">
            {connection.whois.reputationScore}% Clean
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-900/30 px-4">
        <button
          onClick={() => setActiveTab('traceroute')}
          className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'traceroute'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Traceroute & Pfad</span>
        </button>

        <button
          onClick={() => setActiveTab('whois')}
          className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'whois'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>WHOIS & ASN</span>
        </button>

        <button
          onClick={() => setActiveTab('traffic')}
          className={`px-4 py-3 text-xs font-medium flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'traffic'
              ? 'text-cyan-400 border-cyan-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Echtzeit-Traffic</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* TAB 1: TRACEROUTE & ROUTE TRACE */}
        {activeTab === 'traceroute' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  Hop-by-Hop Netzwerkpfad
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vom lokalen Gateway über globale Tier-1 Backbones zum Zielhost
                </p>
              </div>

              <button
                onClick={handleRunPingBurst}
                disabled={isPinging}
                className="px-2.5 py-1.5 text-[11px] font-mono rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isPinging ? 'animate-spin' : ''}`} />
                <span>{isPinging ? 'Pingt...' : 'Ping Test'}</span>
              </button>
            </div>

            {/* Live Ping Burst Results if active */}
            {pingResults.length > 0 && (
              <div className="p-3 bg-slate-900/80 border border-cyan-500/30 rounded-xl space-y-1.5 font-mono text-xs">
                <span className="text-[11px] text-cyan-400 font-semibold block">
                  Ping ICMP Echo Statistik zu {connection.ip}:
                </span>
                <div className="grid grid-cols-4 gap-2 text-[11px]">
                  {pingResults.map(p => (
                    <div key={p.seq} className="p-1.5 bg-slate-950/70 rounded border border-slate-800 text-center">
                      <span className="text-slate-500 text-[9px] block">SEQ {p.seq}</span>
                      <span className="text-emerald-400 font-bold">{p.timeMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hop Pipeline Diagram */}
            <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-gradient-to-b before:from-cyan-500 before:via-violet-500 before:to-emerald-500">
              {connection.tracerouteHops.map((hop) => {
                const isLast = hop.hopNumber === connection.tracerouteHops.length;
                return (
                  <div key={hop.hopNumber} className="relative group">
                    {/* Circle Node on Timeline */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border ${
                        isLast
                          ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_10px_#10b981]'
                          : hop.hopNumber === 1
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {hop.hopNumber}
                    </div>

                    {/* Hop Card */}
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-cyan-500/30 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-white truncate max-w-[240px]">
                          {hop.hostname}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                          {hop.latencyMs.toFixed(1)} ms
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] font-mono text-slate-400">
                        <span className="text-cyan-300">{hop.ip}</span>
                        <span>·</span>
                        <span>{hop.carrier}</span>
                        <span>·</span>
                        <span className="text-slate-500">{hop.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Geographical Vector Coordinates */}
            <div className="p-3.5 bg-slate-900/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Geokoordinaten:</span>
              </div>
              <span className="text-slate-200">
                {connection.lat.toFixed(4)}° N, {connection.lng.toFixed(4)}° E
              </span>
            </div>
          </div>
        )}

        {/* TAB 2: WHOIS & ASN INTELLIGENCE */}
        {activeTab === 'whois' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                  WHOIS Registry & ASN Auswertung
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Offizielle Registrierungs- und Netzwerkidentifikationsdaten
                </p>
              </div>

              <button
                onClick={handleCopyWhois}
                className="px-2.5 py-1.5 text-[11px] font-mono rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Kopiert' : 'JSON kopieren'}</span>
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Autonomes System (ASN):</span>
                <span className="text-cyan-300 font-bold">{connection.whois.asn}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Organisation / Betreiber:</span>
                <span className="text-white font-medium text-right max-w-[260px] truncate">{connection.whois.asnOrg}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Netzwerkname (netname):</span>
                <span className="text-slate-300">{connection.whois.netName}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">CIDR IP-Bereich:</span>
                <span className="text-violet-300 font-bold">{connection.whois.cidr}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Registrar (RIR):</span>
                <span className="text-slate-300">{connection.whois.registrar}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Registriert am:</span>
                <span className="text-slate-400">{connection.whois.registeredDate}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Letztes Update:</span>
                <span className="text-slate-400">{connection.whois.updatedDate}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Abuse-Kontakt:</span>
                <span className="text-cyan-400">{connection.whois.abuseContact}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-500">Authoritative DNS-Server:</span>
                <span className="text-slate-300">{connection.whois.dnsServers.join(', ')}</span>
              </div>

              <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                <span className="text-slate-500 block mb-1">Registrierungsadresse:</span>
                <span className="text-slate-300 block">{connection.whois.orgAddress}</span>
              </div>
            </div>

            {/* Security Audit Note */}
            <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-cyan-300 block">Sicherheitsbewertung: Keine Anomalien</span>
                <span className="text-[11px] text-slate-400">{connection.whois.statusComment}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ECHTZEIT-TRAFFIC & OSZILLOSKOP */}
        {activeTab === 'traffic' && (
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">
                Echtzeit-Durchsatz & Protokoll-Inspektor
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Live Bandbreitenanalyse (Inbound Rx vs Outbound Tx)
              </p>
            </div>

            {/* Mini Oscilloscope / Sparkline Graph */}
            <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span className="text-cyan-300 font-semibold">Rx: {connection.rxKbps.toFixed(1)} KB/s</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-400" />
                  <span className="text-violet-300 font-semibold">Tx: {connection.txKbps.toFixed(1)} KB/s</span>
                </div>
              </div>

              {/* Bar/Line visualization */}
              <div className="h-32 w-full flex items-end gap-1.5 pt-4 pb-1 border-b border-slate-800">
                {trafficHistory.map((item, idx) => {
                  const rxHeightPercent = Math.min(100, (item.rx / maxTrafficVal) * 100);
                  const txHeightPercent = Math.min(100, (item.tx / maxTrafficVal) * 100);
                  return (
                    <div key={idx} className="flex-1 h-full flex items-end justify-center gap-0.5 group relative">
                      {/* Rx Bar */}
                      <div
                        style={{ height: `${rxHeightPercent}%` }}
                        className="w-1.5 bg-cyan-400 rounded-t-sm transition-all duration-300 group-hover:bg-cyan-300"
                      />
                      {/* Tx Bar */}
                      <div
                        style={{ height: `${txHeightPercent}%` }}
                        className="w-1.5 bg-violet-500 rounded-t-sm transition-all duration-300 group-hover:bg-violet-400"
                      />

                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full mb-1 hidden group-hover:block z-20 p-1 bg-slate-950 border border-slate-700 text-[9px] font-mono text-white rounded whitespace-nowrap">
                        Rx: {item.rx.toFixed(0)}k | Tx: {item.tx.toFixed(0)}k
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>Vor 12 Sek.</span>
                <span>Aktuell</span>
              </div>
            </div>

            {/* Cryptographic Session details */}
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Verschlüsselungs-Parameter (TLS Handshake)</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Protokoll:</span>
                  <span className="text-cyan-300">{connection.encryption.protocol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cipher-Suite:</span>
                  <span className="text-emerald-300">{connection.encryption.cipher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Zertifikatsaussteller:</span>
                  <span className="text-slate-300">{connection.encryption.certIssuer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gültigkeit:</span>
                  <span className="text-slate-400">noch {connection.encryption.certValidDays} Tage</span>
                </div>
              </div>
            </div>

            {/* Packet Statistics */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Gesamtpakete</span>
                <span className="text-white font-bold text-sm tabular-nums">
                  {connection.totalPackets.toLocaleString('de-DE')}
                </span>
              </div>

              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800">
                <span className="text-slate-500 text-[10px] block uppercase">Paketverlustrate</span>
                <span className={`font-bold text-sm tabular-nums ${connection.packetLossRate > 0.4 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {connection.packetLossRate.toFixed(2)} %
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
