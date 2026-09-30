import React, { useState } from 'react';
import { X, Search, Globe, Shield, Terminal, Loader2, ArrowRight } from 'lucide-react';
import { analyzeCustomEndpoint } from '../services/networkData';
import { NetworkConnection } from '../types/network';

interface ScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddConnection: (newConn: NetworkConnection) => void;
}

export const ScanModal: React.FC<ScanModalProps> = ({
  isOpen,
  onClose,
  onAddConnection,
}) => {
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');

  if (!isOpen) return null;

  const handleScan = async (targetQuery?: string) => {
    const input = targetQuery || query;
    if (!input.trim()) return;

    setIsScanning(true);
    setScanStatus('DNS-over-HTTPS Auflösung via Cloudflare Edge...');

    try {
      await new Promise(r => setTimeout(r, 600));
      setScanStatus('Traceroute Hop-by-Hop Latenzen & ASN abfragen...');
      await new Promise(r => setTimeout(r, 700));
      setScanStatus('WHOIS & TLS Zertifikatskette verifizieren...');
      await new Promise(r => setTimeout(r, 500));

      const newConn = await analyzeCustomEndpoint(input);
      onAddConnection(newConn);
      setIsScanning(false);
      setScanStatus('');
      setQuery('');
      onClose();
    } catch (err) {
      console.error(err);
      setIsScanning(false);
      setScanStatus('Fehler beim Scannen des Endpunkts.');
    }
  };

  const quickPresets = [
    { label: 'Cloudflare', target: 'cloudflare.com' },
    { label: 'GitHub API', target: 'api.github.com' },
    { label: 'Wikipedia EU', target: 'de.wikipedia.org' },
    { label: 'Hetzner Cloud', target: 'hetzner.com' },
    { label: 'Google DNS', target: '8.8.8.8' },
    { label: 'Heise Online', target: 'heise.de' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold font-display text-white tracking-wide">
              Neues Ziel / Host analysieren & erfassen
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="space-y-3">
          <label className="text-xs font-mono text-slate-400 block">
            Domain, Hostname oder IP-Adresse:
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                disabled={isScanning}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleScan();
                }}
                placeholder="z.B. heise.de, api.github.com oder 1.1.1.1"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono transition-colors"
              />
            </div>

            <button
              onClick={() => handleScan()}
              disabled={isScanning || !query.trim()}
              className="px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-medium text-xs rounded-xl transition-all shadow-[0_0_15px_-3px_#22d3ee] flex items-center gap-1.5 whitespace-nowrap active:scale-95"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Scannt...</span>
                </>
              ) : (
                <>
                  <span>Scannen</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Status Message */}
          {isScanning && (
            <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2 animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400 shrink-0" />
              <span>{scanStatus}</span>
            </div>
          )}
        </div>

        {/* Quick presets */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
            Schnell-Auswahl Test-Endpunkte:
          </span>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map(preset => (
              <button
                key={preset.target}
                disabled={isScanning}
                onClick={() => handleScan(preset.target)}
                className="px-2.5 py-1.5 text-xs font-mono rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors disabled:opacity-50"
              >
                {preset.label} ({preset.target})
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
