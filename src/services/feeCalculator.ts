import { FeeCalculationResult } from '../types/currency';

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
  symbol: string = ''
): string {
  if (isNaN(amount) || !isFinite(amount)) return '0.00';
  
  let formatted: string;
  if (decimalPlaces >= 4) {
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimalPlaces
    });
  } else {
    formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    });
  }
  
  return showSymbol && symbol ? `${symbol} ${formatted}` : formatted;
}

/**
 * Safely evaluates arithmetic expressions (e.g. "120 + 45.5 * 2") entered in the calculator
 */
export function evaluateMathExpression(expression: string): number | null {
  if (!expression || expression.trim() === '') return 0;
  
  try {
    // Sanitize to only allowed calculator characters
    const cleanExpr = expression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/,/g, '')
      .replace(/[^0-9+\-*/.()]/g, '');
    
    if (!cleanExpr) return null;
    
    // Avoid dangerous eval by using Function constructor with limited scope
    // eslint-disable-next-line no-new-func
    const result = new Function(`'use strict'; return (${cleanExpr})`)();
    if (typeof result === 'number' && isFinite(result)) {
      return result;
    }
    return null;
  } catch (e) {
    return null;
  }
}
