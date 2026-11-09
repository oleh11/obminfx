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
import { ALL_CURRENCIES } from "../data/currencies";
import { useT } from "../i18n";
import { RateService } from "../services/rateService";
import { formatRate } from "../services/feeCalculator";
import { StorageService } from "../services/storageService";

interface HistoricalChartsTabProps {
  initialFrom?: string;
  initialTo?: string;
}

export const HistoricalChartsTab: React.FC<HistoricalChartsTabProps> = ({
  initialFrom = "USD",
  initialTo = "UAH"
}) => {
  const { t, locale, currency } = useT();
  const [fromCurrency, setFromCurrency] = useState<string>(initialFrom);
  const [toCurrency, setToCurrency] = useState<string>(initialTo);
  const [timeframe, setTimeframe] = useState<"7d" | "1m" | "3m" | "1y" | "5y">("1m");
  const [loading, setLoading] = useState<boolean>(true);
  const [chartData, setChartData] = useState<HistoricalDataSummary | null>(null);

  const fromMeta = currency(fromCurrency);
  const toMeta = currency(toCurrency);

  // Chart dates are YYYY-MM-DD strings
  const formatDate = (iso: string, opts: Intl.DateTimeFormatOptions) => {
    const d = new Date(iso + "T00:00:00");
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale, opts);
  };

  const fetchChartData = async () => {
    setLoading(true);
    try {
      const data = await RateService.getHistoricalRates(fromCurrency, toCurrency, timeframe);
      setChartData(data);
    } catch (e) {
      console.warn("Failed to load historical chart data", e);
      setChartData(null);
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
      <div className="p-5 rounded-[24px] bg-card border border-line/[0.08] shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-[20px] bg-amber-500/15 border border-amber-400/25 flex items-center justify-center text-amber-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-black text-ink tracking-tight">
              {t("trends.title")}
            </h2>
            <p className="text-xs text-muted font-medium mt-0.5">
              {t("trends.subtitle")}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            StorageService.triggerHaptic();
            fetchChartData();
          }}
          className="p-2.5 rounded-full bg-inset hover:bg-inset2 text-ink2 border border-line/[0.08] transition-all"
          title={t("trends.refresh")}
        >
          <RefreshCw className={"w-4 h-4 " + (loading ? "animate-spin text-amber-700" : "")} />
        </button>
      </div>

      {/* Pair Selectors & Timeframe Pills */}
      <div className="p-5 rounded-[24px] bg-card border border-line/[0.08] shadow-sm space-y-4">
        <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              {t("trends.base")}
            </label>
            <select
              value={fromCurrency}
              onChange={(e) => {
                StorageService.triggerHaptic();
                setFromCurrency(e.target.value);
              }}
              className="w-full bg-inset border border-line/[0.08] rounded-[18px] px-3 py-2.5 text-xs font-bold text-ink focus:outline-none"
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
            className="mt-4 p-2.5 rounded-full bg-inset hover:bg-inset2 active:scale-90 text-amber-700 border border-line/[0.08] transition-all"
            title={t("trends.swap")}
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-1">
              {t("trends.target")}
            </label>
            <select
              value={toCurrency}
              onChange={(e) => {
                StorageService.triggerHaptic();
                setToCurrency(e.target.value);
              }}
              className="w-full bg-inset border border-line/[0.08] rounded-[18px] px-3 py-2.5 text-xs font-bold text-ink focus:outline-none"
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
        <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-line/[0.08]">
          {(["7d", "1m", "3m", "1y", "5y"] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => {
                StorageService.triggerHaptic();
                setTimeframe(tf);
              }}
              className={"py-2 rounded-[16px] text-xs font-black uppercase whitespace-nowrap transition-all " + (timeframe === tf ? "bg-accent text-onaccent shadow-md shadow-amber-500/20" : "bg-inset text-muted hover:text-ink2 border border-line/[0.08]")}
            >
              {t(`tf.${tf}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Bento Box */}
      <div className="p-5 rounded-[24px] bg-card border border-line/[0.08] shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-muted text-xs font-medium">
              <span>{fromMeta.flag} {fromCurrency} / {toMeta.flag} {toCurrency}</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-mono font-black text-3xl text-ink">
                {chartData ? formatRate(chartData.currentRate, locale) : "---"}
              </span>
              <span className="text-xs font-bold text-amber-700">{toMeta.symbol}</span>
            </div>
          </div>

          {chartData && (
            <div className={"px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 border " + (isPositive ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : "bg-rose-500/15 text-rose-600 border-rose-500/30")}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{isPositive ? "+" : ""}{chartData.changePercentage.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%</span>
            </div>
          )}
        </div>

        <div className="h-56 w-full pt-2">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-muted gap-2">
              <Activity className="w-6 h-6 animate-pulse text-amber-700" />
              <span className="text-xs">{t("trends.loading")}</span>
            </div>
          ) : chartData && chartData.dataPoints.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.dataPoints} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#059669" : "#E11D48"} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={isPositive ? "#059669" : "#E11D48"} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EE" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fill: "#686C76" }}
                  tickFormatter={(val) => formatDate(val, { day: "2-digit", month: "2-digit" })}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 9, fill: "#686C76" }}
                  tickFormatter={(val: number) => val.toLocaleString(locale, { maximumFractionDigits: val < 0.01 ? 4 : 2, minimumFractionDigits: val < 0.01 ? 4 : 2 })}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const val = payload[0].value as number;
                      return (
                        <div className="bg-inset border border-line/[0.08] p-2.5 rounded-[16px] shadow-sm text-xs font-mono">
                          <p className="text-muted text-[10px] mb-0.5">{formatDate(String(label), { day: "numeric", month: "short", year: "numeric" })}</p>
                          <p className="font-black text-amber-700">
                            1 {fromCurrency} = {formatRate(val, locale)} {toCurrency}
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
                  stroke={isPositive ? "#059669" : "#E11D48"} 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted text-xs gap-1 px-4">
              <span>{t("trends.noData", { from: fromCurrency, to: toCurrency })}</span>
              <span className="text-[10px] text-muted/70">
                {t("trends.noDataHint")}
              </span>
            </div>
          )}
        </div>

        {/* High / Low / Average Bento Grid */}
        {chartData && (
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-line/[0.08] text-center">
            <div className="p-3 rounded-[20px] bg-inset border border-line/[0.08]">
              <span className="text-[10px] uppercase font-bold text-muted block">{t("trends.high")}</span>
              <span className="font-mono text-xs font-black text-emerald-600">
                {formatRate(chartData.high, locale)}
              </span>
            </div>
            <div className="p-3 rounded-[20px] bg-inset border border-line/[0.08]">
              <span className="text-[10px] uppercase font-bold text-muted block">{t("trends.low")}</span>
              <span className="font-mono text-xs font-black text-rose-600">
                {formatRate(chartData.low, locale)}
              </span>
            </div>
            <div className="p-3 rounded-[20px] bg-inset border border-line/[0.08]">
              <span className="text-[10px] uppercase font-bold text-muted block">{t("trends.average")}</span>
              <span className="font-mono text-xs font-black text-amber-700">
                {formatRate(chartData.average, locale)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};