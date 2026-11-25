import React, { Suspense, lazy, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ConverterTab } from './components/ConverterTab';
import { BottomNavigation, AppTabType } from './components/BottomNavigation';
import { AddCurrencyModal } from './components/AddCurrencyModal';
import { SelectBaseCurrencyModal } from './components/SelectBaseCurrencyModal';
import { SourceSelectorModal } from './components/SourceSelectorModal';
import { SettingsModal } from './components/SettingsModal';
import { AppTour } from './components/AppTour';
import { RateService } from './services/rateService';
import { StorageService, DEFAULT_FAVORITES } from './services/storageService';
import { RateSourceId, ExchangeRateData } from './types/currency';
import { DEFAULT_PINNED_CURRENCIES } from './data/currencies';
import { listenForSharedText, listenForLaunchAction } from './services/shareTarget';
import { listenForBackPress, setNativeOverlayOpen } from './services/appActions';
import { pairCurrency, scannerCurrencyOptions, defaultScannerCurrency } from './services/converterOrder';

const BankFeeCalculatorTab = lazy(() =>
  import('./components/BankFeeCalculatorTab').then(m => ({ default: m.BankFeeCalculatorTab }))
);
const HistoricalChartsTab = lazy(() =>
  import('./components/HistoricalChartsTab').then(m => ({ default: m.HistoricalChartsTab }))
);
const SourcesTab = lazy(() =>
  import('./components/SourcesTab').then(m => ({ default: m.SourcesTab }))
);
const PriceScanner = lazy(() =>
  import('./components/PriceScanner').then(m => ({ default: m.PriceScanner }))
);

const TabFallback: React.FC = () => (
  <div className="space-y-4 w-full py-2" aria-hidden="true">
    <div className="h-24 rounded-[24px] bg-card/70 animate-pulse" />
    <div className="h-56 rounded-[24px] bg-card/70 animate-pulse" />
  </div>
);

export const App: React.FC = () => {
  // Navigation & Modal states
  const [activeTab, setActiveTab] = useState<AppTabType>('converter');
  // A bank notification or SMS shared to the app opens Check my card with it
  const [sharedText, setSharedText] = useState<{ text: string; nonce: number } | null>(null);
  const [requestedFeeMode, setRequestedFeeMode] = useState<{ mode: 'simulate' | 'check' | 'atm'; nonce: number } | null>(null);
  useEffect(() => listenForSharedText(text => {
    setSharedText({ text, nonce: Date.now() });
    setActiveTab('fee_calculator');
  }), []);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isSelectBaseModalOpen, setIsSelectBaseModalOpen] = useState<boolean>(false);
  const [isSourceModalOpen, setIsSourceModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  // First launch walkthrough; can be shown again from Settings
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isTourOpen, setIsTourOpen] = useState<boolean>(() => !StorageService.getTourSeen());

  useEffect(() => listenForLaunchAction(action => {
    if (action === 'scan') {
      setIsScannerOpen(true);
    } else if (action === 'check_card') {
      setRequestedFeeMode({ mode: 'check', nonce: Date.now() });
      setActiveTab('fee_calculator');
    }
  }), []);

  // App core conversion states
  const [baseCurrency, setBaseCurrency] = useState<string>(() => StorageService.getBaseCurrency() || 'USD');
  // The user's own (card) currency for Bank Fee, ATM refunds and the scanner; follows the base when not set
  const [homeChoice, setHomeChoice] = useState<string>(() => StorageService.getHomeCurrency());
  const homeCurrency = homeChoice || baseCurrency;
  // Pair opened from a converter card; doesn't change the saved base currency
  const [trendsPair, setTrendsPair] = useState<{ from: string; to: string } | null>(null);
  const [baseAmount, setBaseAmount] = useState<string>('100.00');
  const [bankFeePct, setBankFeePct] = useState<number>(() => StorageService.getBankFeePct());
  const [activeSourceId, setActiveSourceId] = useState<RateSourceId>(() => StorageService.getActiveSource());
  const [pinnedCurrencies, setPinnedCurrencies] = useState<string[]>(() => StorageService.getPinnedCurrencies());
  const [favoriteCurrencies, setFavoriteCurrencies] = useState<string[]>(() => StorageService.getFavoriteCurrencies());

  // Bank Fee, Trends and Sources open on the Converter's base and its top currency (favorites first)
  const targetCurrency = pairCurrency(pinnedCurrencies, favoriteCurrencies, baseCurrency);

  // Exchange rate data, last updated timestamp & network states
  const [rateData, setRateData] = useState<ExchangeRateData | null>(null);
  const rateDataRef = useRef<ExchangeRateData | null>(null);
  rateDataRef.current = rateData;
  const activeSourceRef = useRef<RateSourceId>(activeSourceId);
  activeSourceRef.current = activeSourceId;

  // Price tag currencies for the scanner: excludes homeCurrency (never baseCurrency), travels seamlessly
  const availableCodes = useMemo(
    () => RateService.getAvailableCurrenciesFromRates(rateData).map(c => c.code),
    [rateData]
  );
  const scannerCurrencies = useMemo(
    () => scannerCurrencyOptions(pinnedCurrencies, favoriteCurrencies, baseCurrency, homeCurrency, availableCodes),
    [pinnedCurrencies, favoriteCurrencies, baseCurrency, homeCurrency, availableCodes]
  );
  const scannerDefaultCurrency = useMemo(
    () => defaultScannerCurrency(pinnedCurrencies, favoriteCurrencies, baseCurrency, homeCurrency),
    [pinnedCurrencies, favoriteCurrencies, baseCurrency, homeCurrency]
  );

  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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

  // Online / Offline & visibility auto-refresh listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (RateService.isStale(rateDataRef.current)) {
        loadRates(activeSourceRef.current, true);
      }
    };
    const handleOffline = () => setIsOnline(false);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && RateService.isStale(rateDataRef.current)) {
        loadRates(activeSourceRef.current, false);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadRates]);

  // Fetch rates on source change or mount
  useEffect(() => {
    loadRates(activeSourceId);
  }, [activeSourceId, loadRates]);

  // Overlay back-button & Escape dismissal
  const hasOverlay = isScannerOpen || isTourOpen || isAddModalOpen || isSelectBaseModalOpen || isSourceModalOpen || isSettingsModalOpen;
  useEffect(() => {
    setNativeOverlayOpen(hasOverlay);
  }, [hasOverlay]);

  const closeTopOverlay = useCallback(() => {
    if (isScannerOpen) setIsScannerOpen(false);
    else if (isTourOpen) {
      StorageService.setTourSeen();
      setIsTourOpen(false);
      setActiveTab('converter');
    } else if (isAddModalOpen) setIsAddModalOpen(false);
    else if (isSelectBaseModalOpen) setIsSelectBaseModalOpen(false);
    else if (isSourceModalOpen) setIsSourceModalOpen(false);
    else if (isSettingsModalOpen) setIsSettingsModalOpen(false);
  }, [isScannerOpen, isTourOpen, isAddModalOpen, isSelectBaseModalOpen, isSourceModalOpen, isSettingsModalOpen]);

  useEffect(() => {
    const unlistenBack = listenForBackPress(closeTopOverlay);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasOverlay) {
        closeTopOverlay();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      unlistenBack();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeTopOverlay, hasOverlay]);

  // Handlers
  const handleSelectSource = (newSourceId: RateSourceId) => {
    setActiveSourceId(newSourceId);
    StorageService.setActiveSource(newSourceId);
  };

  const handleSelectBaseCurrency = (code: string) => {
    if (code === baseCurrency) return;
    const oldBase = baseCurrency;
    setBaseCurrency(code);
    StorageService.setBaseCurrency(code);

    // Remove the new base from the converted list, and ensure the old base stays available
    let updated = pinnedCurrencies.filter(c => c !== code);
    if (!updated.includes(oldBase)) {
      updated = [oldBase, ...updated];
    }
    setPinnedCurrencies(updated);
    StorageService.setPinnedCurrencies(updated);
  };

  const handleTabChange = (tab: AppTabType) => {
    setTrendsPair(null);
    setActiveTab(tab);
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
    setHomeChoice('');
    StorageService.setHomeCurrency('');
    setActiveSourceId('ecb');
    StorageService.setActiveSource('ecb');
    loadRates('ecb', true);
  };

  return (
    <div className="min-h-screen text-ink flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeSourceId={activeSourceId}
        onOpenSourceModal={() => setIsSourceModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onRefreshRates={() => loadRates(activeSourceId, true)}
        isRefreshing={isRefreshing}
        isOnline={isOnline}
        lastUpdatedTime={lastUpdatedTime}
        rateDate={rateData?.date ?? null}
        isFallback={!!rateData?.isFallback}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-4 overflow-y-auto w-full max-w-2xl mx-auto pb-24">
        {activeTab === 'converter' && (
          <ConverterTab
            onOpenScanner={() => setIsScannerOpen(true)}
            baseCurrency={baseCurrency}
            onSelectBaseCurrency={handleSelectBaseCurrency}
            baseAmount={baseAmount}
            onAmountChange={setBaseAmount}
            pinnedCurrencies={pinnedCurrencies}
            onRemovePinnedCurrency={handleRemovePinnedCurrency}
            favoriteCurrencies={favoriteCurrencies}
            onToggleFavorite={handleToggleFavorite}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenSelectBaseModal={() => setIsSelectBaseModalOpen(true)}
            onOpenSourceModal={() => setIsSourceModalOpen(true)}
            rateData={rateData}
            bankFeePct={bankFeePct}
            onBankFeeChange={handleBankFeeChange}
            onNavigateToFeeCalc={() => setActiveTab('fee_calculator')}
            onNavigateToTrends={(from, to) => {
              setTrendsPair({ from, to });
              setActiveTab('trends');
            }}
            lastUpdatedTime={lastUpdatedTime}
          />
        )}

        {activeTab === 'fee_calculator' && (
          <Suspense fallback={<TabFallback />}>
            <BankFeeCalculatorTab
              rateData={rateData}
              baseCurrency={baseCurrency}
              homeCurrency={homeCurrency}
              targetCurrency={targetCurrency}
              bankFeePct={bankFeePct}
              onBankFeeChange={handleBankFeeChange}
              sharedText={sharedText}
              requestedMode={requestedFeeMode}
            />
          </Suspense>
        )}

        {activeTab === 'trends' && (
          <Suspense fallback={<TabFallback />}>
            <HistoricalChartsTab
              initialFrom={trendsPair?.from || baseCurrency}
              initialTo={trendsPair?.to || targetCurrency}
            />
          </Suspense>
        )}

        {activeTab === 'sources' && (
          <Suspense fallback={<TabFallback />}>
            <SourcesTab
              activeSourceId={activeSourceId}
              onSelectSource={handleSelectSource}
              baseCurrency={baseCurrency}
              targetCurrency={targetCurrency}
              onRefreshAll={() => loadRates(activeSourceId, true)}
              isRefreshing={isRefreshing}
              rateData={rateData}
            />
          </Suspense>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
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

      <SelectBaseCurrencyModal
        isOpen={isSelectBaseModalOpen}
        onClose={() => setIsSelectBaseModalOpen(false)}
        currentBaseCurrency={baseCurrency}
        onSelectBaseCurrency={handleSelectBaseCurrency}
        favoriteCurrencies={favoriteCurrencies}
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
        homeChoice={homeChoice}
        onHomeChoiceChange={code => { setHomeChoice(code); StorageService.setHomeCurrency(code); }}
        bankFeePct={bankFeePct}
        onBankFeeChange={handleBankFeeChange}
        onClose={() => setIsSettingsModalOpen(false)}
        onResetDefaults={handleResetDefaults}
        onOpenSelectBaseModal={() => setIsSelectBaseModalOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
      />

      {isScannerOpen && (
        <Suspense fallback={<div className="fixed inset-0 z-[70] bg-black" />}>
          <PriceScanner
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
            rateData={rateData}
            homeCurrency={homeCurrency}
            defaultPriceCurrency={scannerDefaultCurrency}
            currencyCodes={scannerCurrencies}
            bankFeePct={bankFeePct}
          />
        </Suspense>
      )}

      <AppTour
        isOpen={isTourOpen}
        onShowTab={setActiveTab}
        onClose={() => {
          StorageService.setTourSeen();
          setIsTourOpen(false);
        }}
      />
    </div>
  );
};
