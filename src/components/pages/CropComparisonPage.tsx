import React, { useState, useMemo } from 'react';
import { 
  GitCompare, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Calendar, 
  Download, 
  Check, 
  Plus, 
  X,
  FileSpreadsheet,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Crop, CropPrice, Market } from '../../types/apmc';
import { normalizePrice, calculatePriceSummary, exportPricesToCSV } from '../../utils/calculations';

interface CropComparisonPageProps {
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
}

const CROP_COLORS = [
  '#16a34a', // Emerald green
  '#ea580c', // Orange
  '#0284c7', // Sky blue
  '#9333ea', // Purple
  '#e11d48', // Rose
  '#d97706', // Amber
];

export const CropComparisonPage: React.FC<CropComparisonPageProps> = ({
  crops,
  markets,
  prices,
}) => {
  // Selected crops to compare (IDs)
  const [selectedCropIds, setSelectedCropIds] = useState<string[]>(['crop-onion', 'crop-tomato', 'crop-potato']);
  const [selectedMarketId, setSelectedMarketId] = useState<string>('mkt-vashi');
  const [periodDays, setPeriodDays] = useState<number>(30);
  
  // Standardized unit mode: 'per_kg' (default) or 'per_quintal'
  const [targetUnit, setTargetUnit] = useState<'per_kg' | 'per_quintal'>('per_kg');

  // Add / remove crop from comparison
  const toggleCrop = (cropId: string) => {
    if (selectedCropIds.includes(cropId)) {
      if (selectedCropIds.length > 1) {
        setSelectedCropIds(selectedCropIds.filter(id => id !== cropId));
      }
    } else {
      if (selectedCropIds.length < 5) {
        setSelectedCropIds([...selectedCropIds, cropId]);
      }
    }
  };

  // Build synchronized comparison time-series
  const { comparisonData, cropSummaries, commonDateRangeLabel } = useMemo(() => {
    // 1. Gather filtered records for each crop
    const cropRecordsMap = new Map<string, CropPrice[]>();
    const datesSet = new Set<string>();

    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - periodDays);
    const startDateStr = startDate.toISOString().split('T')[0];

    selectedCropIds.forEach(cropId => {
      const records = prices
        .filter(p => p.crop_id === cropId && p.market_id === selectedMarketId && p.date >= startDateStr)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      cropRecordsMap.set(cropId, records);
      records.forEach(r => datesSet.add(r.date));
    });

    const sortedDates = Array.from(datesSet).sort();
    const commonDateRangeLabel = sortedDates.length > 0 
      ? `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
      : 'No common date range';

    // 2. Build Recharts data points
    const dataPoints: any[] = sortedDates.map(date => {
      const d = new Date(date);
      const displayDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const point: any = { date, displayDate };

      selectedCropIds.forEach(cropId => {
        const crop = crops.find(c => c.id === cropId);
        const record = cropRecordsMap.get(cropId)?.find(r => r.date === date);
        if (crop && record) {
          // Normalize price to selected targetUnit
          const normPrice = normalizePrice(record.modal_price, record.unit, targetUnit);
          point[crop.name] = normPrice;
        }
      });

      return point;
    });

    // 3. Calculate summary metrics per crop
    const summaries = selectedCropIds.map((cropId, idx) => {
      const crop = crops.find(c => c.id === cropId);
      const records = cropRecordsMap.get(cropId) || [];
      const baseSummary = calculatePriceSummary(records);

      if (!baseSummary || !crop) return null;

      const normStart = normalizePrice(baseSummary.previousModalPrice, baseSummary.unit, targetUnit);
      const normEnd = normalizePrice(baseSummary.currentModalPrice, baseSummary.unit, targetUnit);
      const normHigh = normalizePrice(baseSummary.highestPrice, baseSummary.unit, targetUnit);
      const normLow = normalizePrice(baseSummary.lowestPrice, baseSummary.unit, targetUnit);
      const normAvg = normalizePrice(baseSummary.averagePrice, baseSummary.unit, targetUnit);

      return {
        cropId,
        cropName: crop.name,
        localName: crop.local_name,
        icon: crop.icon,
        color: CROP_COLORS[idx % CROP_COLORS.length],
        startPrice: normStart,
        endPrice: normEnd,
        changePercent: baseSummary.changePercent,
        changeValue: Number((normEnd - normStart).toFixed(2)),
        highPrice: normHigh,
        lowPrice: normLow,
        avgPrice: normAvg,
        recordsCount: records.length,
      };
    }).filter(Boolean);

    return { comparisonData: dataPoints, cropSummaries: summaries, commonDateRangeLabel };
  }, [crops, prices, selectedCropIds, selectedMarketId, periodDays, targetUnit]);

  // Automated narrative summary
  const comparisonNarrative = useMemo(() => {
    if (!cropSummaries || cropSummaries.length < 2) return null;

    const validSummaries = cropSummaries.filter(Boolean) as any[];
    if (validSummaries.length < 2) return null;

    const sortedByChange = [...validSummaries].sort((a: any, b: any) => b.changePercent - a.changePercent);
    const topGainer = sortedByChange[0];
    const biggestDecliner = sortedByChange[sortedByChange.length - 1];

    // Find most volatile
    const sortedBySpread = [...validSummaries].sort((a: any, b: any) => {
      const spreadA = a.highPrice - a.lowPrice;
      const spreadB = b.highPrice - b.lowPrice;
      return spreadB - spreadA;
    });
    const mostVolatile = sortedBySpread[0];

    if (!topGainer || !biggestDecliner || !mostVolatile) return null;

    return {
      topGainer,
      biggestDecliner,
      mostVolatile,
      summaryText: `Over the past ${periodDays} days in Navi Mumbai APMC Vashi, ${topGainer.cropName} demonstrated the strongest upward momentum with a ${topGainer.changePercent > 0 ? '+' : ''}${topGainer.changePercent}% price change (closing at ₹${topGainer.endPrice}/${targetUnit === 'per_kg' ? 'kg' : 'qtl'}). In contrast, ${biggestDecliner.cropName} experienced the lowest relative change (${biggestDecliner.changePercent}%). ${mostVolatile.cropName} exhibited the highest trading volatility with a lot price spread of ₹${(mostVolatile.highPrice - mostVolatile.lowPrice).toFixed(1)}.`
    };
  }, [cropSummaries, periodDays, targetUnit]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              Multi-Crop Price Comparison Tool
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Differentiating Feature
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Compare 2 to 5 crops over a unified date range with automatic unit normalization (standardized ₹/Kg or ₹/Quintal)
          </p>
        </div>

        {/* Target Unit Toggle */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-xs self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500 pl-2 pr-1 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>Standardize To:</span>
          </span>
          <button
            onClick={() => setTargetUnit('per_kg')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              targetUnit === 'per_kg'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ₹ / Kilogram (Kg)
          </button>
          <button
            onClick={() => setTargetUnit('per_quintal')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              targetUnit === 'per_quintal'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ₹ / Quintal (100 Kg)
          </button>
        </div>
      </div>

      {/* Crop Selector Toolbar */}
      <div className="agri-card p-5 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
            Select Crops to Compare (Select up to 5)
          </label>
          <div className="flex flex-wrap gap-2">
            {crops.map((crop, idx) => {
              const isSelected = selectedCropIds.includes(crop.id);
              const colorIdx = selectedCropIds.indexOf(crop.id);
              const cropColor = colorIdx !== -1 ? CROP_COLORS[colorIdx % CROP_COLORS.length] : undefined;

              return (
                <button
                  key={crop.id}
                  onClick={() => toggleCrop(crop.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    isSelected
                      ? 'bg-emerald-50 text-slate-900 border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base">{crop.icon || '🌾'}</span>
                  <span className="font-semibold">{crop.name}</span>
                  {isSelected ? (
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: cropColor }}
                    />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Period & Market Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-semibold">Comparison Window:</span>
            {[
              { label: '7 Days', val: 7 },
              { label: '30 Days', val: 30 },
              { label: '90 Days', val: 90 },
            ].map(p => (
              <button
                key={p.label}
                onClick={() => setPeriodDays(p.val)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  periodDays === p.val
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="text-slate-500 font-mono text-[11px]">
            Common Range: <strong>{commonDateRangeLabel}</strong>
          </div>
        </div>
      </div>

      {/* Unit Normalization Notice */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
        <Scale className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold">Unit Normalization Active:</strong> All crop prices below have been standardized to <strong>{targetUnit === 'per_kg' ? '₹ / Kilogram (Kg)' : '₹ / Quintal (100 Kg)'}</strong> to allow fair, apples-to-apples comparison between bulk quintal commodities and crate/kg commodities.
        </div>
      </div>

      {/* Interactive Multi-Line Comparison Chart */}
      <div className="agri-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">
            Synchronized Relative Price Trajectory
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {targetUnit === 'per_kg' ? 'Values in ₹/Kg' : 'Values in ₹/Quintal'}
          </span>
        </div>

        <div className="h-[380px] w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                domain={['auto', 'auto']}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tickFormatter={(val) => `₹${val}`}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[200px]">
                        <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between">
                          <span>{data.date}</span>
                          <span className="text-[10px] text-emerald-400">
                            {targetUnit === 'per_kg' ? '₹/Kg' : '₹/Quintal'}
                          </span>
                        </div>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="font-medium text-slate-200">{entry.name}:</span>
                            </span>
                            <span className="font-bold text-white">₹{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
              />
              {selectedCropIds.map((cropId, idx) => {
                const crop = crops.find(c => c.id === cropId);
                if (!crop) return null;
                const color = CROP_COLORS[idx % CROP_COLORS.length];

                return (
                  <Line 
                    key={crop.id}
                    type="monotone" 
                    dataKey={crop.name} 
                    stroke={color} 
                    strokeWidth={2.5} 
                    dot={{ r: 2.5, fill: color }}
                    activeDot={{ r: 6 }}
                    name={crop.name} 
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Side-by-Side Comparison Metrics Table */}
      <div className="agri-card overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm">
            Standardized Comparative Metrics Grid ({targetUnit === 'per_kg' ? '₹/Kg' : '₹/Quintal'})
          </h3>
          <p className="text-[11px] text-slate-500">
            Direct comparison of initial, current, peak, floor, and percentage price movement over the common date range
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Crop / Commodity</th>
                <th className="py-3 px-3 text-right">Start Rate</th>
                <th className="py-3 px-3 text-right font-bold text-slate-900">Current Rate</th>
                <th className="py-3 px-3 text-right">Net Change (%)</th>
                <th className="py-3 px-3 text-right">Period Peak</th>
                <th className="py-3 px-3 text-right">Period Floor</th>
                <th className="py-3 px-3 text-right">Spread (Swing)</th>
                <th className="py-3 px-3 text-center">Trend Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {cropSummaries.map((item: any) => {
                const isPositive = item.changePercent >= 0;
                const spread = (item.highPrice - item.lowPrice).toFixed(1);

                return (
                  <tr key={item.cropId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2.5">
                        <span 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: item.color }} 
                        />
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <span className="font-bold">{item.cropName}</span>
                          <span className="block text-[11px] text-slate-400 font-normal">{item.localName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-500 font-medium">
                      ₹{item.startPrice}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm">
                      ₹{item.endPrice}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <span className={`inline-flex items-center gap-0.5 font-bold ${
                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        <span>{item.changePercent > 0 ? `+${item.changePercent}` : item.changePercent}%</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right text-slate-700 font-medium">
                      ₹{item.highPrice}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-700 font-medium">
                      ₹{item.lowPrice}
                    </td>

                    <td className="py-3 px-3 text-right font-semibold text-slate-700">
                      ₹{spread}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${
                        item.changePercent > 10 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : item.changePercent < -10 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.changePercent > 10 ? 'High Growth' : item.changePercent < -10 ? 'Declining' : 'Stable'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Automated Market Trend Narrative */}
      {comparisonNarrative && (
        <div className="agri-card p-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2 text-emerald-300 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Automated Market Movement Summary</span>
          </div>
          <p className="text-sm text-emerald-100 leading-relaxed font-sans">
            {comparisonNarrative.summaryText}
          </p>
        </div>
      )}
    </div>
  );
};
