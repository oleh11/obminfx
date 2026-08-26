import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { ConverterTab } from './components/ConverterTab';
import { BankFeeCalculatorTab } from './components/BankFeeCalculatorTab';
import { HistoricalChartsTab } from './components/HistoricalChartsTab';
import { SourcesTab } from './components/SourcesTab';
import { BottomNavigation, AppTabType } from './components/BottomNavigation';
import { AddCurrencyModal } from './components/AddCurrencyModal';
import { SourceSelectorModal } from './components/SourceSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { RateService } from './services/rateService';
import { StorageService, DEFAULT_FAVORITES } from './services/storageService';
import { RateSourceId, ExchangeRateData } from './types/currency';
import { DEFAULT_PINNED_CURRENCIES } from './data/currencies';

export const App: React.FC = () => {
  // Navigation & Modal states
  const [activeTab, setActiveTab] = useState<AppTabType>('converter');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // App core conversion states
  const [baseCurrency, setBaseCurrency] = useState<string>(() => StorageService.getBaseCurrency() || 'USD');
  const [targetCurrency, setTargetCurrency] = useState<string>(() => StorageService.getTargetCurrency() || 'UAH');
  const [baseAmount, setBaseAmount] = useState<string>('100.00');
  const [bankFeePct, setBankFeePct] = useState<number>(() => StorageService.getBankFeePct());
  const [activeSourceId, setActiveSourceId] = useState<RateSourceId>(() => StorageService.getActiveSource());
  const [pinnedCurrencies, setPinnedCurrencies] = useState<string[]>(() => StorageService.getPinnedCurrencies());
  const [favoriteCurrencies, setFavoriteCurrencies] = useState<string[]>(() => StorageService.getFavoriteCurrencies());

  // Exchange rate data, last updated timestamp & network states
  const [rateData, setRateData] = useState<ExchangeRateData | null>(null);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Online / Offline listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch exchange rates for active source
  const loadRates = useCallback(async (sourceId: RateSourceId, forceRefresh: boolean = false) => {
    setIsRefreshing(true);
    try {
      const data = await RateService.getRates(sourceId, forceRefresh);
      setRateData(data);
      setLastUpdatedTime(new Date(data.timestamp || Date.now()));
    } catch (err) {
      console.error('Error fetching rates', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch rates on source change or mount
  useEffect(() => { 
    loadRates(activeSourceId); 
  }, [activeSourceId, loadRates]);

  // Handlers
  const handleSelectSource = (newSourceId: RateSourceId) => {
    setActiveSourceId(newSourceId);
    StorageService.setActiveSource(newSourceId);
  };

  const handleSelectBaseCurrency = (code: string) => {
    setBaseCurrency(code);
    StorageService.setBaseCurrency(code);
    if (!pinnedCurrencies.includes(code)) {
      const updated = [code, ...pinnedCurrencies];
      setPinnedCurrencies(updated);
      StorageService.setPinnedCurrencies(updated);
    }
  };

  const handleTogglePinnedCurrency = (code: string) => {
    let updated: string[];
    if (pinnedCurrencies.includes(code)) {
      updated = pinnedCurrencies.filter(c => c !== code);
    } else {
      updated = [...pinnedCurrencies, code];
    }
    setPinnedCurrencies(updated);
    StorageService.setPinnedCurrencies(updated);
  };

  const handleRemovePinnedCurrency = (code: string) => {
    const updated = pinnedCurrencies.filter(c => c !== code);
    setPinnedCurrencies(updated);
    StorageService.setPinnedCurrencies(updated);
  };

  const handleToggleFavorite = (code: string) => {
    const updated = StorageService.toggleFavoriteCurrency(code);
    setFavoriteCurrencies(updated);
  };

  const handleBankFeeChange = (fee: number) => {
    setBankFeePct(fee);
    StorageService.setBankFeePct(fee);
  };

  const handleResetDefaults = () => {
    setPinnedCurrencies(DEFAULT_PINNED_CURRENCIES);
    StorageService.setPinnedCurrencies(DEFAULT_PINNED_CURRENCIES);
    setFavoriteCurrencies(DEFAULT_FAVORITES);
    StorageService.setFavoriteCurrencies(DEFAULT_FAVORITES);
    setBankFeePct(2.0);
    StorageService.setBankFeePct(2.0);
    setBaseCurrency('USD');
    StorageService.setBaseCurrency('USD');
    setActiveSourceId('ecb');
    StorageService.setActiveSource('ecb');
    loadRates('ecb', true);
  };

  return (
    <div className="min-h-screen bg-[#0a0c12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        activeSourceId={activeSourceId}
        onOpenSourceModal={() => setIsSourceModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onRefreshRates={() => loadRates(activeSourceId, true)}
        isRefreshing={isRefreshing}
        isOnline={isOnline}
        lastUpdatedTime={lastUpdatedTime}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 overflow-y-auto w-full max-w-2xl mx-auto w-full pb-24">
        {activeTab === 'converter' && (
          <ConverterTab
            baseCurrency={baseCurrency}
            onSelectBaseCurrency={handleSelectBaseCurrency}
            baseAmount={baseAmount}
            onAmountChange={setBaseAmount}
            pinnedCurrencies={pinnedCurrencies}
            onRemovePinnedCurrency={handleRemovePinnedCurrency}
            favoriteCurrencies={favoriteCurrencies}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenSourceModal={() => setIsSourceModalOpen(true)}
            rateData={rateData}
            bankFeePct={bankFeePct}
            onBankFeeChange={handleBankFeeChange}
            onNavigateToFeeCalc={() => setActiveTab('fee_calculator')}
            onNavigateToTrends={(from, to) => {
              setBaseCurrency(from);
              setTargetCurrency(to);
              setActiveTab('trends');
            }}
            lastUpdatedTime={lastUpdatedTime}
          />
        )}

        {activeTab === 'fee_calculator' && (
          <BankFeeCalculatorTab
            rateData={rateData}
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            onSelectBaseCurrency={setBaseCurrency}
            onSelectTargetCurrency={setTargetCurrency}
            bankFeePct={bankFeePct}
            onBankFeeChange={handleBankFeeChange}
          />
        )}

        {activeTab === 'trends' && (
          <HistoricalChartsTab
            initialFrom={baseCurrency || 'USD'}
            initialTo={targetCurrency || 'UAH'}
          />
        )}

        {activeTab === 'sources' && (
          <SourcesTab
            activeSourceId={activeSourceId}
            onSelectSource={handleSelectSource}
            baseCurrency={baseCurrency}
            targetCurrency={targetCurrency}
            onRefreshAll={() => loadRates(activeSourceId, true)}
            isRefreshing={isRefreshing}
            rateData={rateData}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bankFeePct={bankFeePct}
      />

      {/* Modals */}
      <AddCurrencyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        pinnedCurrencies={pinnedCurrencies}
        onToggleCurrency={handleTogglePinnedCurrency}
        favoriteCurrencies={favoriteCurrencies}
        onToggleFavorite={handleToggleFavorite}
        availableCurrencies={RateService.getAvailableCurrenciesFromRates(rateData)}
      />

      <SourceSelectorModal
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        activeSourceId={activeSourceId}
        onSelectSource={handleSelectSource}
        baseCurrency={baseCurrency}
        targetCurrency={targetCurrency}
        activeRateData={rateData}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        baseCurrency={baseCurrency}
        onSelectBaseCurrency={handleSelectBaseCurrency}
        bankFeePct={bankFeePct}
        onBankFeeChange={handleBankFeeChange}
        theme="dark"
        onToggleTheme={() => {}}
        onClose={() => setIsSettingsModalOpen(false)}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};
