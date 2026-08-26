import React, { useState, useEffect } from "react";
import { 
  TrendingUp, TrendingDown, ArrowRightLeft, 
  RefreshCw, Activity 
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, CartesianGrid 
} from "recharts";
import { HistoricalDataSummary } from "../types/currency";
import { ALL_CURRENCIES, getCurrencyMeta } from "../data/currencies";
import { RateService } from "../services/rateService";
import { StorageService } from "../services/storageService";

interface HistoricalChartsTabProps {
  initialFrom?: string;
  initialTo?: string;
}

export const HistoricalChartsTab: React.FC<HistoricalChartsTabProps> = ({
  initialFrom = "USD",
  initialTo = "UAH"
}) => {
  const [fromCurrency, setFromCurrency] = useState<string>(initialFrom);
  const [toCurrency, setToCurrency] = useState<string>(initialTo);
  const [timeframe, setTimeframe] = useState<"7d" | "1m" | "3m" | "1y" | "5y">("1m");
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<HistoricalDataSummary | null>(null);

  const fromMeta = getCurrencyMeta(fromCurrency);
  const toMeta = getCurrencyMeta(toCurrency);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const data = await RateService.getHistoricalRates(fromCurrency, toCurrency, timeframe);
      setChartData(data);
    } catch (e) {
      console.warn("Failed to load historical chart data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, [fromCurrency, toCurrency, timeframe]);

  const handleSwap = () => {
    StorageService.triggerHaptic();
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const isPositive = (chartData?.changePercentage || 0) >= 0;

  return (
    <div className="space-y-4 w-full max-w-2xl mx-auto pb-8">
      {/* Header Pill */}
      <div className="p-5 rounded-[28px] bg-[#161a26] border border-white/5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-300">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-white tracking-tight">
              Historical Trends
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Exchange rate fluctuations & range analysis
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            StorageService.triggerHaptic();
            fetchChartData();
          }}
          className="p-2.5 rounded-full bg-[#0e111a] hover:bg-[#1a1f2e] text-slate-300 border border-white/5 transition-all"
          title="Refresh chart"
        >
          <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin text-amber-400" : "")} />
        </button>
      </div>

      {/* Pair Selectors & Timeframe Pills */}
      <div className="p-5 rounded-[32px] bg-[#161a26] border border-white/5 shadow-xl space-y-4">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Base Currency
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => {
                StorageService.triggerHaptic();
                setFromCurrency(e.target.value);
              }}
              className="w-full bg-[#0e111a] border border-white/5 rounded-[18px] px-3 py-2.5 text-xs font-bold text-white focus:outline-none"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={"chart-from-" + c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwap}
            className="mt-4 p-2.5 rounded-full bg-[#0e111a] hover:bg-[#1a1f2e] active:scale-90 text-amber-400 border border-white/5 transition-all"
            title="Swap"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Target Currency
            </label>
            <select
              value={toCurrency}
              onChange={(e) => {
                StorageService.triggerHaptic();
                setToCurrency(e.target.value);
              }}
              className="w-full bg-[#0e111a] border border-white/5 rounded-[18px] px-3 py-2.5 text-xs font-bold text-white focus:outline-none"
            >
              {ALL_CURRENCIES.map((c) => (
                <option key={"chart-to-" + c.code} value={c.code}>
                  {c.flag} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Timeframe Pills */}
        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-white/5">
          {(["7d", "1m", "3m", "1y", "5y"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                StorageService.triggerHaptic();
                setTimeframe(tf);
              }}
              className={"py-2 rounded-[16px] text-xs font-black uppercase transition-all " + (timeframe === tf ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" : "bg-[#0e111a] text-slate-400 hover:text-slate-200 border border-white/5")}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Bento Box */}
      <div className="p-5 rounded-[32px] bg-[#161a26] border border-white/5 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium">
              <span>{fromMeta.flag} {fromCurrency} / {toMeta.flag} {toCurrency}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-black text-3xl text-white">
                {chartData ? (chartData.currentRate < 0.01 ? chartData.currentRate.toFixed(6) : chartData.currentRate.toFixed(4)) : "---"}
              </span>
              <span className="text-xs font-bold text-amber-400">{toMeta.symbol}</span>
            </div>
          </div>

          {chartData && (
            <div className={"px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border " + (isPositive ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-rose-500/15 text-rose-300 border-rose-500/30")}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? "+" : ""}{chartData.changePercentage.toFixed(2)}%</span>
            </div>
          )}
        </div>

        <div className="h-56 w-full pt-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <Activity className="w-6 h-6 animate-pulse text-amber-400" />
              <span className="text-xs">Loading market rate history...</span>
            </div>
          ) : chartData && chartData.dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.dataPoints} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#F59E0B" : "#F43F5E"} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isPositive ? "#F59E0B" : "#F43F5E"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222838" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  tickFormatter={(val) => val.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  tickFormatter={(val) => val < 0.01 ? val.toFixed(4) : val.toFixed(2)}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-[#0b101b] border border-white/10 p-2.5 rounded-[16px] shadow-xl text-xs font-mono">
                          <p className="text-slate-400 text-[10px] mb-0.5">{label}</p>
                          <p className="font-black text-amber-400">
                            1 {fromCurrency} = {val < 0.01 ? val.toFixed(6) : val.toFixed(4)} {toCurrency}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke={isPositive ? "#F59E0B" : "#F43F5E"} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-xs">
              No historical data available
            </div>
          )}
        </div>

        {/* High / Low / Average Bento Grid */}
        {chartData && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
            <div className="p-3 rounded-[20px] bg-[#0e111a] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">High</span>
              <span className="font-mono text-xs font-black text-emerald-400">
                {chartData.high < 0.01 ? chartData.high.toFixed(6) : chartData.high.toFixed(4)}
              </span>
            </div>
            <div className="p-3 rounded-[20px] bg-[#0e111a] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Low</span>
              <span className="font-mono text-xs font-black text-rose-400">
                {chartData.low < 0.01 ? chartData.low.toFixed(6) : chartData.low.toFixed(4)}
              </span>
            </div>
            <div className="p-3 rounded-[20px] bg-[#0e111a] border border-white/5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Average</span>
              <span className="font-mono text-xs font-black text-amber-300">
                {chartData.average < 0.01 ? chartData.average.toFixed(6) : chartData.average.toFixed(4)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};