import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight, 
  ShieldCheck, 
  Calendar, 
  Layers, 
  Scale, 
  Calculator, 
  ChevronRight,
  BarChart2,
  RefreshCw,
  Sparkles,
  Zap
} from 'lucide-react';
import { Crop, CropPrice, Market } from '../../types/apmc';
import { getTopGainersAndLosers, calculatePriceSummary, normalizePrice } from '../../utils/calculations';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AnimatedCounter } from '../AnimatedCounter';
import { MiniSparkline } from '../MiniSparkline';
import confetti from 'canvas-confetti';

interface DashboardPageProps {
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
  setActiveTab: (tab: string) => void;
  setSelectedCropId: (cropId: string) => void;
  onOpenDataStatusModal: () => void;
  onSelectPriceDetail: (price: CropPrice) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  crops,
  markets,
  prices,
  setActiveTab,
  setSelectedCropId,
  onOpenDataStatusModal,
  onSelectPriceDetail,
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationNotice, setSimulationNotice] = useState<string | null>(null);

  // Sort prices by date desc to get latest
  const sortedPrices = [...prices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestDate = sortedPrices[0]?.date || 'N/A';

  // Latest records per crop
  const latestCropPriceMap = new Map<string, CropPrice>();
  sortedPrices.forEach(p => {
    if (!latestCropPriceMap.has(p.crop_id)) {
      latestCropPriceMap.set(p.crop_id, p);
    }
  });

  // Calculate top gainers & losers over 7 days
  const { gainers, losers } = getTopGainersAndLosers(prices, 7);

  // Key staple crops to feature on dashboard
  const stapleCropIds = ['crop-onion', 'crop-tomato', 'crop-potato', 'crop-apple', 'crop-pomegranate', 'crop-green-chilli', 'crop-garlic', 'crop-ginger'];
  const featuredCrops = crops.filter(c => stapleCropIds.includes(c.id));

  // Quick navigation handler
  const handleAnalyzeCrop = (cropId: string) => {
    setSelectedCropId(cropId);
    setActiveTab('historical');
  };

  // Interactive Live Auction Tick Simulator
  const handleSimulateLiveTick = () => {
    setIsSimulating(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#059669', '#f59e0b']
    });

    setTimeout(() => {
      setIsSimulating(false);
      setSimulationNotice('Live Vashi Yard morning auction cleared 14 new truckloads of Nashik Onions and Sangli Pomegranates.');
      setTimeout(() => setSimulationNotice(null), 5000);
    }, 700);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Welcome & Interactive Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-emerald-700/40"
      >
        {/* Animated ambient background shapes */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-400 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut', delay: 2 }}
          className="absolute right-40 -top-10 w-56 h-56 bg-teal-300 rounded-full blur-2xl pointer-events-none" 
        />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-200 border border-emerald-500/40 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Navi Mumbai APMC Terminal Market
            </span>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenDataStatusModal}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/15"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>{isSupabaseConfigured ? 'Supabase Live Sync' : 'Verified APMC Benchmark Records'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSimulateLiveTick}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all ml-auto"
            >
              <RefreshCw className={`w-3 h-3 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Fetching Spot Rates...' : 'Simulate Live Auction'}</span>
            </motion.button>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
            Navi Mumbai APMC Crop Price & Trend Analytics
          </h1>
          <p className="mt-2 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-2xl font-light">
            Empowering farmers, traders, and agri-businesses with transparent daily wholesale auction prices, historical price fluctuation charts, multi-crop comparisons, and net revenue forecasting.
          </p>

          {/* Toast notification for live tick simulation */}
          <AnimatePresence>
            {simulationNotice && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-3 p-2.5 bg-emerald-950/90 border border-emerald-400/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{simulationNotice}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Action Buttons with spring hover */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('historical')}
              className="bg-white hover:bg-emerald-50 text-emerald-950 font-bold px-4 py-2.5 rounded-xl shadow-lg transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95"
            >
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Analyze Historical Trends</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-700" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('comparison')}
              className="bg-emerald-950/60 hover:bg-emerald-900 text-white border border-emerald-400/30 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95 backdrop-blur-xs"
            >
              <Scale className="w-4 h-4 text-emerald-300" />
              <span>Compare Crops</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab('calculator')}
              className="bg-emerald-950/60 hover:bg-emerald-900 text-white border border-emerald-400/30 font-medium px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-xs sm:text-sm active:scale-95 backdrop-blur-xs"
            >
              <Calculator className="w-4 h-4 text-emerald-300" />
              <span>Revenue Calculator</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* KPI Overview Cards with Animated Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="agri-card p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Crops Tracked</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sprout className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            <AnimatedCounter value={crops.length} /> Varieties
          </div>
          <p className="text-xs text-slate-500 mt-1">Fruits & Vegetables in Vashi</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="agri-card p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest Update</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">{latestDate}</div>
          <p className="text-xs text-slate-500 mt-1">APMC Wholesale Yard Session</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="agri-card p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Markets Monitored</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            <AnimatedCounter value={markets.length} /> Mandi Hubs
          </div>
          <p className="text-xs text-slate-500 mt-1">Vashi, Pune & Lasalgaon</p>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
          className="agri-card p-5 hover:border-emerald-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Records</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            <AnimatedCounter value={prices.length} /> Entries
          </div>
          <p className="text-xs text-slate-500 mt-1">Verified Historical Transactions</p>
        </motion.div>
      </div>

      {/* Selected Crop Price Summaries Grid with Mini Sparklines & Interactive Hover */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Key Commodity Spot Rates</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Interactive Sparklines
              </span>
            </h2>
            <p className="text-xs text-slate-500">Latest modal clearance prices & 7-day movement trendlines at Navi Mumbai APMC Vashi</p>
          </div>
          <motion.button
            whileHover={{ x: 3 }}
            onClick={() => setActiveTab('daily-prices')}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View Full Daily Price Table</span>
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCrops.map(crop => {
            const latestPrice = latestCropPriceMap.get(crop.id);
            const cropRecords = prices.filter(p => p.crop_id === crop.id && p.market_id === 'mkt-vashi');
            const summary = calculatePriceSummary(cropRecords);

            if (!latestPrice) return null;

            const isPositive = (summary?.changePercent || 0) >= 0;
            const pricePerKg = normalizePrice(latestPrice.modal_price, latestPrice.unit, 'per_kg');

            // Extract last 7-10 days modal prices for sparkline
            const recentModalSeries = cropRecords.slice(-10).map(r => r.modal_price);

            return (
              <motion.div 
                key={crop.id} 
                whileHover={{ y: -6, scale: 1.015 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="agri-card p-4.5 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden bg-white"
                onClick={() => onSelectPriceDetail(latestPrice)}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="text-2xl p-1 rounded-xl bg-slate-50 group-hover:scale-110 transition-transform">
                        {crop.icon || '🌾'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                          {crop.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 font-medium">{crop.local_name}</p>
                      </div>
                    </div>

                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${
                      isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{Math.abs(summary?.changePercent || 0)}%</span>
                    </span>
                  </div>

                  {/* Price & Sparkline row */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Modal Rate
                      </span>
                      <div className="text-xl font-extrabold text-slate-900 leading-tight">
                        ₹<AnimatedCounter value={latestPrice.modal_price} />
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        / {latestPrice.unit.replace('₹/', '')}
                      </span>
                    </div>

                    {/* Animated SVG Mini Sparkline */}
                    <div className="text-right">
                      <MiniSparkline
                        data={recentModalSeries}
                        width={100}
                        height={32}
                        isPositive={isPositive}
                      />
                      <span className="text-[9px] text-slate-400 font-medium block mt-0.5">
                        7-Day Trajectory
                      </span>
                    </div>
                  </div>

                  {/* Sub-metrics */}
                  <div className="mt-3 pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Per Kg Equivalent:</span>
                      <span className="font-semibold text-emerald-700">₹{pricePerKg} / kg</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span>Auction Range:</span>
                      <span>₹{latestPrice.min_price} – ₹{latestPrice.max_price}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with quick action link */}
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-semibold">
                  <span 
                    onClick={(e) => { e.stopPropagation(); handleAnalyzeCrop(crop.id); }}
                    className="hover:underline flex items-center gap-1"
                  >
                    <span>Analyze Historical Trend</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">{latestPrice.date}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Recent Price Movements: Top Gainers & Losers with Animated Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Gainers */}
        <div className="agri-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Top Price Gainers (Last 7 Days)</h3>
                <p className="text-[11px] text-slate-500">Crops with notable wholesale value appreciation</p>
              </div>
            </div>
            <span className="agri-badge-green font-semibold">Bullish Demand</span>
          </div>

          <div className="divide-y divide-slate-100">
            {gainers.slice(0, 4).map(item => (
              <motion.div 
                key={item.cropId} 
                whileHover={{ x: 4 }}
                className="py-2.5 flex items-center justify-between text-xs cursor-pointer group"
                onClick={() => handleAnalyzeCrop(item.cropId)}
              >
                <div className="flex-1 pr-3">
                  <div className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                    {item.cropName}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.abs(item.changePercent) * 2)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-emerald-500 h-full rounded-full"
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900">₹{item.currentPrice}</div>
                  <span className="text-emerald-600 font-bold text-[11px] flex items-center justify-end gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    +{item.changePercent}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Top Decliners */}
        <div className="agri-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Top Price Decliners (Last 7 Days)</h3>
                <p className="text-[11px] text-slate-500">Crops with supply influx or cooling demand</p>
              </div>
            </div>
            <span className="agri-badge-red font-semibold">Supply Influx</span>
          </div>

          <div className="divide-y divide-slate-100">
            {losers.slice(0, 4).map(item => (
              <motion.div 
                key={item.cropId} 
                whileHover={{ x: 4 }}
                className="py-2.5 flex items-center justify-between text-xs cursor-pointer group"
                onClick={() => handleAnalyzeCrop(item.cropId)}
              >
                <div className="flex-1 pr-3">
                  <div className="font-semibold text-slate-800 group-hover:text-rose-700 transition-colors">
                    {item.cropName}
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.abs(item.changePercent) * 2)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-rose-500 h-full rounded-full"
                    />
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-900">₹{item.currentPrice}</div>
                  <span className="text-rose-600 font-bold text-[11px] flex items-center justify-end gap-0.5">
                    <TrendingDown className="w-3 h-3" />
                    {item.changePercent}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid with 3D Hover Lift */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          onClick={() => setActiveTab('historical')}
          className="agri-card p-5 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BarChart2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Historical Analyzer</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Examine 7, 30, 90-day interactive line charts of onion, tomato, and seasonal crops with highest, lowest, average rates and spread analysis.
          </p>
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 group-hover:underline">
            <span>Explore Trends</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          onClick={() => setActiveTab('comparison')}
          className="agri-card p-5 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Scale className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Crop Comparison Tool</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Compare multiple crops side-by-side with automatic unit normalization (standardizing quintals vs kg) to reveal relative performance.
          </p>
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 group-hover:underline">
            <span>Compare Crops</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.div>

        <motion.div 
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          onClick={() => setActiveTab('calculator')}
          className="agri-card p-5 hover:border-emerald-400 hover:shadow-xl transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1">Net Selling Calculator</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            Calculate your actual take-home revenue after accounting for freight, mandi cess, hamali, and packaging across Navi Mumbai vs Pune APMC.
          </p>
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 group-hover:underline">
            <span>Calculate Profit</span>
            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </span>
        </motion.div>
      </div>
    </div>
  );
};
