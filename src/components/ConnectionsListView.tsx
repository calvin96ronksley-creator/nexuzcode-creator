import React, { useState } from 'react';
import { NetworkConnection } from '../types/network';
import { ArrowUpDown, Compass, Shield, Activity, ExternalLink, Zap } from 'lucide-react';

interface ConnectionsListViewProps {
  connections: NetworkConnection[];
  selectedConnection: NetworkConnection | null;
  onSelectConnection: (conn: NetworkConnection) => void;
  onFocusOnGlobe: (conn: NetworkConnection) => void;
}

type SortField = 'latencyMs' | 'rxKbps' | 'name' | 'city';
type SortOrder = 'asc' | 'desc';

export const ConnectionsListView: React.FC<ConnectionsListViewProps> = ({
  connections,
  selectedConnection,
  onSelectConnection,
  onFocusOnGlobe,
}) => {
  const [sortField, setSortField] = useState<SortField>('latencyMs');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedConnections = [...connections].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'latencyMs') {
      comparison = a.latencyMs - b.latencyMs;
    } else if (sortField === 'rxKbps') {
      comparison = a.rxKbps - b.rxKbps;
    } else if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'city') {
      comparison = a.city.localeCompare(b.city);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-base font-bold font-display text-white tracking-wide">
            Aktive Netzwerk-Verbindungen & Relays
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Übersicht aller globalen Knotenpunkte, Peering-Schnittstellen und Latenzwerte
          </p>
        </div>
        <div className="text-xs font-mono text-slate-400">
          <span>{connections.length} Endpunkte erfasst</span>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] uppercase tracking-wider select-none">
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span>Knoten & Host</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Protokoll</th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('city')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span>Standort</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('latencyMs')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span>Latenz (RTT)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <button
                    onClick={() => handleSort('rxKbps')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span>Traffic (Rx/Tx)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="py-3 px-4 font-semibold">Autonomes System</th>
                <th className="py-3 px-4 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {sortedConnections.map((conn) => {
                const isSelected = selectedConnection?.id === conn.id;
                return (
                  <tr
                    key={conn.id}
                    onClick={() => onSelectConnection(conn)}
                    className={`cursor-pointer transition-colors hover:bg-cyan-950/20 ${
                      isSelected ? 'bg-cyan-950/40 border-l-2 border-l-cyan-400' : ''
                    }`}
                  >
                    {/* Node & Host */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            conn.status === 'warning'
                              ? 'bg-amber-400 shadow-[0_0_6px_#f59e0b]'
                              : 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
                          }`}
                        />
                        <div>
                          <span className="font-semibold text-white block text-xs">
                            {conn.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {conn.host} · {conn.ip}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Protocol */}
                    <td className="py-3 px-4">
                      <span className="text-cyan-300 font-medium">
                        {conn.protocol}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <span className="text-slate-200">
                        {conn.city}, {conn.countryCode}
                      </span>
                    </td>

                    {/* Latency */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Zap
                          className={`w-3.5 h-3.5 ${
                            conn.latencyMs > 200 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        />
                        <span
                          className={`font-bold tabular-nums ${
                            conn.latencyMs > 200 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {conn.latencyMs.toFixed(1)} ms
                        </span>
                      </div>
                    </td>

                    {/* Bandwidth */}
                    <td className="py-3 px-4">
                      <span className="tabular-nums">
                        ↓ {conn.rxKbps.toFixed(0)}k / ↑ {conn.txKbps.toFixed(0)}k
                      </span>
                    </td>

                    {/* ASN */}
                    <td className="py-3 px-4">
                      <span className="text-slate-400 truncate max-w-[160px] block" title={conn.whois.asnOrg}>
                        {conn.whois.asn} · {conn.whois.asnOrg.split(' ')[0]}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            onSelectConnection(conn);
                            onFocusOnGlobe(conn);
                          }}
                          title="Auf 3D-Globus zentrieren"
                          className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition-colors"
                        >
                          <Compass className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onSelectConnection(conn)}
                          title="Traceroute & WHOIS analysieren"
                          className="px-2.5 py-1 text-[11px] font-sans font-medium rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition-colors whitespace-nowrap"
                        >
                          Analysieren
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
