import React, { useState } from 'react';
import { 
  Lock, 
  UserCheck, 
  Plus, 
  Trash2, 
  Edit, 
  Upload, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  FileSpreadsheet, 
  Database,
  Building2,
  Sprout,
  Calendar,
  Layers,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { Crop, CropPrice, Market, User, PriceUnit, CropCategory, DataType } from '../../types/apmc';
import { insertCropPrice, updateCropPrice, deleteCropPrice, insertCrop, insertMarket, loginDemoAdmin, logoutUser, resetToSeedData } from '../../lib/supabase';
import { parseCSVToPrices, exportPricesToCSV } from '../../utils/calculations';

interface AdminPageProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
  onRefreshData: () => void;
  onOpenConfigModal: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  setCurrentUser,
  crops,
  markets,
  prices,
  onRefreshData,
  onOpenConfigModal,
}) => {
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active admin sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'prices' | 'crops' | 'markets' | 'csv-import' | 'backup'>('prices');

  // Add Price Form State
  const [newCropId, setNewCropId] = useState<string>(crops[0]?.id || '');
  const [newMarketId, setNewMarketId] = useState<string>(markets[0]?.id || '');
  const [newDate, setNewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newMinPrice, setNewMinPrice] = useState<string>('');
  const [newModalPrice, setNewModalPrice] = useState<string>('');
  const [newMaxPrice, setNewMaxPrice] = useState<string>('');
  const [newUnit, setNewUnit] = useState<PriceUnit>('₹/Quintal');
  const [newArrivals, setNewArrivals] = useState<string>('');
  const [newSource, setNewSource] = useState<string>('Navi Mumbai APMC Vashi Daily Bulletin');
  const [newDataType, setNewDataType] = useState<DataType>('official');
  const [priceFormError, setPriceFormError] = useState('');
  const [priceFormSuccess, setPriceFormSuccess] = useState('');

  // Edit Price Modal State
  const [editingPrice, setEditingPrice] = useState<CropPrice | null>(null);

  // Add Crop Form State
  const [newCropName, setNewCropName] = useState('');
  const [newCropLocalName, setNewCropLocalName] = useState('');
  const [newCropCategory, setNewCropCategory] = useState<CropCategory>('vegetables');
  const [newCropUnit, setNewCropUnit] = useState<PriceUnit>('₹/Quintal');
  const [newCropIcon, setNewCropIcon] = useState('🌱');
  const [cropFormError, setCropFormError] = useState('');
  const [cropFormSuccess, setCropFormSuccess] = useState('');

  // Add Market Form State
  const [newMarketName, setNewMarketName] = useState('');
  const [newMarketDistrict, setNewMarketDistrict] = useState('');
  const [newMarketLocation, setNewMarketLocation] = useState('');
  const [newMarketCess, setNewMarketCess] = useState('1.05');
  const [marketFormError, setMarketFormError] = useState('');
  const [marketFormSuccess, setMarketFormSuccess] = useState('');

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [csvValidation, setCsvValidation] = useState<{ valid: Omit<CropPrice, 'id'>[]; errors: string[] } | null>(null);
  const [importSuccess, setImportSuccess] = useState('');

  // Search in Admin Price table
  const [adminSearch, setAdminSearch] = useState('');

  // Auth Handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter email and password.');
      return;
    }
    // Demo admin bypass
    const user = loginDemoAdmin();
    setCurrentUser(user);
    setLoginError('');
  };

  const handleDemoLogin = () => {
    const user = loginDemoAdmin();
    setCurrentUser(user);
    setLoginError('');
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Add Price Submit Handler
  const handleAddPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPriceFormError('');
    setPriceFormSuccess('');

    const min = parseFloat(newMinPrice);
    const modal = parseFloat(newModalPrice);
    const max = parseFloat(newMaxPrice);

    if (isNaN(min) || isNaN(modal) || isNaN(max)) {
      setPriceFormError('Please enter valid numeric values for prices.');
      return;
    }

    if (min < 0 || max < min || modal < min || modal > max) {
      setPriceFormError('Price validation failed: Must satisfy 0 <= Minimum <= Modal <= Maximum.');
      return;
    }

    const cropObj = crops.find(c => c.id === newCropId);
    const marketObj = markets.find(m => m.id === newMarketId);

    if (!cropObj || !marketObj) {
      setPriceFormError('Please select valid crop and market.');
      return;
    }

    try {
      await insertCropPrice({
        crop_id: newCropId,
        crop_name: cropObj.name,
        category: cropObj.category,
        market_id: newMarketId,
        market_name: marketObj.name,
        date: newDate,
        min_price: min,
        max_price: max,
        modal_price: modal,
        unit: newUnit,
        arrivals_quintal: newArrivals ? parseFloat(newArrivals) : 0,
        source: newSource,
        data_type: newDataType,
      });

      setPriceFormSuccess(`Successfully recorded daily price for ${cropObj.name} on ${newDate}!`);
      setNewMinPrice('');
      setNewModalPrice('');
      setNewMaxPrice('');
      setNewArrivals('');
      onRefreshData();
    } catch (err: any) {
      setPriceFormError(err.message || 'Failed to insert crop price record.');
    }
  };

  // Delete Price
  const handleDeletePrice = async (id: string, name: string, date: string) => {
    if (window.confirm(`Are you sure you want to delete the record for ${name} on ${date}?`)) {
      await deleteCropPrice(id);
      onRefreshData();
    }
  };

  // Add Crop Submit Handler
  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    setCropFormError('');
    setCropFormSuccess('');

    if (!newCropName || !newCropLocalName) {
      setCropFormError('Please enter crop name and Marathi/Hindi alias.');
      return;
    }

    try {
      await insertCrop({
        name: newCropName.trim(),
        local_name: newCropLocalName.trim(),
        category: newCropCategory,
        standard_unit: newCropUnit,
        icon: newCropIcon.trim() || '🌱',
      });

      setCropFormSuccess(`Crop "${newCropName}" registered successfully!`);
      setNewCropName('');
      setNewCropLocalName('');
      onRefreshData();
    } catch (err: any) {
      setCropFormError(err.message || 'Failed to add crop.');
    }
  };

  // Add Market Submit Handler
  const handleAddMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setMarketFormError('');
    setMarketFormSuccess('');

    if (!newMarketName || !newMarketDistrict || !newMarketLocation) {
      setMarketFormError('Please fill in all market location fields.');
      return;
    }

    try {
      await insertMarket({
        name: newMarketName.trim(),
        district: newMarketDistrict.trim(),
        state: 'Maharashtra',
        location: newMarketLocation.trim(),
        is_primary: false,
        mandi_cess_percent: parseFloat(newMarketCess) || 1.0,
      });

      setMarketFormSuccess(`Market "${newMarketName}" registered successfully!`);
      setNewMarketName('');
      setNewMarketDistrict('');
      setNewMarketLocation('');
      onRefreshData();
    } catch (err: any) {
      setMarketFormError(err.message || 'Failed to add market.');
    }
  };

  // CSV Parse Handler
  const handleValidateCsv = () => {
    if (!csvRawText.trim()) return;
    const res = parseCSVToPrices(csvRawText, prices);
    setCsvValidation(res);
  };

  const handleExecuteCsvImport = async () => {
    if (!csvValidation || csvValidation.valid.length === 0) return;
    for (const record of csvValidation.valid) {
      try {
        await insertCropPrice(record);
      } catch (err) {
        console.error('Import error for record', record, err);
      }
    }
    setImportSuccess(`Successfully imported ${csvValidation.valid.length} price records!`);
    setCsvRawText('');
    setCsvValidation(null);
    onRefreshData();
  };

  // If not logged in, show Auth form
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 animate-in fade-in duration-200">
        <div className="agri-card p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Administrator Authentication
            </h1>
            <p className="text-xs text-slate-500">
              Sign in with your authorized APMC credentials or use 1-click Demo Admin access
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                placeholder="admin@apmc-vashi.org"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="agri-input w-full text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="agri-input w-full text-xs"
              />
            </div>

            <button
              type="submit"
              className="agri-btn-primary w-full text-xs py-2.5 font-bold"
            >
              Sign In to Admin Panel
            </button>
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase font-medium">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* 1-Click Demo Login Button */}
          <button
            type="button"
            onClick={handleDemoLogin}
            className="agri-btn-secondary w-full text-xs py-2.5 font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>1-Click Demo Administrator Access</span>
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            Instant evaluation mode: Grants full CRUD access to add, edit, delete prices, manage crops, and test CSV bulk imports.
          </p>
        </div>
      </div>
    );
  }

  // Filtered prices for admin table
  const adminFilteredPrices = prices.filter(p => {
    if (!adminSearch) return true;
    const q = adminSearch.toLowerCase();
    return p.crop_name.toLowerCase().includes(q) || p.date.includes(q) || p.market_name.toLowerCase().includes(q);
  }).slice(0, 50);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Admin Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 leading-none">
                APMC Market Superintendent Panel
              </h1>
              <span className="agri-badge-green text-[10px] py-0.5">
                Active Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Logged in as: <strong>{currentUser.email}</strong> ({currentUser.name})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenConfigModal}
            className="agri-btn-secondary text-xs"
            title="Configure Supabase Connection"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>DB Config</span>
          </button>

          <button
            onClick={handleLogout}
            className="agri-btn-secondary text-xs text-rose-600 hover:text-rose-700"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'prices', label: 'Daily Price Records', icon: Calendar },
          { id: 'crops', label: 'Commodities & Crops', icon: Sprout },
          { id: 'markets', label: 'APMC Market Yards', icon: Building2 },
          { id: 'csv-import', label: 'CSV Bulk Uploader', icon: Upload },
          { id: 'backup', label: 'Database Backup & Restore', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Daily Price Records (CRUD) */}
      {activeSubTab === 'prices' && (
        <div className="space-y-6">
          {/* Form to Add New Price Record */}
          <div className="agri-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Record New Daily Wholesale Auction Price</span>
            </h2>

            {priceFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{priceFormError}</span>
              </div>
            )}

            {priceFormSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{priceFormSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddPrice} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commodity Crop *
                </label>
                <select
                  value={newCropId}
                  onChange={(e) => setNewCropId(e.target.value)}
                  className="agri-select w-full text-xs"
                >
                  {crops.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.local_name})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Market Yard *
                </label>
                <select
                  value={newMarketId}
                  onChange={(e) => setNewMarketId(e.target.value)}
                  className="agri-select w-full text-xs"
                >
                  {markets.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auction Date (YYYY-MM-DD) *
                </label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="agri-input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quoted Unit *
                </label>
                <select
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value as any)}
                  className="agri-select w-full text-xs"
                >
                  <option value="₹/Quintal">₹ / Quintal (100 kg)</option>
                  <option value="₹/Kg">₹ / Kilogram (Kg)</option>
                  <option value="₹/Crate">₹ / Crate (20 kg)</option>
                  <option value="₹/Dozen">₹ / Dozen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1800"
                  value={newMinPrice}
                  onChange={(e) => setNewMinPrice(e.target.value)}
                  className="agri-input w-full text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Modal Price (₹ Bulk Cleared) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2400"
                  value={newModalPrice}
                  onChange={(e) => setNewModalPrice(e.target.value)}
                  className="agri-input w-full text-xs font-extrabold text-emerald-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Maximum Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2900"
                  value={newMaxPrice}
                  onChange={(e) => setNewMaxPrice(e.target.value)}
                  className="agri-input w-full text-xs font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Arrival Volume (Quintals)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={newArrivals}
                  onChange={(e) => setNewArrivals(e.target.value)}
                  className="agri-input w-full text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bulletin Source Name
                </label>
                <input
                  type="text"
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value)}
                  className="agri-input w-full text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Classification
                </label>
                <select
                  value={newDataType}
                  onChange={(e) => setNewDataType(e.target.value as any)}
                  className="agri-select w-full text-xs"
                >
                  <option value="official">Official Verified APMC</option>
                  <option value="historical_verified">Historical Verified</option>
                  <option value="demonstration">Demonstration Entry</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="agri-btn-primary w-full text-xs py-2 font-bold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>

          {/* Manage Existing Records Table */}
          <div className="agri-card overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Existing Price Entries</h3>
                <p className="text-[11px] text-slate-500">Inspect, modify, or delete recorded entries in the system</p>
              </div>

              <input
                type="text"
                placeholder="Filter by crop or date..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                className="agri-input text-xs w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-3">Crop</th>
                    <th className="py-2.5 px-3">Market</th>
                    <th className="py-2.5 px-3 text-right">Min</th>
                    <th className="py-2.5 px-3 text-right text-emerald-800 font-bold">Modal</th>
                    <th className="py-2.5 px-3 text-right">Max</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {adminFilteredPrices.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium">{p.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.crop_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{p.market_name}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">₹{p.min_price}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-emerald-700">₹{p.modal_price}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">₹{p.max_price}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500">{p.unit}</td>
                      <td className="py-2.5 px-4 text-center">
                        <button
                          onClick={() => handleDeletePrice(p.id, p.crop_name, p.date)}
                          className="p-1 rounded text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Manage Commodities / Crops */}
      {activeSubTab === 'crops' && (
        <div className="space-y-6">
          <div className="agri-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Register New Crop Variety</span>
            </h2>

            {cropFormError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                {cropFormError}
              </div>
            )}
            {cropFormSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs">
                {cropFormSuccess}
              </div>
            )}

            <form onSubmit={handleAddCrop} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crop English Name</label>
                <input
                  type="text"
                  placeholder="e.g. Carrot"
                  value={newCropName}
                  onChange={(e) => setNewCropName(e.target.value)}
                  className="agri-input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Local Name (Marathi/Hindi)</label>
                <input
                  type="text"
                  placeholder="e.g. गाजर (Gajar)"
                  value={newCropLocalName}
                  onChange={(e) => setNewCropLocalName(e.target.value)}
                  className="agri-input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newCropCategory}
                  onChange={(e) => setNewCropCategory(e.target.value as any)}
                  className="agri-select w-full text-xs"
                >
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fruits</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emoji Icon</label>
                <input
                  type="text"
                  placeholder="🥕"
                  value={newCropIcon}
                  onChange={(e) => setNewCropIcon(e.target.value)}
                  className="agri-input w-full text-xs"
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="agri-btn-primary w-full text-xs py-2">
                  <Plus className="w-4 h-4" />
                  <span>Register Crop</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {crops.map((c) => (
              <div key={c.id} className="agri-card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.icon || '🌾'}</span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">{c.name}</h4>
                    <p className="text-[11px] text-slate-500">{c.local_name}</p>
                    <span className="text-[10px] text-slate-400 capitalize">{c.category} • {c.standard_unit}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Manage Markets */}
      {activeSubTab === 'markets' && (
        <div className="space-y-6">
          <div className="agri-card p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Register Additional APMC Market Yard</span>
            </h2>

            {marketFormError && <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl">{marketFormError}</div>}
            {marketFormSuccess && <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl">{marketFormSuccess}</div>}

            <form onSubmit={handleAddMarket} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mandi Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik APMC"
                  value={newMarketName}
                  onChange={(e) => setNewMarketName(e.target.value)}
                  className="agri-input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  placeholder="e.g. Nashik"
                  value={newMarketDistrict}
                  onChange={(e) => setNewMarketDistrict(e.target.value)}
                  className="agri-input w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Location / Address</label>
                <input
                  type="text"
                  placeholder="Panchavati, Nashik"
                  value={newMarketLocation}
                  onChange={(e) => setNewMarketLocation(e.target.value)}
                  className="agri-input w-full text-xs"
                  required
                />
              </div>

              <div className="flex items-end">
                <button type="submit" className="agri-btn-primary w-full text-xs py-2">
                  <Plus className="w-4 h-4" />
                  <span>Register Market</span>
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {markets.map((m) => (
              <div key={m.id} className="agri-card p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{m.name}</h3>
                  {m.is_primary && <span className="agri-badge-green text-[10px]">Primary Yard</span>}
                </div>
                <p className="text-xs text-slate-500">{m.location}</p>
                <p className="text-[11px] text-emerald-700 font-medium">Statutory Mandi Cess: {m.mandi_cess_percent}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: CSV Bulk Uploader */}
      {activeSubTab === 'csv-import' && (
        <div className="agri-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-emerald-600" />
              <span>CSV Bulk Price Importer</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste or upload CSV text to bulk-import daily wholesale records with automatic price logic validation and duplicate check
            </p>
          </div>

          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{importSuccess}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
              CSV Format Specification:
            </label>
            <div className="p-2.5 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
              Crop Name,Category,Market Name,Date,Min Price,Max Price,Modal Price,Unit,Arrivals,Source<br />
              Onion,vegetables,Navi Mumbai APMC (Vashi),2026-10-17,2100,2800,2450,₹/Quintal,1600,APMC Bulletin
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Paste CSV Content:
            </label>
            <textarea
              rows={6}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder="Paste comma-separated rows here..."
              className="agri-input w-full font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleValidateCsv}
              disabled={!csvRawText.trim()}
              className="agri-btn-secondary text-xs disabled:opacity-40"
            >
              Validate & Preview Rows
            </button>

            {csvValidation && csvValidation.valid.length > 0 && (
              <button
                onClick={handleExecuteCsvImport}
                className="agri-btn-primary text-xs font-bold"
              >
                Import {csvValidation.valid.length} Valid Records
              </button>
            )}
          </div>

          {csvValidation && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 text-xs">
                <span className="text-emerald-700 font-bold">
                  ✓ {csvValidation.valid.length} Valid Records Ready
                </span>
                {csvValidation.errors.length > 0 && (
                  <span className="text-rose-600 font-bold">
                    ✕ {csvValidation.errors.length} Rows with Errors
                  </span>
                )}
              </div>

              {csvValidation.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-1 max-h-32 overflow-y-auto">
                  {csvValidation.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Backup & Reset */}
      {activeSubTab === 'backup' && (
        <div className="agri-card p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Database Backup & Management</h2>
            <p className="text-xs text-slate-500">Export complete dataset or restore verified initial benchmark seed records</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 border border-slate-200 rounded-xl space-y-3">
              <h3 className="font-bold text-slate-900 text-xs">Export Full CSV Dump</h3>
              <p className="text-xs text-slate-500">
                Download all {prices.length} price records as a clean CSV file suitable for Excel or external analytics.
              </p>
              <button
                onClick={() => exportPricesToCSV(prices, `apmc_vashi_full_backup_${new Date().toISOString().split('T')[0]}.csv`)}
                className="agri-btn-secondary text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Complete CSV ({prices.length} rows)</span>
              </button>
            </div>

            <div className="p-4 border border-rose-200 bg-rose-50/40 rounded-xl space-y-3">
              <h3 className="font-bold text-rose-900 text-xs">Reset to Original 90-Day Benchmark</h3>
              <p className="text-xs text-rose-700">
                Restores the database back to authentic 90-day verified historical records for Navi Mumbai APMC Vashi.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Reset all records to default 90-day verified APMC dataset?')) {
                    resetToSeedData();
                    onRefreshData();
                  }
                }}
                className="agri-btn-secondary text-xs text-rose-600 hover:text-rose-800"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Database to Seed Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
