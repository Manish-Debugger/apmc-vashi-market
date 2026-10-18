import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Truck, 
  Scale, 
  Coins, 
  HelpCircle, 
  AlertTriangle, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Package, 
  Receipt,
  Building2,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { Crop, CropPrice, Market, RevenueInputs } from '../../types/apmc';
import { calculateNetRevenue, compareMarketScenarios, normalizePrice } from '../../utils/calculations';
import { motion } from 'framer-motion';
import { AnimatedCounter } from '../AnimatedCounter';
import confetti from 'canvas-confetti';

interface RevenueCalculatorPageProps {
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
}

export const RevenueCalculatorPage: React.FC<RevenueCalculatorPageProps> = ({
  crops,
  markets,
  prices,
}) => {
  // Primary inputs
  const [selectedCropId, setSelectedCropId] = useState<string>('crop-onion');
  const [quantity, setQuantity] = useState<number>(50); // e.g. 50 quintals
  const [quantityUnit, setQuantityUnit] = useState<'Quintal' | 'Kg' | 'Crate (20kg)'>('Quintal');
  const [customPrice, setCustomPrice] = useState<string>(''); // if empty, uses latest modal price
  
  // Expenses inputs
  const [transportMode, setTransportMode] = useState<'flat' | 'distance'>('flat');
  const [flatTransportCost, setFlatTransportCost] = useState<number>(3500);
  const [distanceKm, setDistanceKm] = useState<number>(120);
  const [ratePerKm, setRatePerKm] = useState<number>(25);
  const [tollCost, setTollCost] = useState<number>(400);

  const [mandiCessPercent, setMandiCessPercent] = useState<number>(1.05); // standard Vashi APMC cess
  const [labourHamaliPerUnit, setLabourHamaliPerUnit] = useState<number>(18); // ₹18 per bag/crate/quintal
  const [packagingPerUnit, setPackagingPerUnit] = useState<number>(25); // ₹25 per jute bag / plastic crate
  const [otherExpenses, setOtherExpenses] = useState<number>(500); // Weighbridge, misc

  // Active crop and market modal price reference
  const currentCrop = crops.find(c => c.id === selectedCropId) || crops[0];
  const latestPriceRecord = prices.find(p => p.crop_id === selectedCropId && p.market_id === 'mkt-vashi');
  const referenceModalPrice = latestPriceRecord ? latestPriceRecord.modal_price : 2400;

  // Expected price per selected unit
  const activePricePerUnit = useMemo(() => {
    if (customPrice && !isNaN(parseFloat(customPrice))) {
      return parseFloat(customPrice);
    }
    // Calculate reference price converted to selected quantityUnit
    if (quantityUnit === 'Kg') {
      return normalizePrice(referenceModalPrice, currentCrop.standard_unit, 'per_kg');
    } else if (quantityUnit === 'Crate (20kg)') {
      return normalizePrice(referenceModalPrice, currentCrop.standard_unit, 'per_kg') * 20;
    } else {
      // Quintal
      return normalizePrice(referenceModalPrice, currentCrop.standard_unit, 'per_quintal');
    }
  }, [customPrice, referenceModalPrice, quantityUnit, currentCrop]);

  // Total transport expense
  const totalTransportCost = useMemo(() => {
    if (transportMode === 'flat') {
      return flatTransportCost;
    }
    return (distanceKm * ratePerKm) + tollCost;
  }, [transportMode, flatTransportCost, distanceKm, ratePerKm, tollCost]);

  // Base revenue calculation
  const revenueResult = useMemo(() => {
    const inputs: RevenueInputs = {
      cropId: currentCrop.id,
      cropName: currentCrop.name,
      quantity,
      quantityUnit,
      expectedPricePerUnit: activePricePerUnit,
      transportExpense: totalTransportCost,
      mandiCessPercent,
      labourHamaliPerUnit,
      packagingCostPerUnit: packagingPerUnit,
      otherExpenses,
    };
    return calculateNetRevenue(inputs);
  }, [currentCrop, quantity, quantityUnit, activePricePerUnit, totalTransportCost, mandiCessPercent, labourHamaliPerUnit, packagingPerUnit, otherExpenses]);

  // Multi-Market Scenario Comparison
  const marketScenarios = useMemo(() => {
    const inputs: RevenueInputs = {
      cropId: currentCrop.id,
      cropName: currentCrop.name,
      quantity,
      quantityUnit,
      expectedPricePerUnit: activePricePerUnit,
      transportExpense: totalTransportCost,
      mandiCessPercent,
      labourHamaliPerUnit,
      packagingCostPerUnit: packagingPerUnit,
      otherExpenses,
    };
    return compareMarketScenarios(inputs, markets);
  }, [currentCrop, quantity, quantityUnit, activePricePerUnit, totalTransportCost, mandiCessPercent, labourHamaliPerUnit, packagingPerUnit, otherExpenses, markets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Net Selling Revenue & Profitability Calculator
          </h1>
          <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
            Farmer & Trader Tool
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Estimate take-home earnings by subtracting transport freight, mandi cess, hamali, and packaging from gross wholesale sales
        </p>
      </div>

      {/* Main Two-Column Layout: Inputs on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Parameter Inputs */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. Crop & Volume Details */}
          <div className="agri-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <span>1. Commodity & Quantity for Sale</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Crop
                </label>
                <select
                  value={selectedCropId}
                  onChange={(e) => {
                    setSelectedCropId(e.target.value);
                    setCustomPrice(''); // reset to new crop modal
                  }}
                  className="agri-select w-full text-xs font-medium"
                >
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name} ({c.local_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit of Sale
                </label>
                <select
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value as any)}
                  className="agri-select w-full text-xs font-medium"
                >
                  <option value="Quintal">Quintals (100 kg)</option>
                  <option value="Kg">Kilograms (Kg)</option>
                  <option value="Crate (20kg)">Plastic Crates (~20 kg)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Quantity Available
                  </label>
                  <span className="text-xs font-bold text-emerald-700 font-mono">
                    {quantity} {quantityUnit}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max={quantityUnit === 'Kg' ? 5000 : 250}
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg mb-2"
                />
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseFloat(e.target.value) || 0))}
                  className="agri-input w-full text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Total weight: {revenueResult.quantityStandardKg.toLocaleString()} kg ({revenueResult.quantityStandardQuintals} Quintals)
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Selling Rate (₹ / {quantityUnit})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-xs">₹</span>
                  <input
                    type="number"
                    min="1"
                    placeholder={`Market Benchmark: ₹${activePricePerUnit}`}
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    className="agri-input w-full pl-7 text-xs font-bold text-emerald-800"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Vashi Spot Benchmark: <strong>₹{activePricePerUnit}</strong></span>
                  {customPrice && (
                    <button 
                      onClick={() => setCustomPrice('')} 
                      className="text-emerald-700 underline"
                    >
                      Use Benchmark
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Transportation & Freight Details */}
          <div className="agri-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>2. Transportation & Freight</span>
              </h2>

              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setTransportMode('flat')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    transportMode === 'flat' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Flat Trip Rate
                </button>
                <button
                  type="button"
                  onClick={() => setTransportMode('distance')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    transportMode === 'distance' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Per Km Formula
                </button>
              </div>
            </div>

            {transportMode === 'flat' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Vehicle Hiring / Freight Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={flatTransportCost}
                  onChange={(e) => setFlatTransportCost(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="agri-input w-full text-xs font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Includes pickup from farm gate to Navi Mumbai APMC Vashi
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Distance (Km)</label>
                    <span className="text-[11px] font-bold text-slate-700 font-mono">{distanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 10)}
                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg mb-1.5"
                  />
                  <input
                    type="number"
                    min="1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="agri-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rate per Km (₹)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={ratePerKm}
                    onChange={(e) => setRatePerKm(Math.max(1, parseFloat(e.target.value) || 0))}
                    className="agri-input w-full text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tolls / Entry (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={tollCost}
                    onChange={(e) => setTollCost(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="agri-input w-full text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Mandi Cess, Hamali & Packaging */}
          <div className="agri-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>3. Mandi Deductions, Hamali & Packaging</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  APMC Mandi Cess (% of Gross)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="10"
                    value={mandiCessPercent}
                    onChange={(e) => setMandiCessPercent(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="agri-input w-full text-xs font-medium"
                  />
                  <span className="absolute right-3 top-2 text-slate-400 font-bold text-xs">%</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Navi Mumbai APMC statutory cess is 1.05%
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Labour / Hamali (₹ / {quantityUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={labourHamaliPerUnit}
                  onChange={(e) => setLabourHamaliPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="agri-input w-full text-xs font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Loading & unloading mathadi charges
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bags / Packaging (₹ / {quantityUnit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={packagingPerUnit}
                  onChange={(e) => setPackagingPerUnit(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="agri-input w-full text-xs font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Gunny bag, crates or net packaging
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Miscellaneous Expenses (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={otherExpenses}
                  onChange={(e) => setOtherExpenses(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="agri-input w-full text-xs font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Weighbridge, cleaning, gate pass
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Net Calculation Results */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Profit Card */}
          <div className="agri-card p-6 bg-gradient-to-b from-emerald-900 to-teal-950 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-emerald-800 pb-3 mb-4">
              <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold">
                Estimated Net Selling Revenue
              </span>
              <span className="text-[10px] bg-emerald-800/80 text-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                Take-Home Realization
              </span>
            </div>

            <div className="mb-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                <AnimatedCounter value={revenueResult.estimatedNetRevenue} prefix="₹" />
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-emerald-200">
                <span>Net ₹<strong>{revenueResult.netRealizationPerUnit}</strong> / {quantityUnit}</span>
                <span>•</span>
                <span>Net ₹<strong>{revenueResult.netRealizationPerKg}</strong> / kg</span>
              </div>
            </div>

            {/* Step by Step Breakdown */}
            <div className="space-y-2.5 bg-emerald-950/60 p-4 rounded-xl border border-emerald-800/80 text-xs">
              <div className="flex justify-between items-center text-emerald-100">
                <span>Gross Auction Turnover:</span>
                <span className="font-bold text-white text-sm">
                  ₹{revenueResult.grossRevenue.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between items-center text-rose-300 pt-1 border-t border-emerald-900">
                <span>Less Transport Freight:</span>
                <span>- ₹{revenueResult.transportExpense.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-rose-300">
                <span>Less APMC Mandi Cess ({mandiCessPercent}%):</span>
                <span>- ₹{revenueResult.mandiFees.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-rose-300">
                <span>Less Hamali / Labour:</span>
                <span>- ₹{revenueResult.labourExpense.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-rose-300">
                <span>Less Bags & Packaging:</span>
                <span>- ₹{revenueResult.packagingExpense.toLocaleString()}</span>
              </div>

              {revenueResult.otherExpenses > 0 && (
                <div className="flex justify-between items-center text-rose-300">
                  <span>Less Misc & Weighbridge:</span>
                  <span>- ₹{revenueResult.otherExpenses.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-white pt-2 border-t border-emerald-800 font-bold">
                <span>Total Deductions:</span>
                <span className="text-rose-400">
                  - ₹{revenueResult.totalExpenses.toLocaleString()} ({revenueResult.expenseRatioPercent}%)
                </span>
              </div>
            </div>

            {/* Expense Ratio Visual Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-emerald-200 mb-1">
                <span>Farmer Retention: {(100 - revenueResult.expenseRatioPercent).toFixed(1)}%</span>
                <span>Cost Drag: {revenueResult.expenseRatioPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-emerald-950 overflow-hidden flex">
                <div 
                  className="bg-emerald-400 h-full rounded-l-full" 
                  style={{ width: `${Math.max(5, 100 - revenueResult.expenseRatioPercent)}%` }} 
                />
                <div 
                  className="bg-rose-500 h-full rounded-r-full" 
                  style={{ width: `${revenueResult.expenseRatioPercent}%` }} 
                />
              </div>
            </div>

            {/* Celebrate / Optimize Action */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                confetti({
                  particleCount: 50,
                  spread: 70,
                  origin: { y: 0.6 },
                  colors: ['#10b981', '#34d399', '#059669', '#f59e0b', '#3b82f6']
                });
              }}
              className="mt-4 w-full py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Coins className="w-4 h-4" />
              <span>Validate & Lock Scenario</span>
            </motion.button>
          </div>

          {/* Statutory Disclaimer Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Revenue Estimate Notice</span>
            </div>
            <p className="text-[11px] text-amber-800/90 leading-relaxed">
              This calculator provides simulated economic realization based on user-entered logistics and standard APMC fee structures. It estimates net revenue, not guaranteed profit, and does not constitute a guaranteed market buying recommendation without verified spot auction contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Multi-Market Selling Scenario Comparison */}
      <div className="agri-card p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" />
              <span>Hypothetical Multi-Market Selling Comparison</span>
            </h2>
            <p className="text-xs text-slate-500">
              Evaluate whether higher wholesale prices in Navi Mumbai APMC Vashi compensate for additional freight distance compared to local hubs
            </p>
          </div>
          <span className="agri-badge-green">Scenario Analyzer</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {marketScenarios.map((scenario) => (
            <div 
              key={scenario.marketId}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                scenario.isBestOption
                  ? 'bg-emerald-50/60 border-emerald-400 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{scenario.marketName}</h3>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{scenario.location} ({scenario.distanceKm} km)</span>
                    </p>
                  </div>
                  {scenario.isBestOption && (
                    <span className="agri-badge-green text-[10px] py-0.5">
                      Highest Net
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 my-3 py-2 border-y border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Expected Wholesale Rate:</span>
                    <span className="font-bold text-slate-800">₹{scenario.expectedPricePerUnit} / {quantityUnit}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Est. Freight + Tolls:</span>
                    <span className="font-medium text-slate-700">
                      {scenario.distanceKm > 0 ? `₹${(scenario.distanceKm * scenario.transportRatePerKm).toLocaleString()}` : '₹0 (Farm Gate)'}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Mandi Cess:</span>
                    <span className="font-medium text-slate-700">{scenario.mandiCessPercent}%</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="pt-2">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">
                    Estimated Net Take-Home
                  </span>
                  <div className="text-xl font-extrabold text-slate-900 mt-0.5">
                    ₹{scenario.estimatedNetRevenue.toLocaleString()}
                  </div>
                  <span className="text-xs font-semibold text-emerald-700">
                    ₹{scenario.netRealizationPerKg} / kg net
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
