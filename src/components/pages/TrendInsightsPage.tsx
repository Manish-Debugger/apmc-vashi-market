import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ShieldAlert, 
  Layers, 
  Sparkles,
  Info,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Crop, CropPrice, Market } from '../../types/apmc';
import { calculatePriceSummary, normalizePrice } from '../../utils/calculations';

interface TrendInsightsPageProps {
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
  onSelectCrop: (cropId: string) => void;
}

export const TrendInsightsPage: React.FC<TrendInsightsPageProps> = ({
  crops,
  markets,
  prices,
  onSelectCrop,
}) => {
  const [timeWindow, setTimeWindow] = useState<7 | 14 | 30>(30);

  // Compute metrics for all crops in Navi Mumbai APMC Vashi
  const cropTrendData = useMemo(() => {
    return crops.map(crop => {
      const records = prices
        .filter(p => p.crop_id === crop.id && p.market_id === 'mkt-vashi')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      if (records.length < 2) return null;

      // Filter to timeWindow days
      const latestDate = new Date(records[records.length - 1].date);
      const windowStart = new Date(latestDate);
      windowStart.setDate(windowStart.getDate() - timeWindow);
      const windowStartStr = windowStart.toISOString().split('T')[0];

      const windowRecords = records.filter(r => r.date >= windowStartStr);
      if (windowRecords.length === 0) return null;

      const summary = calculatePriceSummary(windowRecords);
      if (!summary) return null;

      // Volatility calculation: Spread between highest and lowest relative to average
      const priceSwing = summary.highestPrice - summary.lowestPrice;
      const volatilityPct = summary.averagePrice > 0 ? (priceSwing / summary.averagePrice) * 100 : 0;

      // Simple 7-day vs 30-day moving average trend outlook
      const latest7 = records.slice(-7);
      const latest30 = records.slice(-30);
      const ma7 = latest7.reduce((s, r) => s + r.modal_price, 0) / latest7.length;
      const ma30 = latest30.reduce((s, r) => s + r.modal_price, 0) / latest30.length;

      let outlook: 'Bullish' | 'Neutral' | 'Bearish' = 'Neutral';
      if (ma7 > ma30 * 1.04) outlook = 'Bullish';
      else if (ma7 < ma30 * 0.96) outlook = 'Bearish';

      return {
        cropId: crop.id,
        cropName: crop.name,
        localName: crop.local_name,
        icon: crop.icon,
        category: crop.category,
        unit: crop.standard_unit,
        currentPrice: summary.currentModalPrice,
        previousPrice: summary.previousModalPrice,
        changePercent: summary.changePercent,
        changeValue: summary.changeValue,
        highestPrice: summary.highestPrice,
        lowestPrice: summary.lowestPrice,
        averagePrice: summary.averagePrice,
        priceSwing,
        volatilityPct: Number(volatilityPct.toFixed(1)),
        outlook,
        ma7: Math.round(ma7),
        ma30: Math.round(ma30),
      };
    }).filter(Boolean);
  }, [crops, prices, timeWindow]);

  // Ranking: Highest volatility (swing) vs Lowest volatility (stable)
  const sortedByVolatility = useMemo(() => {
    return [...cropTrendData].sort((a: any, b: any) => b.volatilityPct - a.volatilityPct);
  }, [cropTrendData]);

  // Ranking: Top Gainers vs Top Decliners
  const sortedByGain = useMemo(() => {
    return [...cropTrendData].sort((a: any, b: any) => b.changePercent - a.changePercent);
  }, [cropTrendData]);

  // Category average price trends (Fruits vs Vegetables)
  const categoryStats = useMemo(() => {
    const veg = cropTrendData.filter((c: any) => c.category === 'vegetables');
    const fruits = cropTrendData.filter((c: any) => c.category === 'fruits');

    const vegAvgChange = veg.length > 0 
      ? Number((veg.reduce((s: number, c: any) => s + c.changePercent, 0) / veg.length).toFixed(1))
      : 0;
    const fruitAvgChange = fruits.length > 0
      ? Number((fruits.reduce((s: number, c: any) => s + c.changePercent, 0) / fruits.length).toFixed(1))
      : 0;

    return { vegAvgChange, fruitAvgChange, vegCount: veg.length, fruitCount: fruits.length };
  }, [cropTrendData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              Price Trend Insights & Market Outlook
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Automated Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Historical price volatility, moving average momentum indicators, and category fluctuation indices
          </p>
        </div>

        {/* Time Window Selector */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <span className="text-xs font-semibold text-slate-500 pl-2 pr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Time Window:</span>
          </span>
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              onClick={() => setTimeWindow(days as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                timeWindow === days
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Category Overview Indices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="agri-card p-5 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Vegetable Price Index</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              categoryStats.vegAvgChange >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {categoryStats.vegAvgChange >= 0 ? `+${categoryStats.vegAvgChange}` : categoryStats.vegAvgChange}%
            </span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {categoryStats.vegAvgChange >= 0 ? 'Upward Incline' : 'Price Softening'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {categoryStats.vegCount} monitored vegetable varieties in Vashi over the past {timeWindow} days.
          </p>
        </div>

        <div className="agri-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Fruit Price Index</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              categoryStats.fruitAvgChange >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}>
              {categoryStats.fruitAvgChange >= 0 ? `+${categoryStats.fruitAvgChange}` : categoryStats.fruitAvgChange}%
            </span>
          </div>
          <p className="text-xl font-extrabold text-slate-900">
            {categoryStats.fruitAvgChange >= 0 ? 'Premium Clearance' : 'Moderate Inflow'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Across {categoryStats.fruitCount} fruit varieties over the past {timeWindow} days.
          </p>
        </div>
      </div>

      {/* Volatility & Fluctuation Ranking */}
      <div className="agri-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600" />
              <span>Commodity Volatility & Price Swing Ranking</span>
            </h2>
            <p className="text-xs text-slate-500">
              Ranking crops by the percentage difference between highest and lowest recorded prices over the {timeWindow}-day period
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sortedByVolatility.map((item: any, idx) => {
            const isHighVolatility = item.volatilityPct > 28;
            const isMediumVolatility = item.volatilityPct >= 15 && item.volatilityPct <= 28;

            return (
              <div 
                key={item.cropId}
                onClick={() => onSelectCrop(item.cropId)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer bg-white group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-700 transition-colors">
                        {item.cropName}
                      </h4>
                      <span className="text-[10px] text-slate-400">{item.localName}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isHighVolatility 
                      ? 'bg-rose-100 text-rose-800' 
                      : isMediumVolatility 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isHighVolatility ? 'High Swing' : isMediumVolatility ? 'Moderate' : 'Stable'}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Recorded Range:</span>
                    <span className="font-semibold text-slate-800">₹{item.lowestPrice} – ₹{item.highestPrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Average Rate:</span>
                    <span className="font-medium text-slate-700">₹{item.averagePrice}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 font-semibold pt-1">
                    <span>Volatility Factor:</span>
                    <span className="text-emerald-700">{item.volatilityPct}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Moving Average Outlook Grid */}
      <div className="agri-card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Statistical Moving Average Momentum Outlook
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Compares 7-day short-term moving average (MA-7) against 30-day baseline (MA-30) to indicate supply-demand momentum
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Commodity</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Current Modal</th>
                <th className="py-2.5 px-3 text-right">MA-7 Day</th>
                <th className="py-2.5 px-3 text-right">MA-30 Day</th>
                <th className="py-2.5 px-3 text-center">Momentum Indicator</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cropTrendData.map((item: any) => (
                <tr key={item.cropId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.cropName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 uppercase text-[10px] font-medium">{item.category}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">₹{item.currentPrice}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">₹{item.ma7}</td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-500">₹{item.ma30}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                      item.outlook === 'Bullish'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.outlook === 'Bearish'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.outlook === 'Bullish' && <ArrowUpRight className="w-3 h-3 text-emerald-600" />}
                      {item.outlook === 'Bearish' && <ArrowDownRight className="w-3 h-3 text-rose-600" />}
                      <span>{item.outlook} Demand</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <button
                      onClick={() => onSelectCrop(item.cropId)}
                      className="text-xs text-emerald-700 hover:underline font-semibold"
                    >
                      View Chart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistical Label Disclaimer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>
            <strong>Disclaimer:</strong> Momentum indicators are mathematical rolling averages derived from recorded historical transactions. They are provided solely for trend visualization and do not constitute trading or financial advice.
          </span>
        </div>
      </div>
    </div>
  );
};
