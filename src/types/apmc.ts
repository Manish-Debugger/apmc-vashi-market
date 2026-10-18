export type CropCategory = 'fruits' | 'vegetables';

export type PriceUnit = '₹/Quintal' | '₹/Kg' | '₹/Crate' | '₹/Dozen';

export type DataType = 'official' | 'historical_verified' | 'demonstration';

export interface Crop {
  id: string;
  name: string;
  local_name: string; // Marathi/Hindi name e.g. "कांदा / Kanda"
  category: CropCategory;
  standard_unit: PriceUnit;
  icon?: string;
  shelf_life_days?: number;
  typical_weight_per_crate_kg?: number;
}

export interface Market {
  id: string;
  name: string;
  district: string;
  state: string;
  location: string;
  is_primary: boolean;
  mandi_cess_percent: number;
  avg_distance_from_farm_km?: number;
  operating_hours?: string;
}

export interface CropPrice {
  id: string;
  crop_id: string;
  crop_name: string;
  category: CropCategory;
  market_id: string;
  market_name: string;
  date: string; // YYYY-MM-DD
  min_price: number;
  max_price: number;
  modal_price: number;
  unit: PriceUnit;
  arrivals_quintal?: number;
  source: string;
  data_type: DataType;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'viewer';
}

export interface PriceFilterOptions {
  search?: string;
  cropId?: string;
  category?: 'all' | CropCategory;
  marketId?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'date' | 'crop_name' | 'modal_price' | 'min_price' | 'max_price';
  sortOrder?: 'asc' | 'desc';
}

export interface PriceSummary {
  cropId: string;
  cropName: string;
  category: CropCategory;
  currentModalPrice: number;
  previousModalPrice: number;
  changeValue: number;
  changePercent: number;
  highestPrice: number;
  lowestPrice: number;
  averagePrice: number;
  priceSpread: number;
  unit: PriceUnit;
  lastUpdated: string;
  recordsCount: number;
}

export interface ComparisonDataPoint {
  date: string;
  displayDate: string;
  [key: string]: string | number; // Dynamic keys for crop prices e.g. "Onion": 2400
}

export interface RevenueInputs {
  cropId: string;
  cropName: string;
  quantity: number;
  quantityUnit: 'Quintal' | 'Kg' | 'Crate (20kg)';
  expectedPricePerUnit: number; // in ₹ per selected quantityUnit
  transportExpense: number; // Flat or calculated
  mandiCessPercent: number; // e.g. 1.05%
  labourHamaliPerUnit: number; // per bag/crate/quintal
  packagingCostPerUnit: number; // per bag/crate
  otherExpenses: number; // Misc/toll
}

export interface RevenueResult {
  quantityStandardQuintals: number;
  quantityStandardKg: number;
  grossRevenue: number;
  transportExpense: number;
  mandiFees: number;
  labourExpense: number;
  packagingExpense: number;
  otherExpenses: number;
  totalExpenses: number;
  estimatedNetRevenue: number;
  netRealizationPerUnit: number;
  netRealizationPerKg: number;
  expenseRatioPercent: number;
}

export interface MarketScenario {
  marketId: string;
  marketName: string;
  location: string;
  distanceKm: number;
  expectedPricePerUnit: number;
  transportRatePerKm: number;
  mandiCessPercent: number;
  estimatedNetRevenue: number;
  netRealizationPerKg: number;
  isBestOption: boolean;
}

export interface PriceGainerLoser {
  cropId: string;
  cropName: string;
  localName: string;
  category: CropCategory;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  changeValue: number;
  unit: PriceUnit;
}
