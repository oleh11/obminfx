/**
 * Cash withdrawals abroad and the ATM fees a card refunds (e.g. Schwab: 0% conversion fee,
 * ATM operator fees refunded at the end of the statement cycle).
 * Everything is worked out in the user's own currency at the rate of the moment, so it is an estimate:
 * the card network's rate on the posting day decides the exact numbers.
 */

export interface AtmWithdrawal {
  id: string;
  /** YYYY-MM-DD, the day of the withdrawal */
  date: string;
  /** Currency the ATM paid out */
  currency: string;
  /** Cash taken out, in `currency` */
  amount: number;
  /** The ATM operator's fee shown on the ATM screen, in `currency` */
  atmFee: number;
  /** The user's own currency (the card's) */
  homeCurrency: string;
  /** Units of `homeCurrency` per 1 `currency` when it was saved */
  rate: number;
  /** The card's conversion fee in %, 0 for no-fee cards */
  cardFeePct: number;
  /** The ATM fee in `homeCurrency` as it should appear on the statement: the amount to be refunded */
  refundHome: number;
  /** Everything taken from the card, in `homeCurrency` */
  totalHome: number;
  /** Whether this withdrawal's ATM fee has already been refunded on a statement */
  refunded?: boolean;
}

export interface WithdrawalCost {
  /** The cash itself, converted, including the card's conversion fee */
  cashHome: number;
  /** The ATM fee, converted, including the card's conversion fee: what a fee-refunding card pays back */
  atmFeeHome: number;
  /** The card's conversion fee on cash and ATM fee together (0 on no-fee cards) */
  cardFeeHome: number;
  /** Everything taken from the card */
  totalHome: number;
  /** What the cash really cost once the ATM fee is refunded */
  afterRefundHome: number;
}

export const ATM_STORAGE_KEY = 'app_atm_withdrawals_v1';
export const ATM_CARD_FEE_KEY = 'app_atm_card_fee_v1';
export const MAX_WITHDRAWALS = 300;

/** What a withdrawal costs in the user's own currency. `rate` = home units per 1 unit of cash currency. */
export function withdrawalCost(amount: number, atmFee: number, rate: number, cardFeePct = 0): WithdrawalCost | null {
  if (!(amount > 0) || !(atmFee >= 0) || !(rate > 0) || !(cardFeePct >= 0)) return null;
  const k = 1 + cardFeePct / 100;
  const cashHome = amount * rate * k;
  const atmFeeHome = atmFee * rate * k;
  const totalHome = cashHome + atmFeeHome;
  return {
    cashHome,
    atmFeeHome,
    cardFeeHome: (amount + atmFee) * rate * (k - 1),
    totalHome,
    afterRefundHome: totalHome - atmFeeHome,
  };
}

function isWithdrawal(w: any): w is AtmWithdrawal {
  const code = (c: any) => typeof c === 'string' && /^[A-Z]{3}$/.test(c);
  const num = (n: any) => typeof n === 'number' && isFinite(n);
  return w && typeof w.id === 'string' && typeof w.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(w.date)
    && code(w.currency) && code(w.homeCurrency)
    && num(w.amount) && w.amount > 0 && num(w.atmFee) && w.atmFee >= 0
    && num(w.rate) && w.rate > 0 && num(w.cardFeePct) && w.cardFeePct >= 0
    && num(w.refundHome) && num(w.totalHome)
    && (w.refunded === undefined || typeof w.refunded === 'boolean');
}

/** Newest first */
const byDateDesc = (a: AtmWithdrawal, b: AtmWithdrawal) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

export function loadWithdrawals(): AtmWithdrawal[] {
  try {
    const list = JSON.parse(localStorage.getItem(ATM_STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list.filter(isWithdrawal).sort(byDateDesc).slice(0, MAX_WITHDRAWALS) : [];
  } catch {
    return [];
  }
}

export function storeWithdrawals(list: AtmWithdrawal[]): void {
  try {
    localStorage.setItem(ATM_STORAGE_KEY, JSON.stringify(list.slice(0, MAX_WITHDRAWALS)));
  } catch {}
}

/** Adds a withdrawal, working out its home-currency amounts. Returns the new list (newest first), or the same list for bad input. */
export function addWithdrawal(
  list: AtmWithdrawal[],
  input: { date: string; currency: string; amount: number; atmFee: number; homeCurrency: string; rate: number; cardFeePct: number },
  now = Date.now()
): AtmWithdrawal[] {
  const cost = withdrawalCost(input.amount, input.atmFee, input.rate, input.cardFeePct);
  if (!cost || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return list;
  const w: AtmWithdrawal = {
    id: `w${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    refundHome: cost.atmFeeHome,
    totalHome: cost.totalHome,
  };
  return [w, ...list].sort(byDateDesc).slice(0, MAX_WITHDRAWALS);
}

export function removeWithdrawal(list: AtmWithdrawal[], id: string): AtmWithdrawal[] {
  return list.filter(w => w.id !== id);
}

export function updateWithdrawal(
  list: AtmWithdrawal[],
  id: string,
  input: { date: string; currency: string; amount: number; atmFee: number; homeCurrency: string; rate: number; cardFeePct: number }
): AtmWithdrawal[] {
  const cost = withdrawalCost(input.amount, input.atmFee, input.rate, input.cardFeePct);
  if (!cost || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return list;
  return list
    .map(w => w.id === id ? { ...w, ...input, refundHome: cost.atmFeeHome, totalHome: cost.totalHome } : w)
    .sort(byDateDesc);
}

export function toggleWithdrawalRefunded(list: AtmWithdrawal[], id: string): AtmWithdrawal[] {
  return list.map(w => w.id === id ? { ...w, refunded: !w.refunded } : w);
}

export interface MonthTotal {
  /** YYYY-MM */
  month: string;
  homeCurrency: string;
  count: number;
  /** ATM fees to be refunded (total across pending and refunded) */
  refund: number;
  /** ATM fees not yet marked refunded */
  pendingRefund: number;
  /** ATM fees already marked refunded */
  refundedAmount: number;
  refundedCount: number;
  /** Everything taken from the card */
  total: number;
  withdrawals: AtmWithdrawal[];
}

/** Withdrawals grouped by month (newest first), with totals per home currency */
export function monthTotals(list: AtmWithdrawal[]): MonthTotal[] {
  const groups = new Map<string, MonthTotal>();
  for (const w of [...list].sort(byDateDesc)) {
    const month = w.date.slice(0, 7);
    const key = `${month}|${w.homeCurrency}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        month,
        homeCurrency: w.homeCurrency,
        count: 0,
        refund: 0,
        pendingRefund: 0,
        refundedAmount: 0,
        refundedCount: 0,
        total: 0,
        withdrawals: []
      };
      groups.set(key, g);
    }
    g.count++;
    g.refund += w.refundHome;
    if (w.refunded) {
      g.refundedAmount += w.refundHome;
      g.refundedCount++;
    } else {
      g.pendingRefund += w.refundHome;
    }
    g.total += w.totalHome;
    g.withdrawals.push(w);
  }
  return [...groups.values()];
}

export function formatMonthSummaryText(
  m: MonthTotal,
  monthTitle: string,
  formatMoney: (n: number, code: string) => string,
  labels: { pending: string; refunded: string; totalRefunds: string; feeLabel: string }
): string {
  const lines = [
    `${monthTitle} — ${labels.totalRefunds}: ${formatMoney(m.refund, m.homeCurrency)} (${labels.pending}: ${formatMoney(m.pendingRefund, m.homeCurrency)}, ${labels.refunded}: ${formatMoney(m.refundedAmount, m.homeCurrency)})`,
    ...m.withdrawals.map(w => {
      const status = w.refunded ? `[${labels.refunded}]` : `[${labels.pending}]`;
      return `- ${w.date}: ${formatMoney(w.amount, w.currency)} (${labels.feeLabel} ${formatMoney(w.atmFee, w.currency)} → ${formatMoney(w.refundHome, w.homeCurrency)}) ${status}`;
    })
  ];
  return lines.join('\n');
}
