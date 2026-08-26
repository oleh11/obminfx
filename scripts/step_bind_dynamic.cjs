const fs = require('fs');

const addModal = `import React, { useState, useMemo } from 'react';
import { Search, Plus, Check, X } from 'lucide-react';
import { ALL_CURRENCIES } from '../data/currencies';
import { CurrencyType, Currency } from '../types/currency';
import { StorageService } from '../services/storageService';

interface AddCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedCurrencies: string[];
  onToggleCurrency: (code: string) => void;
  availableCurrencies?: Currency[];
}

export const AddCurrencyModal: React.FC<AddCurrencyModalProps> = ({
  isOpen,
  onClose,
  pinnedCurrencies,
  onToggleCurrency,
  availableCurrencies = ALL_CURRENCIES
}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'fiat' | 'crypto' | 'commodity'>('all');

  const filtered = useMemo(() => {
    const list = availableCurrencies && availableCurrencies.length > 0 ? availableCurrencies : ALL_CURRENCIES;
    const term = search.trim().toLowerCase();
    return list.filter((c) => {
      const matchesSearch =
        !term ||
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.country.toLowerCase().includes(term);
      const matchesFilter = selectedFilter === 'all' || c.type === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [availableCurrencies, search, selectedFilter]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#141722] border border-white/5 rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add Currencies
            </h2>
            <p className="text-xs text-slate-400">
              {availableCurrencies.length} dynamic world currencies &bull; {pinnedCurrencies.length} active
            </p>
          </div>
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="p-2 rounded-full bg-[#1e2333] hover:bg-[#2a3147] text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 space-y-3 bg-[#0d1017]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vietnam (VND), Canada (CAD), Euro...",
              className="w-full bg-[#181c28] border border-white/5 rounded-[20px] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              autoFocus
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex gap-2">
            {(['all', 'fiat', 'crypto', 'commodity'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  StorageService.triggerHaptic();
                  setSelectedFilter(filter);
                }}
                className={'px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ' + (selectedFilter === filter ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-[#181c28] text-slate-400 hover:text-slate-200 border border-white/5')}
              >
                {filter === 'all' ? 'All Currencies' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-white/5 space-y-1">
          {filtered.map((curr) => {
            const isPinned = pinnedCurrencies.includes(curr.code);
            return (
              <div
                key={curr.code}
                onClick={() => {
                  StorageService.triggerHaptic();
                  onToggleCurrency(curr.code);
                }}
                className={'p-3 rounded-[20px] flex items-center justify-between cursor-pointer transition-all ' + (isPinned ? 'bg-amber-500/10 border border-amber-500/25' : 'hover:bg-[#1c2130]')}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{curr.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-white">{curr.code}</span>
                      <span className="text-xs text-amber-400 font-mono font-bold">({curr.symbol})</span>
                    </div>
                    <p className="text-xs text-slate-400">{curr.name} &bull; {curr.country}</p>
                  </div>
                </div>

                <button
                  className={'p-2 rounded-full transition-all ' + (isPinned ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-[#181c28] text-slate-400 hover:text-white border border-white/5')}
                >
                  {isPinned ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0d1017] flex justify-end">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-amber-500/25"
          >
            Done ({pinnedCurrencies.length} Selected)
          </button>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync('src/components/AddCurrencyModal.tsx', addModal, 'utf8');

// Update App.tsx to pass dynamic availableCurrencies to AddCurrencyModal
let appCode = fs.readFileSync('src/App.tsx', 'utf8');
if (!appCode.includes('availableCurrencies=')) {
  appCode = appCode.replace(
    '<AddCurrencyModal\n        isOpen={isAddModalOpen}',
    '<AddCurrencyModal\n        isOpen={isAddModalOpen}\n        availableCurrencies={RateService.getAvailableCurrenciesFromRates(rateData)}'
  );
  appCode = appCode.replace(
    '<AddCurrencyModal\r\n        isOpen={isAddModalOpen}',
    '<AddCurrencyModal\r\n        isOpen={isAddModalOpen}\r\n        availableCurrencies={RateService.getAvailableCurrenciesFromRates(rateData)}'
  );
}
fs.writeFileSync('src/App.tsx', appCode, 'utf8');

console.log('AddCurrencyModal and App.tsx updated with dynamic currency binding');
