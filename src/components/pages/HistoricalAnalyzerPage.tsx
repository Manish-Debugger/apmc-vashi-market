import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  AlertCircle, 
  Layers, 
  Scale, 
  Clock, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart,
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Crop, CropPrice, Market } from '../../types/apmc';
import { calculatePriceSummary, detectMissingDates, exportPricesToCSV, normalizePrice } from '../../utils/calculations';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '../AnimatedCounter';

interface HistoricalAnalyzerPageProps {
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
  selectedCropId: string;
  setSelectedCropId: (cropId: string) => void;
  onSelectPriceDetail: (price: CropPrice) => void;
}

export const HistoricalAnalyzerPage: React.FC<HistoricalAnalyzerPageProps> = ({
  crops,
  markets,
  prices,
  selectedCropId,
  setSelectedCropId,
  onSelectPriceDetail,
}) => {
  const [selectedMarketId, setSelectedMarketId] = useState<string>('mkt-vashi');
  const [periodDays, setPeriodDays] = useState<number | 'custom'>(30);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [unitMode, setUnitMode] = useState<'original' | 'per_kg'>('original');
  const [chartMode, setChartMode] = useState<'area' | 'line' | 'bar'>('area');

  // Currently selected crop object
  const currentCrop = crops.find(c => c.id === selectedCropId) || crops[0];

  // Filter historical records for this crop and market within date range
  const { filteredRecords, dateRangeLabel, startDateStr, endDateStr } = useMemo(() => {
    // All records for this crop & market
    const allRecords = prices
      .filter(p => p.crop_id === selectedCropId && p.market_id === selectedMarketId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (allRecords.length === 0) {
      return { filteredRecords: [], dateRangeLabel: 'No Records', startDateStr: '', endDateStr: '' };
    }

    const latestDate = new Date(allRecords[allRecords.length - 1].date);
    let startDate: Date;
    let endDate: Date = latestDate;

    if (periodDays === 'custom') {
      startDate = customStartDate ? new Date(customStartDate) : new Date(allRecords[0].date);
      if (customEndDate) endDate = new Date(customEndDate);
    } else {
      startDate = new Date(latestDate);
      startDate.setDate(startDate.getDate() - periodDays);
    }

    const sStr = startDate.toISOString().split('T')[0];
    const eStr = endDate.toISOString().split('T')[0];

    const subset = allRecords.filter(r => r.date >= sStr && r.date <= eStr);
    const label = `${sStr} to ${eStr}`;

    return { filteredRecords: subset, dateRangeLabel: label, startDateStr: sStr, endDateStr: eStr };
  }, [prices, selectedCropId, selectedMarketId, periodDays, customStartDate, customEndDate]);

  // Statistical summary
  const summary = useMemo(() => {
    return calculatePriceSummary(filteredRecords);
  }, [filteredRecords]);

  // Missing trading dates detection (excluding closed Sundays)
  const missingDates = useMemo(() => {
    if (!startDateStr || !endDateStr || filteredRecords.length === 0) return [];
    return detectMissingDates(filteredRecords, startDateStr, endDateStr);
  }, [filteredRecords, startDateStr, endDateStr]);

  // Chart data format
  const chartData = useMemo(() => {
    return filteredRecords.map(r => {
      const modal = unitMode === 'per_kg' ? normalizePrice(r.modal_price, r.unit, 'per_kg') : r.modal_price;
      const min = unitMode === 'per_kg' ? normalizePrice(r.min_price, r.unit, 'per_kg') : r.min_price;
      const max = unitMode === 'per_kg' ? normalizePrice(r.max_price, r.unit, 'per_kg') : r.max_price;

      // Format date for chart axis e.g. "12 Oct"
      const d = new Date(r.date);
      const displayDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      return {
        date: r.date,
        displayDate,
        Modal: modal,
        Minimum: min,
        Maximum: max,
        Spread: max - min,
        Arrivals: r.arrivals_quintal || 0,
        unit: unitMode === 'per_kg' ? '₹/Kg' : r.unit,
      };
    });
  }, [filteredRecords, unitMode]);

  const handleExportCropHistory = () => {
    exportPricesToCSV(filteredRecords, `${currentCrop.name}_historical_prices_${dateRangeLabel}.csv`);
  };

  const isPositiveChange = (summary?.changePercent || 0) >= 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Crop Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              Historical Crop Price Analyzer
            </h1>
            <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
              Main Feature
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Track daily wholesale rate trends, auction lot spreads, and statistical fluctuations over time
          </p>
        </div>

        {/* Export Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCropHistory}
            disabled={filteredRecords.length === 0}
            className="agri-btn-secondary text-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Crop History</span>
          </button>
        </div>
      </div>

      {/* Control Toolbar: Crop, Market, Period & Unit Toggle */}
      <div className="agri-card p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Agricultural Crop
            </label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="agri-select w-full text-xs font-medium"
            >
              {crops.map(c => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name} — {c.local_name}
                </option>
              ))}
            </select>
          </div>

          {/* Market Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Market Mandi
            </label>
            <select
              value={selectedMarketId}
              onChange={(e) => setSelectedMarketId(e.target.value)}
              className="agri-select w-full text-xs"
            >
              {markets.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Time Period Selector */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Analysis Period
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { label: '7 Days', val: 7 },
                { label: '30 Days', val: 30 },
                { label: '90 Days', val: 90 },
                { label: '180 Days', val: 180 },
                { label: 'Custom', val: 'custom' },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPeriodDays(p.val as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    periodDays === p.val
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-1.5 pl-2">
                <span className="text-[11px] text-slate-500 font-medium">Display Unit:</span>
                <button
                  type="button"
                  onClick={() => setUnitMode(unitMode === 'original' ? 'per_kg' : 'original')}
                  className="agri-btn-secondary py-1 px-2.5 text-[11px]"
                >
                  {unitMode === 'original' ? 'Standard (₹/Qtl)' : 'Per Kg (₹/Kg)'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range (when periodDays === 'custom') */}
        {periodDays === 'custom' && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-600 font-medium">Custom Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="agri-input py-1 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="agri-input py-1 text-xs"
            />
          </div>
        )}
      </div>

      {/* Statistical Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div className="agri-card p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Highest Price
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              ₹<AnimatedCounter value={unitMode === 'per_kg' ? normalizePrice(summary.highestPrice, summary.unit, 'per_kg') : summary.highestPrice} />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Peak recorded rate
            </span>
          </div>

          <div className="agri-card p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Lowest Price
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              ₹<AnimatedCounter value={unitMode === 'per_kg' ? normalizePrice(summary.lowestPrice, summary.unit, 'per_kg') : summary.lowestPrice} />
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Floor recorded rate
            </span>
          </div>

          <div className="agri-card p-4 bg-emerald-50/50 border-emerald-200">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
              Average Modal Price
            </span>
            <div className="text-xl font-extrabold text-emerald-700">
              ₹<AnimatedCounter value={unitMode === 'per_kg' ? normalizePrice(summary.averagePrice, summary.unit, 'per_kg') : summary.averagePrice} />
            </div>
            <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
              Mean of daily modal rates
            </span>
          </div>

          <div className="agri-card p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Period Change
            </span>
            <div className={`text-xl font-extrabold flex items-center gap-1 ${
              isPositiveChange ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isPositiveChange ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{summary.changePercent > 0 ? `+${summary.changePercent}` : summary.changePercent}%</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              {summary.changeValue >= 0 ? `+₹${summary.changeValue}` : `-₹${Math.abs(summary.changeValue)}`} over period
            </span>
          </div>

          <div className="agri-card p-4">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Recorded Records
            </span>
            <div className="text-xl font-extrabold text-slate-900">
              <AnimatedCounter value={summary.recordsCount} /> Days
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              In selected time frame
            </span>
          </div>
        </div>
      )}

      {/* Main Interactive Recharts Line & Area Chart */}
      <div className="agri-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentCrop.icon}</span>
              <h2 className="text-base font-bold text-slate-900">
                {currentCrop.name} Price Fluctuation Curve
              </h2>
            </div>
            <p className="text-xs text-slate-500">
              Showing Daily Modal (Bold), Maximum (Green), and Minimum (Gray) lot price clearance rates ({unitMode === 'per_kg' ? '₹/Kg' : currentCrop.standard_unit})
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Chart Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setChartMode('area')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  chartMode === 'area' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Area
              </button>
              <button
                type="button"
                onClick={() => setChartMode('line')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  chartMode === 'line' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartMode('bar')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  chartMode === 'bar' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bar
              </button>
            </div>

            <div className="text-xs text-slate-500 font-mono hidden sm:block">
              {dateRangeLabel}
            </div>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-24 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-slate-600">No trading records found for the selected range</p>
            <p className="text-xs mt-1">Try expanding your date selection or selecting Navi Mumbai APMC Vashi.</p>
          </div>
        ) : (
          <div className="h-[380px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="modalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
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
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[180px]">
                            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between">
                              <span>{data.date}</span>
                              <span className="text-[10px] text-emerald-400">{data.unit}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span>Modal Price:</span>
                              <span className="text-sm">₹{data.Modal}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Max Grade:</span>
                              <span>₹{data.Maximum}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Min Grade:</span>
                              <span>₹{data.Minimum}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                              <span>Lot Spread:</span>
                              <span>₹{data.Spread}</span>
                            </div>
                            {data.Arrivals > 0 && (
                              <div className="flex justify-between items-center text-slate-400 text-[10px]">
                                <span>Arrivals:</span>
                                <span>{data.Arrivals} Quintals</span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="Maximum" stroke="#94a3b8" strokeDasharray="4 4" fill="transparent" name="Maximum Price" />
                  <Area type="monotone" dataKey="Modal" stroke="#16a34a" strokeWidth={3} fill="url(#modalGrad)" dot={{ r: 2.5, fill: '#16a34a' }} activeDot={{ r: 6 }} name="Modal Price (Bulk)" />
                  <Area type="monotone" dataKey="Minimum" stroke="#cbd5e1" strokeDasharray="4 4" fill="transparent" name="Minimum Price" />
                </AreaChart>
              ) : chartMode === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[180px]">
                            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between">
                              <span>{data.date}</span>
                              <span className="text-[10px] text-emerald-400">{data.unit}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span>Modal Price:</span>
                              <span className="text-sm">₹{data.Modal}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Max Grade:</span>
                              <span>₹{data.Maximum}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Min Grade:</span>
                              <span>₹{data.Minimum}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                  <Bar dataKey="Modal" fill="#16a34a" radius={[4, 4, 0, 0]} name="Modal Price (Bulk)" />
                  <Bar dataKey="Maximum" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Maximum Price" />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
                          <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1.5 min-w-[180px]">
                            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex items-center justify-between">
                              <span>{data.date}</span>
                              <span className="text-[10px] text-emerald-400">{data.unit}</span>
                            </div>
                            <div className="flex justify-between items-center text-emerald-400 font-bold">
                              <span>Modal Price:</span>
                              <span className="text-sm">₹{data.Modal}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span>Max Grade:</span>
                              <span>₹{data.Maximum}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400">
                              <span>Min Grade:</span>
                              <span>₹{data.Minimum}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 pt-1 border-t border-slate-800 text-[11px]">
                              <span>Lot Spread:</span>
                              <span>₹{data.Spread}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="Maximum" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Maximum Price" />
                  <Line type="monotone" dataKey="Modal" stroke="#16a34a" strokeWidth={3} dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 6 }} name="Modal Price (Bulk)" />
                  <Line type="monotone" dataKey="Minimum" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Minimum Price" />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Calendar & Missing Dates Continuity Notice */}
      <div className="agri-card p-4 border-l-4 border-l-amber-500 bg-amber-50/40 text-xs text-slate-700">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900">
              Data Continuity & Calendar Notice (Strict Transparency)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Wholesale agricultural yards at Navi Mumbai APMC Vashi are officially closed on Sundays and gazetted Maharashtra holidays.
              {missingDates.length > 0 ? (
                <>
                  {' '}The selected period contains <strong>{missingDates.length}</strong> non-trading dates without records (e.g. {missingDates.slice(0, 3).join(', ')}{missingDates.length > 3 ? '...' : ''}). Missing dates are preserved as non-trading days rather than interpolating or creating artificial prices.
                </>
              ) : (
                ' All expected trading sessions in this period have verified market entries.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Underlying Historical Records Table */}
      <div className="agri-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Underlying Historical Records</h3>
            <p className="text-[11px] text-slate-500">Chronological daily records used to generate the charts and metrics above</p>
          </div>
          <span className="agri-badge-green font-mono">
            {filteredRecords.length} Recorded Days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Market Yard</th>
                <th className="py-2.5 px-3 text-right">Min Price</th>
                <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">Modal Price</th>
                <th className="py-2.5 px-3 text-right">Max Price</th>
                <th className="py-2.5 px-3 text-right">Spread</th>
                <th className="py-2.5 px-3 text-center">Unit</th>
                <th className="py-2.5 px-3 text-right">Arrivals (Qtl)</th>
                <th className="py-2.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRecords.slice(0, 30).map((r) => {
                const spread = r.max_price - r.min_price;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{r.date}</td>
                    <td className="py-2.5 px-3 text-slate-600">{r.market_name}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">₹{r.min_price}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">₹{r.modal_price}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">₹{r.max_price}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 font-medium">₹{spread}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">{r.unit}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-slate-600">
                      {r.arrivals_quintal ? r.arrivals_quintal.toLocaleString() : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onSelectPriceDetail(r)}
                        className="text-xs text-emerald-700 hover:underline font-semibold"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length > 30 && (
          <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-100">
            Showing first 30 of {filteredRecords.length} records. Download CSV to examine complete historical sequence.
          </div>
        )}
      </div>
    </div>
  );
};
