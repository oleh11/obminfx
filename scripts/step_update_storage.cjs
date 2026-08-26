const fs = require('fs');

const storageContent = `import { RateSourceId } from '../types/currency';
import { DEFAULT_PINNED_CURRENCIES } from '../data/currencies';

const KEYS = {
  PINNED_CURRENCIES: 'app_pinned_currencies_v1',
  FAVORITE_CURRENCIES: 'app_favorite_currencies_v1',
  BASE_CURRENCY: 'app_base_currency_v1',
  TARGET_CURRENCY: 'app_target_currency_v1',
  BANK_FEE_PCT: 'app_bank_fee_pct_v1',
  ACTIVE_SOURCE: 'app_active_source_v1',
  THEME_MODE: 'app_theme_mode_v1',
  HAPTIC_ENABLED: 'app_haptic_enabled_v1',
  CUSTOM_SPREAD: 'custom_bank_spread_pct'
};

export const DEFAULT_FAVORITES = ['USD', 'EUR', 'UAH', 'CAD', 'GBP', 'VND', 'PLN', 'JPY'];

export class StorageService {
  static getPinnedCurrencies(): string[] {
    try {
      const stored = localStorage.getItem(KEYS.PINNED_CURRENCIES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_PINNED_CURRENCIES;
  }

  static setPinnedCurrencies(currencies: string[]): void {
    try {
      localStorage.setItem(KEYS.PINNED_CURRENCIES, JSON.stringify(currencies));
    } catch {}
  }

  static getFavoriteCurrencies(): string[] {
    try {
      const stored = localStorage.getItem(KEYS.FAVORITE_CURRENCIES);
      if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_FAVORITES;
  }

  static setFavoriteCurrencies(favorites: string[]): void {
    try {
      localStorage.setItem(KEYS.FAVORITE_CURRENCIES, JSON.stringify(favorites));
    } catch {}
  }

  static toggleFavoriteCurrency(code: string): string[] {
    const current = this.getFavoriteCurrencies();
    let updated: string[];
    if (current.includes(code)) {
      updated = current.filter(c => c !== code);
    } else {
      updated = [code, ...current];
    }
    this.setFavoriteCurrencies(updated);
    return updated;
  }

  static getBaseCurrency(): string {
    return localStorage.getItem(KEYS.BASE_CURRENCY) || 'USD';
  }

  static setBaseCurrency(code: string): void {
    localStorage.setItem(KEYS.BASE_CURRENCY, code);
  }

  static getTargetCurrency(): string {
    return localStorage.getItem(KEYS.TARGET_CURRENCY) || 'UAH';
  }

  static setTargetCurrency(code: string): void {
    localStorage.setItem(KEYS.TARGET_CURRENCY, code);
  }

  static getBankFeePct(): number {
    const val = localStorage.getItem(KEYS.BANK_FEE_PCT);
    return val !== null ? parseFloat(val) : 2.0; // Default 2.0% average bank rate
  }

  static setBankFeePct(fee: number): void {
    localStorage.setItem(KEYS.BANK_FEE_PCT, fee.toString());
  }

  static getActiveSource(): RateSourceId {
    const s = localStorage.getItem(KEYS.ACTIVE_SOURCE);
    return (s as RateSourceId) || 'ecb';
  }

  static setActiveSource(sourceId: RateSourceId): void {
    localStorage.setItem(KEYS.ACTIVE_SOURCE, sourceId);
  }

  static getTheme(): 'dark' | 'light' {
    return (localStorage.getItem(KEYS.THEME_MODE) as 'dark' | 'light') || 'dark';
  }

  static setTheme(theme: 'dark' | 'light'): void {
    localStorage.setItem(KEYS.THEME_MODE, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  static isHapticEnabled(): boolean {
    const val = localStorage.getItem(KEYS.HAPTIC_ENABLED);
    return val === null ? true : val === 'true';
  }

  static setHapticEnabled(enabled: boolean): void {
    localStorage.setItem(KEYS.HAPTIC_ENABLED, enabled.toString());
  }

  static triggerHaptic(): void {
    if (this.isHapticEnabled() && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {}
    }
  }

  /**
   * Diagnostic inspector for Debug Tab: returns all stored keys and raw values
   */
  static getStorageDebugDump(): Record<string, any> {
    const dump: Record<string, any> = {};
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const raw = localStorage.getItem(key);
          try {
            dump[key] = JSON.parse(raw || '');
          } catch {
            dump[key] = raw;
          }
        }
      }
    } catch (e) {
      dump['error'] = String(e);
    }
    return dump;
  }
}
`;

fs.writeFileSync('src/services/storageService.ts', storageContent, 'utf8');
console.log('storageService.ts updated with favorites & debug dump');
