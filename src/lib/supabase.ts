import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Crop, Market, CropPrice, User } from '../types/apmc';
import { INITIAL_CROPS, INITIAL_MARKETS, INITIAL_PRICES } from '../data/seedData';

// Local storage keys
const STORAGE_KEYS = {
  CROPS: 'apmc_crops_v1',
  MARKETS: 'apmc_markets_v1',
  PRICES: 'apmc_prices_v1',
  CONFIG: 'apmc_supabase_config_v1',
  DEMO_AUTH: 'apmc_demo_auth_user_v1',
};

// Check if user has saved credentials in localStorage or Vite env
const savedConfigStr = localStorage.getItem(STORAGE_KEYS.CONFIG);
const savedConfig = savedConfigStr ? JSON.parse(savedConfigStr) : null;

export const SUPABASE_URL = savedConfig?.url || (import.meta as any).env?.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = savedConfig?.anonKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  SUPABASE_URL.startsWith('http') && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

// ============================================================================
// Local Storage Persistence Helpers (Fallback & Offline Resilient Storage)
// ============================================================================

export function getStoredCrops(): Crop[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CROPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(INITIAL_CROPS));
      return INITIAL_CROPS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading crops from storage', e);
    return INITIAL_CROPS;
  }
}

export function saveStoredCrops(crops: Crop[]): void {
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(crops));
}

export function getStoredMarkets(): Market[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MARKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(INITIAL_MARKETS));
      return INITIAL_MARKETS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading markets from storage', e);
    return INITIAL_MARKETS;
  }
}

export function saveStoredMarkets(markets: Market[]): void {
  localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(markets));
}

export function getStoredPrices(): CropPrice[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(INITIAL_PRICES));
      return INITIAL_PRICES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading prices from storage', e);
    return INITIAL_PRICES;
  }
}

export function saveStoredPrices(prices: CropPrice[]): void {
  localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(prices));
}

export function resetToSeedData(): { crops: Crop[]; markets: Market[]; prices: CropPrice[] } {
  localStorage.setItem(STORAGE_KEYS.CROPS, JSON.stringify(INITIAL_CROPS));
  localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(INITIAL_MARKETS));
  localStorage.setItem(STORAGE_KEYS.PRICES, JSON.stringify(INITIAL_PRICES));
  return {
    crops: INITIAL_CROPS,
    markets: INITIAL_MARKETS,
    prices: INITIAL_PRICES,
  };
}

// ============================================================================
// Unified Database Operations (Supabase with Local Resilient Fallback)
// ============================================================================

export async function fetchCrops(): Promise<Crop[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('crops').select('*').order('name');
      if (!error && data && data.length > 0) {
        return data as Crop[];
      }
    } catch (err) {
      console.warn('Supabase fetch crops failed, using local storage fallback:', err);
    }
  }
  return getStoredCrops();
}

export async function fetchMarkets(): Promise<Market[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('markets').select('*').order('is_primary', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Market[];
      }
    } catch (err) {
      console.warn('Supabase fetch markets failed, using local storage fallback:', err);
    }
  }
  return getStoredMarkets();
}

export async function fetchCropPrices(): Promise<CropPrice[]> {
  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('crop_prices')
        .select(`
          id,
          crop_id,
          market_id,
          date,
          min_price,
          max_price,
          modal_price,
          unit,
          arrivals_quintal,
          source,
          data_type,
          crops (name, category),
          markets (name)
        `)
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        // Map joined relation to flat CropPrice shape
        return data.map((item: any) => ({
          id: item.id,
          crop_id: item.crop_id,
          crop_name: item.crops?.name || 'Unknown Crop',
          category: item.crops?.category || 'vegetables',
          market_id: item.market_id,
          market_name: item.markets?.name || 'Navi Mumbai APMC',
          date: item.date,
          min_price: Number(item.min_price),
          max_price: Number(item.max_price),
          modal_price: Number(item.modal_price),
          unit: item.unit,
          arrivals_quintal: item.arrivals_quintal ? Number(item.arrivals_quintal) : undefined,
          source: item.source,
          data_type: item.data_type,
        }));
      }
    } catch (err) {
      console.warn('Supabase fetch prices failed, using local storage fallback:', err);
    }
  }
  return getStoredPrices();
}

export async function insertCropPrice(price: Omit<CropPrice, 'id'>): Promise<CropPrice> {
  const newPrice: CropPrice = {
    ...price,
    id: `price-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  if (supabase && isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from('crop_prices').insert([
        {
          crop_id: price.crop_id,
          market_id: price.market_id,
          date: price.date,
          min_price: price.min_price,
          max_price: price.max_price,
          modal_price: price.modal_price,
          unit: price.unit,
          arrivals_quintal: price.arrivals_quintal || 0,
          source: price.source,
          data_type: price.data_type,
        }
      ]).select().single();

      if (!error && data) {
        newPrice.id = data.id;
      }
    } catch (err) {
      console.warn('Supabase insert failed, storing locally:', err);
    }
  }

  // Also update local storage cache
  const current = getStoredPrices();
  // Check duplicate
  const exists = current.some(
    p => p.crop_id === newPrice.crop_id && p.market_id === newPrice.market_id && p.date === newPrice.date
  );
  if (exists) {
    throw new Error(`Record already exists for this crop, market, and date (${newPrice.date}).`);
  }

  const updated = [newPrice, ...current];
  saveStoredPrices(updated);
  return newPrice;
}

export async function updateCropPrice(id: string, updates: Partial<CropPrice>): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('crop_prices').update(updates).eq('id', id);
    } catch (err) {
      console.warn('Supabase update failed:', err);
    }
  }

  const current = getStoredPrices();
  const index = current.findIndex(p => p.id === id);
  if (index !== -1) {
    current[index] = { ...current[index], ...updates, updated_at: new Date().toISOString() };
    saveStoredPrices(current);
  }
}

export async function deleteCropPrice(id: string): Promise<void> {
  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('crop_prices').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete failed:', err);
    }
  }

  const current = getStoredPrices();
  const filtered = current.filter(p => p.id !== id);
  saveStoredPrices(filtered);
}

export async function insertCrop(crop: Omit<Crop, 'id'>): Promise<Crop> {
  const newCrop: Crop = {
    ...crop,
    id: `crop-${crop.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  };

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('crops').insert([newCrop]);
    } catch (e) {
      console.warn('Supabase crop insert failed:', e);
    }
  }

  const current = getStoredCrops();
  if (current.some(c => c.name.toLowerCase() === newCrop.name.toLowerCase())) {
    throw new Error(`Crop with name "${newCrop.name}" already exists.`);
  }

  const updated = [...current, newCrop];
  saveStoredCrops(updated);
  return newCrop;
}

export async function insertMarket(market: Omit<Market, 'id'>): Promise<Market> {
  const newMarket: Market = {
    ...market,
    id: `mkt-${market.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  };

  if (supabase && isSupabaseConfigured) {
    try {
      await supabase.from('markets').insert([newMarket]);
    } catch (e) {
      console.warn('Supabase market insert failed:', e);
    }
  }

  const current = getStoredMarkets();
  if (current.some(m => m.name.toLowerCase() === newMarket.name.toLowerCase())) {
    throw new Error(`Market with name "${newMarket.name}" already exists.`);
  }

  const updated = [...current, newMarket];
  saveStoredMarkets(updated);
  return newMarket;
}

// ============================================================================
// Authentication & Admin Access
// ============================================================================

export function getActiveUser(): User | null {
  const demoAuth = localStorage.getItem(STORAGE_KEYS.DEMO_AUTH);
  if (demoAuth) {
    try {
      return JSON.parse(demoAuth);
    } catch (e) {
      return null;
    }
  }
  return null;
}

export function loginDemoAdmin(): User {
  const adminUser: User = {
    id: 'admin-vashi-01',
    name: 'APMC Market Superintendent',
    email: 'admin@apmc-vashi.org',
    role: 'admin',
  };
  localStorage.setItem(STORAGE_KEYS.DEMO_AUTH, JSON.stringify(adminUser));
  return adminUser;
}

export function logoutUser(): void {
  localStorage.removeItem(STORAGE_KEYS.DEMO_AUTH);
  if (supabase) {
    supabase.auth.signOut().catch(() => {});
  }
}

export function saveCustomSupabaseConfig(url: string, anonKey: string): void {
  localStorage.setItem(
    STORAGE_KEYS.CONFIG,
    JSON.stringify({ url: url.trim(), anonKey: anonKey.trim() })
  );
  window.location.reload();
}

export function clearCustomSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  window.location.reload();
}
