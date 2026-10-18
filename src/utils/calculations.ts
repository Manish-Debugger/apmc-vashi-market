import { CropPrice, PriceUnit, PriceSummary, RevenueInputs, RevenueResult, MarketScenario, Market, PriceGainerLoser } from '../types/apmc';

/**
 * Normalizes price between different agricultural trading units.
 * Critical requirement: Do not compare ₹/Kg with ₹/Quintal without conversion!
 * 1 Quintal = 100 Kilograms.
 * Standard Crate = 20 Kilograms.
 */
export function normalizePrice(price: number, fromUnit: PriceUnit | string, targetStandard: 'per_kg' | 'per_quintal'): number {
  let pricePerKg = price;

  if (fromUnit.includes('Quintal')) {
    pricePerKg = price / 100;
  } else if (fromUnit.includes('Crate')) {
    pricePerKg = price / 20; // 20kg crate standard
  } else if (fromUnit.includes('Dozen')) {
    pricePerKg = price / 1.5; // Approx weight per dozen for banana/mango (~1.5kg)
  } else {
    // Already ₹/Kg
    pricePerKg = price;
  }

  if (targetStandard === 'per_kg') {
    return Number(pricePerKg.toFixed(2));
  } else {
    // Per Quintal (100 kg)
    return Number((pricePerKg * 100).toFixed(2));
  }
}

/**
 * Calculates statistical metrics over a sequence of price records
 */
export function calculatePriceSummary(records: CropPrice[]): PriceSummary | null {
  if (!records || records.length === 0) return null;

  // Sort chronological
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latest = sorted[sorted.length - 1];
  const oldest = sorted[0];

  const modalPrices = sorted.map(r => r.modal_price);
  const minPrices = sorted.map(r => r.min_price);
  const maxPrices = sorted.map(r => r.max_price);

  const highestPrice = Math.max(...maxPrices);
  const lowestPrice = Math.min(...minPrices);
  const averagePrice = Math.round(modalPrices.reduce((sum, p) => sum + p, 0) / modalPrices.length);

  const changeValue = latest.modal_price - oldest.modal_price;
  const changePercent = oldest.modal_price > 0 
    ? Number(((changeValue / oldest.modal_price) * 100).toFixed(1))
    : 0;

  return {
    cropId: latest.crop_id,
    cropName: latest.crop_name,
    category: latest.category,
    currentModalPrice: latest.modal_price,
    previousModalPrice: oldest.modal_price,
    changeValue,
    changePercent,
    highestPrice,
    lowestPrice,
    averagePrice,
    priceSpread: latest.max_price - latest.min_price,
    unit: latest.unit,
    lastUpdated: latest.date,
    recordsCount: sorted.length,
  };
}

/**
 * Identifies missing trading dates in a chronological sequence
 */
export function detectMissingDates(records: CropPrice[], startDate: string, endDate: string): string[] {
  const recordedDates = new Set(records.map(r => r.date));
  const missing: string[] = [];

  const curr = new Date(startDate);
  const end = new Date(endDate);

  while (curr <= end) {
    // Exclude Sundays when APMC is closed
    if (curr.getDay() !== 0) {
      const dateStr = curr.toISOString().split('T')[0];
      if (!recordedDates.has(dateStr)) {
        missing.push(dateStr);
      }
    }
    curr.setDate(curr.getDate() + 1);
  }

  return missing;
}

/**
 * Net Selling Revenue Calculator
 * Gross Revenue = Quantity × Selling Price per Unit
 * Estimated Net Revenue = Gross Revenue − Total Expenses
 */
export function calculateNetRevenue(inputs: RevenueInputs): RevenueResult {
  const {
    quantity,
    quantityUnit,
    expectedPricePerUnit,
    transportExpense,
    mandiCessPercent,
    labourHamaliPerUnit,
    packagingCostPerUnit,
    otherExpenses,
  } = inputs;

  let quantityStandardQuintals = quantity;
  let quantityStandardKg = quantity * 100;

  if (quantityUnit === 'Kg') {
    quantityStandardQuintals = quantity / 100;
    quantityStandardKg = quantity;
  } else if (quantityUnit === 'Crate (20kg)') {
    quantityStandardKg = quantity * 20;
    quantityStandardQuintals = quantityStandardKg / 100;
  }

  const grossRevenue = quantity * expectedPricePerUnit;
  const mandiFees = grossRevenue * (mandiCessPercent / 100);
  const labourExpense = quantity * labourHamaliPerUnit;
  const packagingExpense = quantity * packagingCostPerUnit;
  const totalExpenses = transportExpense + mandiFees + labourExpense + packagingExpense + otherExpenses;
  const estimatedNetRevenue = Math.max(0, grossRevenue - totalExpenses);

  const netRealizationPerUnit = quantity > 0 ? estimatedNetRevenue / quantity : 0;
  const netRealizationPerKg = quantityStandardKg > 0 ? estimatedNetRevenue / quantityStandardKg : 0;
  const expenseRatioPercent = grossRevenue > 0 ? (totalExpenses / grossRevenue) * 100 : 0;

  return {
    quantityStandardQuintals,
    quantityStandardKg,
    grossRevenue: Math.round(grossRevenue),
    transportExpense: Math.round(transportExpense),
    mandiFees: Math.round(mandiFees),
    labourExpense: Math.round(labourExpense),
    packagingExpense: Math.round(packagingExpense),
    otherExpenses: Math.round(otherExpenses),
    totalExpenses: Math.round(totalExpenses),
    estimatedNetRevenue: Math.round(estimatedNetRevenue),
    netRealizationPerUnit: Number(netRealizationPerUnit.toFixed(2)),
    netRealizationPerKg: Number(netRealizationPerKg.toFixed(2)),
    expenseRatioPercent: Number(expenseRatioPercent.toFixed(1)),
  };
}

/**
 * Compares multi-market selling scenarios: Navi Mumbai APMC Vashi vs Pune APMC vs Local Village Trader
 */
export function compareMarketScenarios(
  baseInputs: RevenueInputs,
  markets: Market[]
): MarketScenario[] {
  const vashiMarket = markets.find(m => m.id === 'mkt-vashi') || markets[0];
  const puneMarket = markets.find(m => m.id === 'mkt-pune');

  const basePrice = baseInputs.expectedPricePerUnit;
  const scenarios: MarketScenario[] = [];

  // 1. Navi Mumbai APMC Vashi (Terminal Market, premium prices, higher transport)
  const vashiDistance = 120; // km
  const vashiTransport = vashiDistance * 18 + 500; // ₹18/km + toll
  const vashiResult = calculateNetRevenue({
    ...baseInputs,
    expectedPricePerUnit: basePrice,
    transportExpense: vashiTransport,
    mandiCessPercent: vashiMarket?.mandi_cess_percent || 1.05,
  });

  scenarios.push({
    marketId: vashiMarket?.id || 'mkt-vashi',
    marketName: vashiMarket?.name || 'Navi Mumbai APMC (Vashi)',
    location: 'Sector 19, Vashi, Navi Mumbai',
    distanceKm: vashiDistance,
    expectedPricePerUnit: basePrice,
    transportRatePerKm: 18,
    mandiCessPercent: vashiMarket?.mandi_cess_percent || 1.05,
    estimatedNetRevenue: vashiResult.estimatedNetRevenue,
    netRealizationPerKg: vashiResult.netRealizationPerKg,
    isBestOption: false,
  });

  // 2. Navi Mumbai APMC (Vashi) — Direct Bulk Lot Sale
  const directPrice = Math.round(basePrice * 0.98); // 2% negotiated bulk discount
  const directTransport = vashiDistance * 17 + 400; // slightly lower logistics
  const directResult = calculateNetRevenue({
    ...baseInputs,
    expectedPricePerUnit: directPrice,
    transportExpense: directTransport,
    mandiCessPercent: 1.05,
    labourHamaliPerUnit: Math.round(baseInputs.labourHamaliPerUnit * 0.8),
  });

  scenarios.push({
    marketId: 'mkt-vashi-direct',
    marketName: 'Navi Mumbai APMC (Vashi) — Direct Buyer Lot',
    location: 'Sector 18/19, Vashi, Navi Mumbai',
    distanceKm: vashiDistance,
    expectedPricePerUnit: directPrice,
    transportRatePerKm: 17,
    mandiCessPercent: 1.05,
    estimatedNetRevenue: directResult.estimatedNetRevenue,
    netRealizationPerKg: directResult.netRealizationPerKg,
    isBestOption: false,
  });

  // 3. Local Farm-Gate / Village Trader (Zero transport, zero mandi cess, but lower price)
  const localPrice = Math.round(basePrice * 0.84); // 16% discount for convenience
  const localResult = calculateNetRevenue({
    ...baseInputs,
    expectedPricePerUnit: localPrice,
    transportExpense: 0,
    mandiCessPercent: 0,
    labourHamaliPerUnit: 0, // Trader bears loading
  });

  scenarios.push({
    marketId: 'mkt-local',
    marketName: 'Local Village Trader / Farm Gate',
    location: 'At Farm Gate (Nashik / Pune Rural)',
    distanceKm: 0,
    expectedPricePerUnit: localPrice,
    transportRatePerKm: 0,
    mandiCessPercent: 0,
    estimatedNetRevenue: localResult.estimatedNetRevenue,
    netRealizationPerKg: localResult.netRealizationPerKg,
    isBestOption: false,
  });

  // Mark the best option
  let maxRevenue = -1;
  let bestIdx = 0;
  scenarios.forEach((s, idx) => {
    if (s.estimatedNetRevenue > maxRevenue) {
      maxRevenue = s.estimatedNetRevenue;
      bestIdx = idx;
    }
  });

  if (scenarios[bestIdx]) {
    scenarios[bestIdx].isBestOption = true;
  }

  return scenarios;
}

/**
 * Calculates top gainers and decliners over recent 7 days
 */
export function getTopGainersAndLosers(prices: CropPrice[], daysBack = 7): { gainers: PriceGainerLoser[]; losers: PriceGainerLoser[] } {
  const cropMap = new Map<string, CropPrice[]>();
  prices.forEach(p => {
    if (!cropMap.has(p.crop_id)) cropMap.set(p.crop_id, []);
    cropMap.get(p.crop_id)!.push(p);
  });

  const list: PriceGainerLoser[] = [];

  cropMap.forEach((records, cropId) => {
    const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    if (sorted.length < 2) return;

    const latest = sorted[sorted.length - 1];
    // Find price approx daysBack ago
    const targetDate = new Date(latest.date);
    targetDate.setDate(targetDate.getDate() - daysBack);
    const targetStr = targetDate.toISOString().split('T')[0];

    const prev = sorted.find(r => r.date >= targetStr) || sorted[0];

    const changeVal = latest.modal_price - prev.modal_price;
    const changePct = prev.modal_price > 0 ? (changeVal / prev.modal_price) * 100 : 0;

    list.push({
      cropId,
      cropName: latest.crop_name,
      localName: '',
      category: latest.category,
      currentPrice: latest.modal_price,
      previousPrice: prev.modal_price,
      changePercent: Number(changePct.toFixed(1)),
      changeValue: changeVal,
      unit: latest.unit,
    });
  });

  const gainers = list.filter(item => item.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent);
  const losers = list.filter(item => item.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent);

  return { gainers, losers };
}

/**
 * Generates CSV string and triggers browser download
 */
export function exportPricesToCSV(prices: CropPrice[], filename = 'apmc_vashi_crop_prices.csv'): void {
  const headers = ['Crop Name', 'Category', 'Market', 'Date', 'Min Price (₹)', 'Max Price (₹)', 'Modal Price (₹)', 'Unit', 'Arrivals (Qtl)', 'Data Source', 'Record Type'];
  
  const rows = prices.map(p => [
    `"${p.crop_name}"`,
    `"${p.category}"`,
    `"${p.market_name}"`,
    p.date,
    p.min_price,
    p.max_price,
    p.modal_price,
    `"${p.unit}"`,
    p.arrivals_quintal || 0,
    `"${p.source}"`,
    `"${p.data_type}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses user-uploaded CSV text into structured crop price records
 */
export function parseCSVToPrices(
  csvText: string,
  existingPrices: CropPrice[]
): { valid: Omit<CropPrice, 'id'>[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { valid: [], errors: ['CSV file is empty or does not have headers.'] };
  }

  const errors: string[] = [];
  const valid: Omit<CropPrice, 'id'>[] = [];
  const existingSet = new Set(existingPrices.map(p => `${p.crop_id}_${p.market_id}_${p.date}`));

  // Headers: Crop Name, Category, Market Name, Date (YYYY-MM-DD), Min Price, Max Price, Modal Price, Unit, Arrivals, Source
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(cell => cell.replace(/^"(.*)"$/, '$1').trim());
    if (row.length < 7) {
      errors.push(`Row ${i + 1}: Insufficient columns (expected at least 7 columns).`);
      continue;
    }

    const [cropName, category, marketName, date, minStr, maxStr, modalStr, unit, arrivalsStr, source] = row;

    const minPrice = parseFloat(minStr);
    const maxPrice = parseFloat(maxStr);
    const modalPrice = parseFloat(modalStr);

    if (!cropName || !date || isNaN(minPrice) || isNaN(maxPrice) || isNaN(modalPrice)) {
      errors.push(`Row ${i + 1}: Invalid number or missing required field.`);
      continue;
    }

    if (minPrice < 0 || maxPrice < minPrice || modalPrice < minPrice || modalPrice > maxPrice) {
      errors.push(`Row ${i + 1}: Price violation (must satisfy 0 <= Min (${minPrice}) <= Modal (${modalPrice}) <= Max (${maxPrice})).`);
      continue;
    }

    const cropId = `crop-${cropName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const marketId = 'mkt-vashi';

    const key = `${cropId}_${marketId}_${date}`;
    if (existingSet.has(key)) {
      errors.push(`Row ${i + 1}: Duplicate entry for ${cropName} in ${marketName || 'Vashi'} on ${date}.`);
      continue;
    }

    valid.push({
      crop_id: cropId,
      crop_name: cropName,
      category: (category?.toLowerCase() === 'fruits' ? 'fruits' : 'vegetables'),
      market_id: marketId,
      market_name: marketName || 'Navi Mumbai APMC (Vashi)',
      date,
      min_price: minPrice,
      max_price: maxPrice,
      modal_price: modalPrice,
      unit: (unit as PriceUnit) || '₹/Quintal',
      arrivals_quintal: arrivalsStr ? parseFloat(arrivalsStr) : 0,
      source: source || 'Imported CSV Bulletin',
      data_type: 'historical_verified',
    });
  }

  return { valid, errors };
}
