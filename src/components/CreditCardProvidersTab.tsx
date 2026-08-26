import React, { useState } from "react";
import {
  CreditCard, Shield, Plus, Lock, Check,
  Sparkles, Info, ArrowRight, DollarSign, Wallet
} from "lucide-react";
import { StorageService } from "../services/storageService";

interface CreditCardProvider {
  id: string;
  name: string;
  logo: string;
  issuer: string;
  avgFeePct: number;
  badge: string;
  highlight: string;
  isZeroFee: boolean;
  currencies: string[];
}

const CREDIT_CARD_PROVIDERS: CreditCardProvider[] = [
  {
    id: "mastercard",
    name: "Mastercard Global",
    logo: "🔴🟡",
    issuer: "Card Network",
    avgFeePct: 2.0,
    badge: "Network Standard",
    highlight: "Wholesale card exchange rate with standard 2.0% bank processing markup.",
    isZeroFee: false,
    currencies: ["USD", "EUR", "UAH", "GBP", "PLN"]
  },
  {
    id: "visa",
    name: "Visa Worldwide",
    logo: "💳",
    issuer: "Card Network",
    avgFeePct: 2.1,
    badge: "Network Standard",
    highlight: "Global settlement network with ~2.1% foreign transaction fee on average.",
    isZeroFee: false,
    currencies: ["USD", "EUR", "UAH", "GBP", "CAD"]
  },
  {
    id: "monobank",
    name: "monobank (UA)",
    logo: "🐱",
    issuer: "Universal Bank Ukraine",
    avgFeePct: 0.0,
    badge: "Top Ukrainian Travel Card",
    highlight: "0% foreign transaction fee on direct currency conversions at Mastercard rate.",
    isZeroFee: true,
    currencies: ["UAH", "USD", "EUR", "PLN", "GBP"]
  },
  {
    id: "privatbank",
    name: "PrivatBank (UA)",
    logo: "🟩",
    issuer: "PrivatBank Ukraine",
    avgFeePct: 2.0,
    badge: "Ukrainian Major Bank",
    highlight: "Standard commercial bank exchange rate with ~2% conversion spread.",
    isZeroFee: false,
    currencies: ["UAH", "USD", "EUR", "PLN"]
  },
  {
    id: "wise",
    name: "Wise Multi-Currency Card",
    logo: "🟢",
    issuer: "Fintech / Multi-Currency",
    avgFeePct: 0.45,
    badge: "Lowest Multi-Currency Fee",
    highlight: "Real mid-market exchange rate with transparent low conversion fee (from 0.45%).",
    isZeroFee: false,
    currencies: ["USD", "EUR", "GBP", "UAH", "PLN", "AUD"]
  },
  {
    id: "revolut",
    name: "Revolut Standard",
    logo: "🔷",
    issuer: "Digital Bank",
    avgFeePct: 0.0,
    badge: "0% Weekday FX",
    highlight: "Zero fees on international spending within monthly limits during market hours.",
    isZeroFee: true,
    currencies: ["USD", "EUR", "GBP", "PLN", "CHF"]
  },
  {
    id: "chase",
    name: "Chase Sapphire Preferred",
    logo: "🔵",
    issuer: "JPMorgan Chase",
    avgFeePct: 0.0,
    badge: "No Foreign Transaction Fee",
    highlight: "Premium US travel card with 0% foreign transaction fee.",
    isZeroFee: true,
    currencies: ["USD"]
  },
  {
    id: "amex",
    name: "American Express",
    logo: "🟡",
    issuer: "American Express",
    avgFeePct: 2.7,
    badge: "Premium Travel",
    highlight: "2.7% standard foreign transaction markup on international purchases.",
    isZeroFee: false,
    currencies: ["USD", "EUR", "GBP"]
  }
];

export const CreditCardProvidersTab: React.FC<{
  baseCurrency: string;
  targetCurrency: string;
  bankFeePct: number;
}> = ({
  baseCurrency,
  targetCurrency,
  bankFeePct
}) => {
  const [selectedId, setSelectedId] = useState<string>("monobank");
  const selectedProvider = CREDIT_CARD_PROVIDERS.find(p => p.id === selectedId) || CREDIT_CARD_PROVIDERS[0];

  return (
    <div className="space-y-4 max-w-md mx-auto pb-8">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-slate-900 border border-purple-500/30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Credit Card & Bank Providers
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Compare Mastercard, Visa & Ukrainian bank foreign fees
            </p>
          </div>
        </div>
      </div>

      {/* Selected Provider Spotlight Card */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedProvider.logo}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-white text-base">{selectedProvider.name}</h3>
                <span className={"text-[10px] px-2 py-0.5 rounded-full font-bold border " + (selectedProvider.isZeroFee ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-amber-500/20 text-amber-300 border-amber-500/30")}>
                  {selectedProvider.avgFeePct === 0 ? "0% Free" : "+" + selectedProvider.avgFeePct + "% Fee"}
                </span>
              </div>
              <p className="text-xs text-slate-400">{selectedProvider.issuer}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
          {selectedProvider.highlight}
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Foreign Markup</span>
            <span className="font-mono font-bold text-sm text-white">{selectedProvider.avgFeePct}%</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Category</span>
            <span className="font-bold text-xs text-blue-400 truncate block">{selectedProvider.badge}</span>
          </div>
        </div>
      </div>

      {/* Provider List */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
          Top Card Networks & Issuers ({CREDIT_CARD_PROVIDERS.length})
        </h3>

        {CREDIT_CARD_PROVIDERS.map((provider) => {
          const isSelected = provider.id === selectedId;
          return (
            <div
              key={provider.id}
              onClick={() => {
                StorageService.triggerHaptic();
                setSelectedId(provider.id);
              }}
              className={"p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between " + (isSelected ? "bg-purple-600/15 border-purple-500 shadow-md ring-1 ring-purple-500/30" : "bg-slate-900/80 border-slate-800 hover:border-slate-700")}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{provider.logo}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm">{provider.name}</h4>
                    <span className={"text-[9px] px-1.5 py-0.2 rounded font-extrabold " + (provider.isZeroFee ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400")}>
                      {provider.avgFeePct === 0 ? "0% Fee" : "+" + provider.avgFeePct + "%"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{provider.badge}</p>
                </div>
              </div>

              <div className="text-right">
                <span className={"text-xs font-bold " + (provider.isZeroFee ? "text-emerald-400" : "text-slate-300")}>
                  {provider.isZeroFee ? "No Fee" : provider.avgFeePct + "%"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};