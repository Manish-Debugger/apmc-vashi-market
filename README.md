# APMC Crop Price Information and Trend Analysis System
**Focused initially on Navi Mumbai APMC, Vashi, Maharashtra, India**

A modern, responsive, database-driven web application designed to empower farmers, traders, and agricultural enterprises with transparent wholesale market-price data, interactive historical trend analysis, multi-crop comparisons with unit standardization, and net selling revenue estimations.

---

## 🌾 Core Features & Capabilities

### 1. Home Dashboard
- **Latest Crop-Price Records:** Up-to-date wholesale auction modal rates, minimum and maximum grade prices across 13 major fruit and vegetable commodities.
- **Key Metrics:** Total crops tracked, active market mandis, latest trading session date, and daily arrival volume.
- **Recent Price Movements:** Top gainers and decliners over the last 7 days.
- **Data Authenticity Indicator:** Clear status badge indicating whether data is sourced from live Supabase sync or verified APMC historical benchmarks.
- **Quick Links:** Immediate access to historical charts, comparison tools, and the revenue calculator.

### 2. Daily Crop Price Information
- **Searchable Table:** Instant search across crop names, Marathi/Hindi local aliases (e.g. *कांदा*, *टोमॅटो*, *बटाटा*), and market yards.
- **Multi-parameter Filtering:** Filter by commodity, category (Fruits / Vegetables), market yard (Vashi, Pune, Lasalgaon), and date range.
- **Multi-column Sorting:** Sort by commodity name, date, minimum price, modal price, and maximum price.
- **CSV Export:** Download filtered or full records directly into an Excel-ready CSV spreadsheet.
- **Detailed Drill-Down Modal:** View lot price spreads, kg-to-quintal conversions, arrivals, and bulletin sources.

### 3. Historical Crop Price Analyzer (Main Feature)
- **Commodity Selector:** Explore long-term wholesale curves for Onion, Tomato, Potato, Apple, Pomegranate, Green Chilli, Garlic, Ginger, etc.
- **Period Presets & Custom Ranges:** Analyze over 7 Days, 30 Days, 90 Days, 180 Days, or custom date ranges.
- **Interactive Recharts Visualization:** Dual-curve area and line charts displaying Modal clearance, Maximum grade, and Minimum grade with crosshair tooltips.
- **Key Statistical Metrics:** Highest recorded price, Lowest recorded price, Average modal price, and Percentage change over the selected window.
- **Calendar & Missing Dates Transparency:** Explicit notification of market closures (Sundays and gazetted holidays) to ensure no artificial prices are invented.
- **Underlying Records Table:** Full chronological inspection table with dedicated CSV export.

### 4. Multi-Crop Comparison Tool (Main Feature)
- **Compare 2 to 5 Crops Simultaneously:** Side-by-side relative price curves over a common timeframe.
- **Unit Normalizer:** Automatically standardizes prices to **₹ / Kilogram (Kg)** or **₹ / Quintal (100 Kg)** so that commodities quoted per quintal (e.g. onions at ₹2400/qtl) are fairly compared against commodities quoted per kg or crate.
- **Comparative Metrics Grid:** Starting rate, closing rate, period peak, period floor, and price swing.
- **Automated Market Trend Narrative:** Natural language summary highlighting which crop exhibited the strongest gains and highest price volatility.

### 5. Net Selling Revenue Calculator
- **Inputs:** Crop variety, quantity for sale (Quintals, Kg, or 20kg Crates), expected selling rate, vehicle freight / transport costs (flat or per km formula), statutory APMC mandi cess (1.05% for Vashi), mathadi labour / hamali, packaging costs, and miscellaneous fees.
- **Formulas:**
  - $\text{Gross Turnover} = \text{Quantity} \times \text{Selling Price per Unit}$
  - $\text{Total Expenses} = \text{Freight} + \text{Mandi Cess} + \text{Hamali} + \text{Packaging} + \text{Misc}$
  - $\text{Estimated Net Revenue} = \text{Gross Turnover} - \text{Total Expenses}$
  - $\text{Net Realization per Kg} = \frac{\text{Estimated Net Revenue}}{\text{Total Kg}}$
- **Multi-Market Selling Scenario Comparison:** Compares net take-home realization across **Navi Mumbai APMC (Vashi)** vs **Pune APMC (Gultekdi)** vs **Local Farm-Gate / Village Trader**.
- **Statutory Disclaimer:** Clearly states that calculations are indicative estimates and not guaranteed market returns.

### 6. Price Trend Insights
- **Category Price Indices:** Compares collective fruit vs vegetable price movement.
- **Volatility & Price Risk Ranking:** Categorizes crops by price swing factor (*High Swing*, *Moderate*, *Stable*).
- **Moving Average Momentum Outlook:** Evaluates 7-Day short-term moving average (MA-7) against 30-Day baseline (MA-30) to signal Bullish, Neutral, or Bearish momentum.

### 7. About APMC Vashi
- Comprehensive directory of the **5 specialized market yards**:
  1. Onion & Potato Market Yard (कांदा-बटाटा मार्केट)
  2. Vegetable Market Yard (भाजीपाला मार्केट)
  3. Fruit Market Yard (फळ मार्केट)
  4. Grain, Rice & Oilseeds Yard (धान्य व तेलबिया मार्केट)
  5. Spices Market Yard (मसाले मार्केट)
- Official reporting sources: **AGMARKNET (DMI, GoI)** and **MSAMB (Maharashtra State Agricultural Marketing Board)**.

### 8. Administrator Panel
- **Secure Access:** Supabase Auth support plus 1-Click Demo Administrator bypass for instant evaluation.
- **Price Management:** Add new daily auction prices with validation ($0 \le \text{Min} \le \text{Modal} \le \text{Max}$), edit records, and delete records.
- **Commodity & Market Management:** Add new crop varieties with Marathi/Hindi names and add new APMC market yards.
- **CSV Bulk Importer:** Upload or paste bulk CSV records with syntax and constraint validation.
- **Database Backup & Reset:** Export full database dump or reset to initial 90-day verified benchmark data.

---

## 🛠️ Technology Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS (Custom Agricultural Green & Harvest Gold palette)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Backend & Database:** Supabase with PostgreSQL (with local resilient storage fallback)
- **Authentication:** Supabase Auth / Local admin session

---

## 💾 Database Schema (PostgreSQL / Supabase)
A complete SQL script is available at `src/data/schema.sql` containing:
1. `crops`: UUID, name, local_name, category (`fruits` | `vegetables`), standard_unit, icon, shelf_life_days.
2. `markets`: UUID, name, district, state, location, is_primary, mandi_cess_percent, operating_hours.
3. `crop_prices`: UUID, crop_id (FK), market_id (FK), date, min_price, max_price, modal_price, unit, arrivals_quintal, source, data_type, timestamps.
   - **Unique Constraint:** `(crop_id, market_id, date)` to prevent duplicates.
4. `users`: UUID (FK to auth.users), email, name, role (`admin` | `viewer`).
5. **RLS Policies & Indexes** for high-performance time-series queries.

---

## 🚀 Running the Project Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Vite development server
npm run dev

# 3. Build for production
npm run build
```

Open your browser at `http://localhost:3000` to interact with the platform.
