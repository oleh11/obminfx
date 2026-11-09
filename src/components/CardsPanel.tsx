import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Trophy, WalletCards } from 'lucide-react';
import { ALL_CURRENCIES } from '../data/currencies';
import { useT } from '../i18n';
import { ExchangeRateData } from '../types/currency';
import { RateService } from '../services/rateService';
import { StorageService } from '../services/storageService';
import { formatCurrencyAmount } from '../services/feeCalculator';
import { parseAmount } from '../services/cardCostEstimator';
import { SavedCard, rankCards } from '../services/cardsService';

interface CardsPanelProps {
  cards: SavedCard[];
  onAddCard: (card: { name: string; currency: string; feePct: number }) => void;
  onRemoveCard: (id: string) => void;
  /** Tapping a card makes it the card used in the simulator */
  onUseCard: (card: SavedCard) => void;
  amount: number;
  purchaseCurrency: string;
  /** The user's own currency: costs are compared in it */
  compareCurrency: string;
  rateData: ExchangeRateData | null;
}

const FIAT = [...ALL_CURRENCIES].filter(c => c.type === 'fiat').sort((a, b) => a.code.localeCompare(b.code));

/** "Which card should I pay with?": the user's saved cards, cheapest first for the current purchase */
export const CardsPanel: React.FC<CardsPanelProps> = ({
  cards, onAddCard, onRemoveCard, onUseCard, amount, purchaseCurrency, compareCurrency, rateData,
}) => {
  const { t, lang, locale, pct, currency } = useT();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [cardCurrency, setCardCurrency] = useState(compareCurrency);
  const [feeText, setFeeText] = useState('');

  const ranked = useMemo(() => {
    if (!rateData) return [];
    // Market mid-rate without any card markup: the card's own fee is added on top
    const rate = (from: string, to: string) => RateService.calculateRate(from, to, rateData, false);
    return rankCards(cards, amount, purchaseCurrency, compareCurrency, rate);
  }, [cards, amount, purchaseCurrency, compareCurrency, rateData]);

  const money = (n: number, code: string) => {
    const c = currency(code);
    return formatCurrencyAmount(n, c.decimalPlaces, true, c.symbol, locale);
  };
  const fee = parseAmount(feeText, lang);
  const canAdd = name.trim() !== '' && fee >= 0 && fee <= 20;

  return (
    <div className="p-5 rounded-[24px] bg-card space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-full bg-inset flex items-center justify-center text-ink">
          <WalletCards className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-extrabold text-ink leading-tight">{t('cards.title')}</h3>
          {cards.length > 0 && amount > 0 && (
            <p className="text-xs text-muted mt-0.5">
              {t('cards.subtitle', { amount: money(amount, purchaseCurrency), code: compareCurrency })}
            </p>
          )}
        </div>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-muted leading-relaxed">{t('cards.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {ranked.map((r, i) => (
            <li key={r.card.id} className="flex items-stretch gap-2">
              <button
                onClick={() => { StorageService.triggerHaptic(); onUseCard(r.card); }}
                aria-label={t('cards.use', { name: r.card.name })}
                className={'min-w-0 flex-1 text-left rounded-[16px] px-4 py-3 transition-all active:scale-[0.98] ' + (i === 0 ? 'bg-accent text-onaccent' : 'bg-inset text-ink')}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm truncate flex items-center gap-1.5">
                    {i === 0 && <Trophy className="w-4 h-4 shrink-0" />}{r.card.name}
                  </span>
                  <span className="font-mono font-bold text-sm whitespace-nowrap">{money(r.cost, r.card.currency)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs opacity-75 mt-0.5">
                  <span className="truncate">
                    {r.card.currency} · {r.noConversion ? t('cards.noConversion') : t('cards.fee', { pct: pct(r.card.feePct, 2) })}
                  </span>
                  <span className="whitespace-nowrap">
                    {i === 0 ? t('cards.cheapest') : `+${money(r.extraCompared, compareCurrency)}`}
                  </span>
                </div>
              </button>
              <button
                onClick={() => { StorageService.triggerHaptic(); onRemoveCard(r.card.id); }}
                aria-label={t('cards.remove', { name: r.card.name })}
                className="shrink-0 w-11 rounded-[16px] bg-inset text-muted flex items-center justify-center active:scale-95"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <button
          onClick={() => { StorageService.triggerHaptic(); setAdding(true); }}
          className="w-full py-2.5 rounded-[16px] bg-inset text-sm font-bold text-ink flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />{t('cards.add')}
        </button>
      ) : (
        <form
          className="space-y-2"
          onSubmit={e => {
            e.preventDefault();
            if (!canAdd) return;
            StorageService.triggerHaptic();
            onAddCard({ name: name.trim(), currency: cardCurrency, feePct: fee });
            setName('');
            setFeeText('');
            setAdding(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={40}
            placeholder={t('est.cardName')}
            aria-label={t('est.cardName')}
            className="w-full bg-inset rounded-[16px] px-4 py-3 text-sm font-bold text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <div className="flex gap-2">
            <select
              value={cardCurrency}
              onChange={e => setCardCurrency(e.target.value)}
              aria-label={t('fee.cardCurrency')}
              className="shrink-0 w-[104px] bg-inset rounded-[16px] px-3 text-sm font-bold text-ink focus:outline-none"
            >
              {FIAT.map(c => <option key={'card-' + c.code} value={c.code}>{c.flag} {c.code}</option>)}
            </select>
            <input
              value={feeText}
              onChange={e => setFeeText(e.target.value)}
              inputMode="decimal"
              placeholder={t('cards.feeLabel')}
              aria-label={t('cards.feeLabel')}
              className="min-w-0 flex-1 bg-inset rounded-[16px] px-4 py-3 text-sm font-bold text-ink placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <button type="submit" disabled={!canAdd} className="shrink-0 px-5 rounded-[16px] text-sm font-bold bg-accent text-onaccent disabled:opacity-40">
              {t('est.save')}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
