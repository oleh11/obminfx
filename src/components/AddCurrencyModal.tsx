import React, { useState, useMemo } from 'react';
import { Search, Plus, Check, Star, X } from 'lucide-react';
import { ALL_CURRENCIES } from '../data/currencies';
import { CurrencyType, Currency } from '../types/currency';
import { StorageService } from '../services/storageService';

interface AddCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  pinnedCurrencies: string[];
  onToggleCurrency: (code: string) => void;
  favoriteCurrencies: string[];
  onToggleFavorite: (code: string) => void;
  availableCurrencies?: Currency[];
}

export const AddCurrencyModal: React.FC<AddCurrencyModalProps> = ({
  isOpen,
  onClose,
  pinnedCurrencies,
  onToggleCurrency,
  favoriteCurrencies,
  onToggleFavorite,
  availableCurrencies = ALL_CURRENCIES
}) => {
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'favorites' | 'fiat' | 'crypto' | 'commodity'>('all');

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

    // Alphabetical sort by Currency Code
    const sorted = [...filtered].sort((a, b) => a.code.localeCompare(b.code));

    // Split into Favorites (top) and Others
    const favs = sorted.filter(c => favoriteCurrencies.includes(c.code));
    const others = sorted.filter(c => !favoriteCurrencies.includes(c.code));

    return { favoritesList: favs, alphabeticalList: others };
  }, [availableCurrencies, search, selectedFilter, favoriteCurrencies]);

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
              <Plus className="w-5 h-5 text-[#E2F163]" />
              Add Currencies
            </h2>
            <p className="text-xs text-slate-400">
              Alphabetized &bull; {favoriteCurrencies.length} ⭐ favorites &bull; {pinnedCurrencies.length} active
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

        {/* Search & Filter Bar */}
        <div className="p-4 space-y-3 bg-[#0d1017]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Vietnam (VND), Canada (CAD), Euro..."
              className="w-full bg-[#181c28] border border-white/5 rounded-[20px] pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#E2F163]/50"
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
                className={'px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap capitalize transition-all ' + (selectedFilter === filter ? 'bg-[#E2F163] text-slate-950 shadow-sm' : 'bg-[#181c28] text-slate-400 hover:text-slate-200 border border-white/5')}
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
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-black uppercase tracking-wider text-[#E2F163]">
                <Star className="w-3.5 h-3.5 fill-[#E2F163]" />
                <span>Favorites (Pinned to Top)</span>
              </div>
              <div className="divide-y divide-white/5 border border-[#E2F163]/25 rounded-[24px] bg-[#181c28]/60 overflow-hidden">
                {favoritesList.map((curr) => {
                  const isPinned = pinnedCurrencies.includes(curr.code);
                  return (
                    <div
                      key={'fav-' + curr.code}
                      className="p-3 flex items-center justify-between hover:bg-[#1f2436] transition-colors"
                    >
                      <div 
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          StorageService.triggerHaptic();
                          onToggleCurrency(curr.code);
                        }}
                      >
                        <span className="text-2xl">{curr.flag}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-white">{curr.code}</span>
                            <span className="text-xs text-[#E2F163] font-mono font-bold">({curr.symbol})</span>
                          </div>
                          <p className="text-xs text-slate-400">{curr.name} &bull; {curr.country}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            StorageService.triggerHaptic();
                            onToggleFavorite(curr.code);
                          }}
                          className="p-2 rounded-full text-[#E2F163] hover:bg-[#E2F163]/15 transition-colors"
                          title="Favorite"
                        >
                          <Star className="w-4 h-4 fill-[#E2F163]" />
                        </button>
                        <button
                          onClick={() => {
                            StorageService.triggerHaptic();
                            onToggleCurrency(curr.code);
                          }}
                          className={'p-2 rounded-full transition-all ' + (isPinned ? 'bg-[#E2F163] text-slate-950 shadow-sm' : 'bg-[#181c28] text-slate-400 hover:text-white border border-white/5')}
                        >
                          {isPinned ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                        </button>
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
              <span>All Currencies (Alphabetical A &rarr; Z)</span>
            </div>
            <div className="divide-y divide-white/5 border border-white/5 rounded-[24px] bg-[#181c28]/40 overflow-hidden">
              {alphabeticalList.map((curr) => {
                const isPinned = pinnedCurrencies.includes(curr.code);
                return (
                  <div
                    key={'all-' + curr.code}
                    className="p-3 flex items-center justify-between hover:bg-[#1f2436] transition-colors"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => {
                        StorageService.triggerHaptic();
                        onToggleCurrency(curr.code);
                      }}
                    >
                      <span className="text-2xl">{curr.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-white">{curr.code}</span>
                          <span className="text-xs text-[#E2F163] font-mono font-bold">({curr.symbol})</span>
                        </div>
                        <p className="text-xs text-slate-400">{curr.name} &bull; {curr.country}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          StorageService.triggerHaptic();
                          onToggleFavorite(curr.code);
                        }}
                        className="p-2 rounded-full text-slate-500 hover:text-[#E2F163] hover:bg-[#E2F163]/15 transition-colors"
                        title="Add to Favorites"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          StorageService.triggerHaptic();
                          onToggleCurrency(curr.code);
                        }}
                        className={'p-2 rounded-full transition-all ' + (isPinned ? 'bg-[#E2F163] text-slate-950 shadow-sm' : 'bg-[#181c28] text-slate-400 hover:text-white border border-white/5')}
                      >
                        {isPinned ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0d1017] flex justify-end">
          <button
            onClick={() => {
              StorageService.triggerHaptic();
              onClose();
            }}
            className="px-5 py-2.5 rounded-full bg-[#E2F163] hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-[#E2F163]/25"
          >
            Done ({pinnedCurrencies.length} Selected)
          </button>
        </div>
      </div>
    </div>
  );
};
