import { FeeCalculationResult } from '../types/currency';
import { parseAmount } from './cardCostEstimator';

/**
 * Calculates foreign transaction conversions including Bank / Financial Institution Processing Fees
 * modeled directly after the Mastercard Currency Converter settlement standards.
 */
export function calculateBankFeeConversion(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  baseRate: number,
  bankFeePercentage: number = 2.0
): FeeCalculationResult {
  const sanitizedAmount = isNaN(amount) || amount < 0 ? 0 : amount;
  const sanitizedFee = isNaN(bankFeePercentage) || bankFeePercentage < 0 ? 0 : bankFeePercentage;
  
  // Base converted amount before bank fee
  const convertedBaseAmount = sanitizedAmount * baseRate;
  
  // Fee charged by bank/issuer: Base Converted Amount * (Fee % / 100)
  const bankFeeAmount = convertedBaseAmount * (sanitizedFee / 100);
  
  // Total cardholder billed amount
  const totalBilledAmount = convertedBaseAmount + bankFeeAmount;
  
  // Effective rate per 1 unit of fromCurrency including the bank surcharge
  const effectiveRate = baseRate * (1 + sanitizedFee / 100);
  const reverseEffectiveRate = effectiveRate > 0 ? 1 / effectiveRate : 0;
  
  // Benchmark comparison against typical 3% standard card & 0% no-fee travel card
  const zeroFeeAmount = convertedBaseAmount;
  const typical3PercentAmount = convertedBaseAmount * 1.03;
  
  const costVsZeroFeeCard = Math.max(0, totalBilledAmount - zeroFeeAmount);
  const savingsVsTypicalCard = typical3PercentAmount - totalBilledAmount;
  
  return {
    originalAmount: sanitizedAmount,
    fromCurrency,
    toCurrency,
    baseRate,
    convertedBaseAmount,
    bankFeePercentage: sanitizedFee,
    bankFeeAmount,
    totalBilledAmount,
    effectiveRate,
    reverseEffectiveRate,
    savingsVsTypicalCard,
    costVsZeroFeeCard
  };
}

/**
 * Formats a currency amount with proper localized number formatting and precision
 */
export function formatCurrencyAmount(
  amount: number,
  decimalPlaces: number = 2,
  showSymbol: boolean = false,
  symbol: string = '',
  locale: string = 'en-US'
): string {
  if (isNaN(amount) || !isFinite(amount)) return '—';
  
  let formatted: string;
  if (decimalPlaces >= 4) {
    formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimalPlaces
    });
  } else {
    formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  }
  
  return showSymbol && symbol ? `${symbol} ${formatted}` : formatted;
}

/**
 * Formats an exchange rate (in the given locale, if any): 6 decimals for tiny rates, 4 otherwise, and a dash when the rate is unknown
 */
export function formatRate(rate: number, locale?: string): string {
  if (!isFinite(rate)) return '—';
  const digits = rate < 0.01 ? 6 : 4;
  if (!locale) return rate.toFixed(digits);
  return rate.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * Returns true when an entered value contains an arithmetic operator or parentheses beyond a leading sign.
 */
export function hasMathOperator(expression: string): boolean {
  const trimmed = expression.trim().replace(/^[+-−–]/, '');
  return /[+\-−–*×/÷()]/.test(trimmed);
}

type MathToken = { kind: 'num'; value: number } | { kind: 'op'; op: string };

function tokenizeMath(expression: string, lang: string): MathToken[] | null {
  const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-');
  const tokens: MathToken[] = [];
  let i = 0;

  while (i < normalized.length) {
    const ch = normalized[i];
    if (/[\s\u00A0\u202F]/.test(ch)) {
      i++;
      continue;
    }
    if ('+-*/()'.includes(ch)) {
      tokens.push({ kind: 'op', op: ch });
      i++;
      continue;
    }
    if (/[0-9.,]/.test(ch)) {
      const rest = normalized.slice(i);
      const match = /^(?:\d{1,3}(?:[ \u00A0\u202F']\d{3})+(?:[.,]\d*)?|[\d.,]+)/.exec(rest);
      if (!match) return null;
      const value = parseAmount(match[0], lang);
      if (!Number.isFinite(value)) return null;
      tokens.push({ kind: 'num', value });
      i += match[0].length;
      continue;
    }
    return null;
  }
  return tokens;
}

/**
 * Safely evaluates arithmetic expressions (e.g. "120 + 45.5 * 2" or "1 200,50 × 2") without eval/Function.
 */
export function evaluateMathExpression(expression: string, lang: string = 'en'): number | null {
  if (!expression || expression.trim() === '') return 0;

  const tokens = tokenizeMath(expression, lang);
  if (!tokens || tokens.length === 0) return null;

  let pos = 0;
  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseExpr = (): number => {
    let left = parseTerm();
    while (peek()?.kind === 'op' && (peek() as { kind: 'op'; op: string }).op.match(/^[+-]$/)) {
      const op = (consume() as { kind: 'op'; op: string }).op;
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };

  const parseTerm = (): number => {
    let left = parseFactor();
    while (peek()?.kind === 'op' && (peek() as { kind: 'op'; op: string }).op.match(/^[*/]$/)) {
      const op = (consume() as { kind: 'op'; op: string }).op;
      const right = parseFactor();
      if (op === '*') left *= right;
      else left = right === 0 ? NaN : left / right;
    }
    return left;
  };

  const parseFactor = (): number => {
    const tok = peek();
    if (!tok) return NaN;
    if (tok.kind === 'op' && (tok.op === '+' || tok.op === '-')) {
      consume();
      const v = parseFactor();
      return tok.op === '-' ? -v : v;
    }
    if (tok.kind === 'op' && tok.op === '(') {
      consume();
      const v = parseExpr();
      const close = peek();
      if (!close || close.kind !== 'op' || close.op !== ')') return NaN;
      consume();
      return v;
    }
    if (tok.kind === 'num') {
      consume();
      return tok.value;
    }
    return NaN;
  };

  const result = parseExpr();
  if (pos !== tokens.length || !Number.isFinite(result)) return null;
  return result;
}
