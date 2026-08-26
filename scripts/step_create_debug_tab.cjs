const fs = require('fs');

const debugTabContent = `import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, Copy, Check, Trash2, 
  Clock, HardDrive, Key, Code, ShieldCheck, 
  Terminal, Download, Cpu, Sparkles 
} from 'lucide-react';
import { ExchangeRateData, RateSourceId } from '../types/currency';
import { AVAILABLE_SOURCES } from '../data/currencies';
import { StorageService } from '../services/storageService';

interface DebugTabProps {
  rateData: ExchangeRateData | null;
  activeSourceId: RateSourceId;
  baseCurrency: string;
  targetCurrency: string;
  pinnedCurrencies: string[];
  favoriteCurrencies: string[];
  onRefreshRates: () => void;
  isRefreshing: boolean;
  lastUpdatedTime: Date | null;
}

export const DebugTab: React.FC<DebugTabProps> = ({
  rateData,
  activeSourceId,
  baseCurrency,
  targetCurrency,
  pinnedCurrencies,
  favoriteCurrencies,
  onRefreshRates,
  isRefreshing,
  lastUpdatedTime
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string>('active_payload');
  const [storageDump, setStorageDump] = useState<Record<string, any>>({});

  const refreshDump = () => {
    setStorageDump(StorageService.getStorageDebugDump());
  };

  useEffect(() => {
    refreshDump();
  }, [rateData, activeSourceId, pinnedCurrencies, favoriteCurrencies]);

  const currentSource = AVAILABLE_SOURCES.find(s => s.id === activeSourceId) || AVAILABLE_SOURCES[0];

  const totalRatesCount = rateData && rateData.rates ? Object.keys(rateData.rates).length : 0;
  const storageKeysCount = Object.keys(storageDump).length;
  const storageEstimatedBytes = JSON.stringify(storageDump).length;

  const getActiveViewContent = () => {
    switch (selectedKey) {
      case 'active_payload':
        return rateData;
      case 'pinned_currencies':
        return { pinnedCurrencies, count: pinnedCurrencies.length };
      case 'favorite_currencies':
        return { favoriteCurrencies, count: favoriteCurrencies.length };
      case 'all_storage_dump':
        return storageDump;
      default:
        return storageDump[selectedKey] || { message: 'No data stored for key: ' + selectedKey };
    }
  };

  const handleCopy = () => {
    StorageService.triggerHaptic();
    const content = JSON.stringify(getActiveViewContent(), null, 2);
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadDump = () => {
    StorageService.triggerHaptic();
    const dump = {
      exportTimestamp: new Date().toISOString(),
      activeSourceId,
      baseCurrency,
      targetCurrency,
      lastUpdatedTime: lastUpdatedTime ? lastUpdatedTime.toISOString() : null,
      activeRateData: rateData,
      localStorageDump: storageDump
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`obminfx_storage_dump_\${Date.now()}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAllStorage = () => {
    StorageService.triggerHaptic();
    if (confirm('Clear all cached exchange rates and reset local storage?')) {
      localStorage.clear();
      refreshDump();
      onRefreshRates();
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-8">
      {/* Header Banner */}
      <div className="p-5 rounded-[28px] bg-[#161a26] border border-white/5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              Data Storage Inspector
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black">
                DEBUG
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Live inspection of exchange rate cache & persistence
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            StorageService.triggerHaptic();
            refreshDump();
            onRefreshRates();
          }}
          disabled={isRefreshing}
          className="p-2.5 rounded-full bg-[#0e111a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5 transition-all disabled:opacity-50"
          title="Force refresh data & cache dump"
        >
          <RefreshCw className={'w-4 h-4 ' + (isRefreshing ? 'animate-spin text-amber-400' : '')} />
        </button>
      </div>

      {/* Telemetry Metrics Bento Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-4 rounded-[24px] bg-[#161a26] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Last Pulled</span>
          </div>
          <p className="text-sm font-black font-mono text-white tracking-tight">
            {lastUpdatedTime ? lastUpdatedTime.toLocaleTimeString() : 'Not Loaded'}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {lastUpdatedTime ? lastUpdatedTime.toLocaleDateString() : '---'}
          </p>
        </div>

        <div className="p-4 rounded-[24px] bg-[#161a26] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Provider</span>
          </div>
          <p className="text-sm font-black text-amber-300 truncate">
            {currentSource.shortName}
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {totalRatesCount} live rates stored
          </p>
        </div>

        <div className="p-4 rounded-[24px] bg-[#161a26] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <HardDrive className="w-3.5 h-3.5 text-amber-400" />
            <span>Storage Size</span>
          </div>
          <p className="text-sm font-black font-mono text-white">
            {(storageEstimatedBytes / 1024).toFixed(2)} KB
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            {storageKeysCount} localStorage keys
          </p>
        </div>

        <div className="p-4 rounded-[24px] bg-[#161a26] border border-white/5 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Watchlist & Favs</span>
          </div>
          <p className="text-sm font-black text-white font-mono">
            {pinnedCurrencies.length} pinned &bull; {favoriteCurrencies.length} favs
          </p>
          <p className="text-[10px] text-slate-400 font-mono">
            Base: {baseCurrency} &rarr; {targetCurrency}
          </p>
        </div>
      </div>

      {/* Storage Key Selector Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black uppercase tracking-wider text-slate-300">
            Inspector View
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            Key: {selectedKey}
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'active_payload', label: 'Active Rate Payload' },
            { id: 'all_storage_dump', label: 'All LocalStorage Dump' },
            { id: 'favorite_currencies', label: 'Favorite Currencies' },
            { id: 'pinned_currencies', label: 'Pinned Watchlist' },
            ...Object.keys(storageDump).map(k => ({ id: k, label: k }))
          ].filter((item, index, self) => index === self.findIndex(t => t.id === item.id)).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                StorageService.triggerHaptic();
                setSelectedKey(tab.id);
              }}
              className={'px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ' + (selectedKey === tab.id ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-[#161a26] text-slate-400 hover:text-slate-200 border border-white/5')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* JSON Viewer Bento Box */}
      <div className="p-5 rounded-[32px] bg-[#161a26] border border-white/5 shadow-xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-black text-white">Raw JSON Payload</h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopy}
              className={'flex items-center gap-1 px-3 py-1 rounded-[14px] text-xs font-bold transition-all ' + (copied ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-[#0e111a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5')}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadDump}
              className="p-1.5 rounded-[14px] bg-[#0e111a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5 transition-colors"
              title="Download full storage state JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <pre className="p-4 rounded-[22px] bg-[#090b10] border border-white/5 text-[11px] font-mono text-amber-300/90 max-h-80 overflow-y-auto overflow-x-auto leading-relaxed selection:bg-amber-500 selection:text-slate-950">
          {JSON.stringify(getActiveViewContent(), null, 2)}
        </pre>
      </div>

      {/* Maintenance Controls */}
      <div className="p-4 rounded-[26px] bg-rose-950/20 border border-rose-900/30 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black text-white">Purge Storage Cache</h4>
          <p className="text-[10px] text-slate-400">Clear all cached provider rates and trigger fresh boot sync</p>
        </div>
        <button
          onClick={handleClearAllStorage}
          className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cache</span>
        </button>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/DebugTab.tsx', debugTabContent, 'utf8');
console.log('DebugTab.tsx written successfully');
