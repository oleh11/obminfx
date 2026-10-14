import React, { useState, useMemo } from 'react';
import { Search, Check, Star, X, ArrowRightLeft, Sparkles } from 'lucide-react';
import { ALL_CURRENCIES, getCurrencyMeta } from '../data/currencies';
import { CurrencyType, Currency } from '../types/currency';
import { StorageService } from '../services/storageService';

interface SelectBaseCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBaseCurrency: string;
  onSelectBaseCurrency: (code: string) => void;
  favoriteCurrencies: string[];
  availableCurrencies?: Currency[];
}

export const SelectBaseCurrencyModal: React.FC<SelectBaseCurrencyModalProps> = ({
  isOpen,
  onClose,
  currentBaseCurrency,
  onSelectBaseCurrency,
  favoriteCurrencies,
  availableCurrencies = ALL_CURRENCIES
}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'fiat' | 'crypto' | 'commodity'>('all');

  const currentMeta = getCurrencyMeta(currentBaseCurrency);

  const { favoritesList, alphabeticalList } = useMemo(() => {
    const list = availableCurrencies && availableCurrencies.length > 0 ? availableCurrencies : ALL_CURRENCIES;
    const term = search.trim().toLowerCase();

    const filtered = list.filter((c) => {
      const matchesSearch =
        !term ||
        c.code.toLowerCase().includes(term) ||
        c.name.toLowerCase().includes(term) ||
        c.country.toLowerCase().includes(term);

      if (!matchesSearch) return false;

      if (selectedFilter === 'favorites') return favoriteCurrencies.includes(c.code);
      if (selectedFilter === 'all') return true;
      return c.type === selectedFilter;
    });

    const sorted = [...filtered].sort((a, b) => a.code.localeCompare(b.code));
    const favs = sorted.filter(c => favoriteCurrencies.includes(c.code));
    const others = sorted.filter(c => !favoriteCurrencies.includes(c.code));

    return { favoritesList: favs, alphabeticalList: others };
  }, [availableCurrencies, search, selectedFilter, favoriteCurrencies]);

  if (!isOpen) return null;

  const handleSelect = (code: string) => {
    StorageService.triggerHaptic();
    onSelectBaseCurrency(code);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-0 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[#141722] border border-white/10 rounded-t-[32px] sm:rounded-[32px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4FF00]/15 border border-[#D4FF00]/30 flex items-center justify-center text-[#D4FF00]">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Select Default Currency</h2>
              <p className="text-xs text-slate-400">All conversions will calculate from this base</p>
            </div>
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

        {/* Current Active Base Card */}
        <div className="px-4 pt-3 pb-1">
          <div className="p-3 rounded-2xl bg-[#0d1017] border border-[#D4FF00]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentMeta.flag}</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Current Default:</span>
                  <span className="font-black text-sm text-white">{currentMeta.code}</span>
                  <span className="text-xs text-[#D4FF00] font-mono font-bold">({currentMeta.symbol})</span>
                </div>
                <p className="text-[11px] text-slate-400">{currentMeta.name} &bull; {currentMeta.country}</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-[#D4FF00]/20 text-[#D4FF00] border border-[#D4FF00]/30">
              Active
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="p-4 space-y-3 bg-[#0d1017]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or country (e.g. USD, EUR, CAD, VND)..."
              className="w-full bg-[#181c28] border border-white/10 rounded-[20px] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4FF00]/50"
              autoFocus
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {(['all', 'favorites', 'fiat', 'crypto', 'commodity'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  StorageService.triggerHaptic();
                  setSelectedFilter(filter);
                }}
                className={'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-all ' + (selectedFilter === filter ? 'bg-[#D4FF00] text-slate-950 shadow-sm' : 'bg-[#181c28] text-slate-400 hover:text-slate-200 border border-white/5')}
              >
                {filter === 'all' ? 'All (A-Z)' : filter === 'favorites' ? `⭐ Favorites (${favoriteCurrencies.length})` : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Favorites Group at the Top */}
          {favoritesList.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-[#D4FF00]">
                <Star className="w-3.5 h-3.5 fill-[#D4FF00]" />
                <span>Favorites</span>
              </div>
              <div className="divide-y divide-white/5 border border-[#D4FF00]/25 rounded-[24px] bg-[#181c28]/60 overflow-hidden">
                {favoritesList.map((curr) => {
                  const isCurrent = curr.code === currentBaseCurrency;
                  return (
                    <div
                      key={'fav-' + curr.code}
                      onClick={() => handleSelect(curr.code)}
                      className={'p-3.5 flex items-center justify-between cursor-pointer transition-all ' + (isCurrent ? 'bg-[#D4FF00]/15' : 'hover:bg-[#1f2436]')}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{curr.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{curr.code}</span>
                            <span className="text-xs text-[#D4FF00] font-mono font-bold">({curr.symbol})</span>
                          </div>
                          <p className="text-xs text-slate-400">{curr.name} &bull; {curr.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <div className="w-8 h-8 rounded-full bg-[#D4FF00] flex items-center justify-center text-slate-950 shadow-md">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : (
                          <button className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 bg-[#161a24] hover:bg-[#202634] border border-white/10 transition-all">
                            Select
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alphabetical Remaining Currencies */}
          <div className="space-y-1.5">
            <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
              <span>All Currencies (A &rarr; Z)</span>
            </div>
            <div className="divide-y divide-white/5 border border-white/5 rounded-[24px] bg-[#181c28]/40 overflow-hidden">
              {alphabeticalList.map((curr) => {
                const isCurrent = curr.code === currentBaseCurrency;
                return (
                  <div
                    key={'all-' + curr.code}
                    onClick={() => handleSelect(curr.code)}
                    className={'p-3.5 flex items-center justify-between cursor-pointer transition-all ' + (isCurrent ? 'bg-[#D4FF00]/15' : 'hover:bg-[#1f2436]')}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{curr.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{curr.code}</span>
                          <span className="text-xs text-[#D4FF00] font-mono font-bold">({curr.symbol})</span>
                        </div>
                        <p className="text-xs text-slate-400">{curr.name} &bull; {curr.country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent ? (
                        <div className="w-8 h-8 rounded-full bg-[#D4FF00] flex items-center justify-center text-slate-950 shadow-md">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <button className="px-3 py-1.5 rounded-full text-xs font-bold text-slate-300 bg-[#161a24] hover:bg-[#202634] border border-white/10 transition-all">
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#0d1017] flex justify-between items-center">
          <p className="text-xs text-slate-400">
            Tap any currency to set as default base
          </p>
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="px-5 py-2 rounded-full bg-[#181c28] hover:bg-[#222838] text-slate-300 font-bold text-xs transition-all border border-white/10"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
