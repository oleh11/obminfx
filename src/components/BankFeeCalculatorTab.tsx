import React, { useEffect, useMemo, useState } from 'react';
import { 
  Percent, ShieldCheck, ArrowRightLeft, 
  Sparkles, DollarSign, Receipt, Info, CheckCircle2, ChevronRight, Landmark 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExchangeRateData } from '../types/currency';
import { ALL_CURRENCIES, CARD_FEE_PRESETS } from '../data/currencies';
import { useT } from '../i18n';
import { RateService } from '../services/rateService';
import { calculateBankFeeConversion, formatCurrencyAmount, formatRate } from '../services/feeCalculator';
import { StorageService } from '../services/storageService';
import { CardCostEstimator } from './CardCostEstimator';
import { CardsPanel } from './CardsPanel';
import { SavedCard, loadCards, storeCards, upsertCard, removeCard } from '../services/cardsService';

interface BankFeeCalculatorTabProps {
  rateData: ExchangeRateData | null;
  baseCurrency: string;
  targetCurrency: string;
  onSelectBaseCurrency: (code: string) => void;
  onSelectTargetCurrency: (code: string) => void;
  bankFeePct: number;
  onBankFeeChange: (fee: number) => void;
  /** Text shared to the app (bank message): opens Check my card with it */
  sharedText?: { text: string; nonce: number } | null;
}

export const BankFeeCalculatorTab: React.FC<BankFeeCalculatorTabProps> = ({
  rateData,
  baseCurrency,
  targetCurrency,
  onSelectBaseCurrency,
  onSelectTargetCurrency,
  bankFeePct,
  onBankFeeChange,
  sharedText
}) => {
  const { t, locale, pct, currency } = useT();
  const [transactionAmount, setTransactionAmount] = useState<string>('100');
  const [transactionCurrency, setTransactionCurrency] = useState<string>(targetCurrency || 'EUR');
  const [cardBillingCurrency, setCardBillingCurrency] = useState<string>(baseCurrency || 'USD');
  const [mode, setMode] = useState<'simulate' | 'check'>(sharedText ? 'check' : 'simulate');
  const [cards, setCardsState] = useState<SavedCard[]>(loadCards);
  const setCards = (next: SavedCard[]) => { setCardsState(next); storeCards(next); };

  useEffect(() => { if (sharedText) setMode('check'); }, [sharedText?.nonce]);

  // Currencies a bank message's card amount is likely in: saved cards first, then the user's own currencies
  const cardCurrencies = useMemo(
    () => [...new Set([...cards.map(c => c.currency), baseCurrency, targetCurrency])],
    [cards, baseCurrency, targetCurrency]
  );
  const knownCodes = useMemo(
    () => new Set([...ALL_CURRENCIES.map(c => c.code), ...Object.keys(rateData?.rates || {})]),
    [rateData]
  );

  const amountNum = parseFloat(transactionAmount) || 0;
  const transMeta = currency(transactionCurrency);
  const billMeta = currency(cardBillingCurrency);

  const rawRate = rateData
    ? RateService.calculateRate(transactionCurrency, cardBillingCurrency, rateData)
    : 1.0;

  const feeResult = calculateBankFeeConversion(
    amountNum,
    transactionCurrency,
    cardBillingCurrency,
    rawRate,
    bankFeePct
  );

  const handleSwapCurrencies = () => {
    StorageService.triggerHaptic();
    const temp = transactionCurrency;
    setTransactionCurrency(cardBillingCurrency);
    setCardBillingCurrency(temp);
  };

  const handlePresetSelect = (pct: number) => {
    StorageService.triggerHaptic();
    onBankFeeChange(pct);
    if (pct === 0) {
      try {
        confetti({ particleCount: 40, spread: 55, origin: { y: 0.7 } });
      } catch {}
    }
  };

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto pb-8">
      {/* Header Pill Card */}
      <div className="p-5 rounded-[24px] bg-card border border-line/[0.08] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-accent/[0.06] border border-accent/[0.18] flex items-center justify-center text-accent">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-ink tracking-tight">
              {t('fee.title')}
            </h2>
            <p className="text-xs text-muted font-medium mt-0.5">
              {t('fee.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Mode switch: simulate a fee, or check what a real card payment cost */}
      <div role="tablist" className="p-1 rounded-full bg-card/70 grid grid-cols-2 gap-1">
        {(['simulate', 'check'] as const).map(m => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => { StorageService.triggerHaptic(); setMode(m); }}
            className={'py-2.5 rounded-full text-sm font-bold transition-all whitespace-nowrap ' + (mode === m ? 'bg-accent text-onaccent' : 'text-ink2')}
          >
            {t(m === 'simulate' ? 'fee.modeSimulate' : 'fee.modeCheck')}
          </button>
        ))}
      </div>

      {mode === 'check' ? (
        <CardCostEstimator
          defaultPurchaseCurrency={transactionCurrency}
          homeCurrency={baseCurrency}
          bankFeePct={bankFeePct}
          onUseAsFee={onBankFeeChange}
          cardCurrencies={cardCurrencies}
          knownCodes={knownCodes}
          onSaveCard={c => setCards(upsertCard(cards, c))}
          prefill={sharedText}
        />
      ) : (<>
      {/* Inputs Bento Box */}
      <div className="p-5 rounded-[24px] bg-card border border-line/[0.08] shadow-sm space-y-4">
        {/* Currency Pair Selectors */}
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              {t('fee.foreignPurchase')}
            </label>
            <select
              value={transactionCurrency}
              onChange={(e) => {
                StorageService.triggerHaptic();
                setTransactionCurrency(e.target.value);
              }}
              className="w-full bg-inset border border-line/[0.08] rounded-[18px] px-3 py-2.5 text-xs font-bold text-ink focus:outline-none"
            >
              {[...ALL_CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)).map((c) => (
                <option key={'trans-' + c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwapCurrencies}
            className="mt-4 p-2.5 rounded-full bg-inset hover:bg-inset2 active:scale-90 text-accent border border-line/[0.08] transition-all"
            title={t('fee.swap')}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              {t('fee.cardCurrency')}
            </label>
            <select
              value={cardBillingCurrency}
              onChange={(e) => {
                StorageService.triggerHaptic();
                setCardBillingCurrency(e.target.value);
              }}
              className="w-full bg-inset border border-line/[0.08] rounded-[18px] px-3 py-2.5 text-xs font-bold text-ink focus:outline-none"
            >
              {[...ALL_CURRENCIES].sort((a, b) => a.code.localeCompare(b.code)).map((c) => (
                <option key={'bill-' + c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Transaction Amount Input */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
            {t('fee.purchaseAmount', { code: transMeta.code })}
          </label>
          <div className="flex items-center bg-inset border border-line/[0.08] rounded-[22px] px-4 py-3 focus-within:ring-2 focus-within:ring-amber-500/40">
            <span className="text-accent font-bold text-xl mr-2">{transMeta.symbol}</span>
            <input
              type="number"
              inputMode="decimal"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
              placeholder="100.00"
              className="w-full bg-transparent font-mono font-black text-2xl text-ink focus:outline-none"
            />
          </div>
        </div>

        {/* Bank Fee Slider & Presets */}
        <div className="pt-3 border-t border-line/[0.08] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-accent">
              {t('fee.surchargeRate')}
            </label>
            <span className="font-mono font-black text-xs text-accent bg-accent/[0.06] border border-accent/[0.18] px-2.5 py-0.5 rounded-full">
              {pct(bankFeePct, 1)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(5, Math.ceil(bankFeePct))}
            step="0.1"
            value={bankFeePct}
            onChange={(e) => {
              StorageService.triggerHaptic();
              onBankFeeChange(parseFloat(e.target.value));
            }}
            className="w-full accent-black h-2 bg-inset rounded-lg cursor-pointer"
          />

          {/* Preset Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 pt-1">
            {CARD_FEE_PRESETS.map((preset) => {
              const isSelected = Math.abs(bankFeePct - preset.percentage) < 0.05;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.percentage)}
                  className={'py-2 rounded-[16px] text-center border transition-all ' + (isSelected ? 'bg-accent text-onaccent border-accent font-black shadow-sm' : 'bg-inset text-ink2 border-line/[0.08] hover:bg-inset2 font-bold')}
                >
                  <span className="text-xs block">{pct(preset.percentage)}</span>
                  <span className="text-[9px] opacity-70 block truncate px-1">{t(`preset.${preset.id}.tag`)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Receipt Breakdown Bento Box */}
      <div className="p-5 rounded-[24px] bg-card border border-line/[0.08] shadow-sm space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-line/[0.08]">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-extrabold text-ink">{t('fee.breakdown')}</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-accent bg-inset px-2 py-0.5 rounded-full border border-line/[0.08]">
            {t('fee.interbankSpec')}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center text-ink2">
            <span>{t('fee.wholesale', { from: transMeta.code, to: billMeta.code })}</span>
            <span className="font-mono font-bold text-ink">
              {formatCurrencyAmount(feeResult.convertedBaseAmount, billMeta.decimalPlaces, true, billMeta.symbol, locale)}
            </span>
          </div>

          <div className="flex justify-between items-center text-accent font-semibold">
            <span>{t('fee.processingFee', { pct: pct(bankFeePct, 1) })}</span>
            <span className="font-mono font-bold">
              +{formatCurrencyAmount(feeResult.bankFeeAmount, billMeta.decimalPlaces, true, billMeta.symbol, locale)}
            </span>
          </div>

          <div className="pt-3 border-t border-line/[0.08] flex justify-between items-center">
            <span className="font-extrabold text-sm text-ink">{t('fee.total')}</span>
            <span className="font-mono font-black text-2xl text-emerald-600">
              {formatCurrencyAmount(feeResult.totalBilledAmount, billMeta.decimalPlaces, true, billMeta.symbol, locale)}
            </span>
          </div>

          {/* Effective Rates Sub-card */}
          <div className="mt-2 p-3 rounded-[20px] bg-inset border border-line/[0.08] text-[11px] text-ink2 space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-muted">{t('fee.effectiveRate')}</span>
              <span className="font-bold text-ink">
                1 {transMeta.code} = {formatRate(feeResult.effectiveRate, locale)} {billMeta.code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">{t('fee.reciprocal')}</span>
              <span className="font-bold text-ink">
                1 {billMeta.code} = {formatRate(feeResult.reverseEffectiveRate, locale)} {transMeta.code}
              </span>
            </div>
          </div>
        </div>
      </div>

      <CardsPanel
        cards={cards}
        onAddCard={c => setCards(upsertCard(cards, c))}
        onRemoveCard={id => setCards(removeCard(cards, id))}
        onUseCard={c => { setCardBillingCurrency(c.currency); onBankFeeChange(Math.round(c.feePct * 10) / 10); }}
        amount={amountNum}
        purchaseCurrency={transactionCurrency}
        compareCurrency={baseCurrency}
        rateData={rateData}
      />
      </>)}
    </div>
  );
};
