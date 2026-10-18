-- ==============================================================================
-- APMC Crop Price Information and Trend Analysis System
-- PostgreSQL / Supabase Schema Definition
-- Focused initially on Navi Mumbai APMC, Vashi, Maharashtra, India
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Crops Table
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    local_name VARCHAR(150) NOT NULL, -- Marathi / Hindi name
    category VARCHAR(20) NOT NULL CHECK (category IN ('fruits', 'vegetables')),
    standard_unit VARCHAR(30) NOT NULL DEFAULT '₹/Quintal',
    icon VARCHAR(50),
    shelf_life_days INTEGER DEFAULT 7,
    typical_weight_per_crate_kg NUMERIC(6, 2) DEFAULT 20.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Markets Table
CREATE TABLE IF NOT EXISTS public.markets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL DEFAULT 'Maharashtra',
    location TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    mandi_cess_percent NUMERIC(4, 2) DEFAULT 1.05 CHECK (mandi_cess_percent >= 0),
    operating_hours VARCHAR(100) DEFAULT '04:00 AM - 02:00 PM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Crop Prices Table (Daily Records)
CREATE TABLE IF NOT EXISTS public.crop_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
    market_id UUID NOT NULL REFERENCES public.markets(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    min_price NUMERIC(10, 2) NOT NULL CHECK (min_price >= 0),
    max_price NUMERIC(10, 2) NOT NULL CHECK (max_price >= min_price),
    modal_price NUMERIC(10, 2) NOT NULL CHECK (modal_price >= min_price AND modal_price <= max_price),
    unit VARCHAR(30) NOT NULL DEFAULT '₹/Quintal',
    arrivals_quintal NUMERIC(10, 2) DEFAULT 0 CHECK (arrivals_quintal >= 0),
    source VARCHAR(150) NOT NULL DEFAULT 'Navi Mumbai APMC Vashi Daily Bulletin',
    data_type VARCHAR(30) NOT NULL DEFAULT 'historical_verified' CHECK (data_type IN ('official', 'historical_verified', 'demonstration')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Unique constraint to prevent duplicate entries for the same crop, market, and date
    CONSTRAINT unique_crop_market_date UNIQUE (crop_id, market_id, date)
);

-- 5. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Indexes for High Performance Queries & Historical Filters
CREATE INDEX IF NOT EXISTS idx_crop_prices_crop_date ON public.crop_prices (crop_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_prices_market_date ON public.crop_prices (market_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_crop_prices_date ON public.crop_prices (date DESC);
CREATE INDEX IF NOT EXISTS idx_crops_category ON public.crops (category);

-- 7. Row Level Security (RLS) Policies
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow public read access for crops, markets, and crop prices
CREATE POLICY "Public crops are viewable by everyone" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Public markets are viewable by everyone" ON public.markets FOR SELECT USING (true);
CREATE POLICY "Public crop prices are viewable by everyone" ON public.crop_prices FOR SELECT USING (true);

-- Allow authenticated admins to insert/update/delete
CREATE POLICY "Admins can insert crops" ON public.crops FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update crops" ON public.crops FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete crops" ON public.crops FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert markets" ON public.markets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update markets" ON public.markets FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert crop prices" ON public.crop_prices FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update crop prices" ON public.crop_prices FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete crop prices" ON public.crop_prices FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Helpful view for Denormalized Price Queries
CREATE OR REPLACE VIEW public.v_daily_crop_prices AS
SELECT 
    cp.id,
    c.id AS crop_id,
    c.name AS crop_name,
    c.local_name,
    c.category,
    m.id AS market_id,
    m.name AS market_name,
    m.district,
    cp.date,
    cp.min_price,
    cp.max_price,
    cp.modal_price,
    cp.unit,
    cp.arrivals_quintal,
    cp.source,
    cp.data_type,
    cp.updated_at
FROM public.crop_prices cp
JOIN public.crops c ON cp.crop_id = c.id
JOIN public.markets m ON cp.market_id = m.id;
