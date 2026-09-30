import React, { useState } from 'react';
import { NetworkConnection } from '../types/network';
import { Shield, Search, Database, ExternalLink, Copy, Check, Server, Globe2 } from 'lucide-react';

interface WhoisHubViewProps {
  connections: NetworkConnection[];
  onSelectConnection: (conn: NetworkConnection) => void;
}

export const WhoisHubView: React.FC<WhoisHubViewProps> = ({
  connections,
  onSelectConnection,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = connections.filter(c => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      c.whois.asn.toLowerCase().includes(q) ||
      c.whois.asnOrg.toLowerCase().includes(q) ||
      c.whois.cidr.toLowerCase().includes(q) ||
      c.host.toLowerCase().includes(q) ||
      c.ip.toLowerCase().includes(q)
    );
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-base font-bold font-display text-white tracking-wide">
              Globales WHOIS- & ASN-Register
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Zentrale Auswertung aller Autonomen Systeme (ASNs), IP-Präfixe und Betreiber-Identitäten
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ASN, Betreiber, IP oder CIDR suchen..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 font-mono"
          />
        </div>
      </div>

      {/* Grid of WHOIS Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((conn) => (
          <div
            key={conn.id}
            className="p-5 bg-slate-950/60 border border-slate-800/90 rounded-xl space-y-4 hover:border-cyan-500/40 transition-colors shadow-lg"
          >
            {/* Header info */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold text-cyan-400 tracking-wide block">
                  {conn.whois.asn}
                </span>
                <h3 className="text-sm font-bold text-white font-display truncate max-w-[260px]">
                  {conn.whois.asnOrg}
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {conn.host} · {conn.ip}
                </span>
              </div>

              <button
                onClick={() =>
                  handleCopy(
                    conn.id,
                    `ASN: ${conn.whois.asn}\nOrg: ${conn.whois.asnOrg}\nCIDR: ${conn.whois.cidr}\nIP: ${conn.ip}`
                  )
                }
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                title="Eintrag kopieren"
              >
                {copiedId === conn.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/40 p-3 rounded-lg border border-slate-800/60">
              <div>
                <span className="text-slate-500 text-[10px] block">CIDR-Block:</span>
                <span className="text-violet-300 font-semibold">{conn.whois.cidr}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">RIR Registrar:</span>
                <span className="text-slate-200">{conn.whois.registrar}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Standort:</span>
                <span className="text-slate-200">{conn.city}, {conn.countryCode}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Abuse Kontakt:</span>
                <span className="text-cyan-400 truncate block">{conn.whois.abuseContact}</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-xs">
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Reputation: {conn.whois.reputationScore}%</span>
              </span>

              <button
                onClick={() => onSelectConnection(conn)}
                className="px-3 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/30 rounded-lg transition-colors"
              >
                Traceroute & Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
