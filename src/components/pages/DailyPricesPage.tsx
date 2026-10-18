import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  Calendar, 
  Sprout, 
  Building2, 
  Eye, 
  RefreshCw,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { Crop, CropPrice, Market } from '../../types/apmc';
import { exportPricesToCSV, normalizePrice } from '../../utils/calculations';

interface DailyPricesPageProps {
  crops: Crop[];
  markets: Market[];
  prices: CropPrice[];
  onSelectPriceDetail: (price: CropPrice) => void;
  onOpenHistorical: (cropId: string) => void;
}

export const DailyPricesPage: React.FC<DailyPricesPageProps> = ({
  crops,
  markets,
  prices,
  onSelectPriceDetail,
  onOpenHistorical,
}) => {
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCropId, setSelectedCropId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fruits' | 'vegetables'>('all');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'date' | 'crop_name' | 'modal_price' | 'min_price' | 'max_price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filtered and sorted data
  const filteredPrices = useMemo(() => {
    return prices.filter(item => {
      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesName = item.crop_name.toLowerCase().includes(query);
        const matchesMarket = item.market_name.toLowerCase().includes(query);
        const cropObj = crops.find(c => c.id === item.crop_id);
        const matchesLocal = cropObj?.local_name.toLowerCase().includes(query);
        if (!matchesName && !matchesMarket && !matchesLocal) return false;
      }

      // Crop ID
      if (selectedCropId !== 'all' && item.crop_id !== selectedCropId) return false;

      // Category
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Market ID
      if (selectedMarketId !== 'all' && item.market_id !== selectedMarketId) return false;

      // Date Range
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'crop_name') {
        comparison = a.crop_name.localeCompare(b.crop_name);
      } else if (sortBy === 'modal_price') {
        comparison = a.modal_price - b.modal_price;
      } else if (sortBy === 'min_price') {
        comparison = a.min_price - b.min_price;
      } else if (sortBy === 'max_price') {
        comparison = a.max_price - b.max_price;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [prices, searchTerm, selectedCropId, selectedCategory, selectedMarketId, startDate, endDate, sortBy, sortOrder, crops]);

  // Paginated records
  const totalPages = Math.ceil(filteredPrices.length / pageSize) || 1;
  const paginatedPrices = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPrices.slice(start, start + pageSize);
  }, [filteredPrices, currentPage, pageSize]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCropId('all');
    setSelectedCategory('all');
    setSelectedMarketId('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleSort = (column: 'date' | 'crop_name' | 'modal_price' | 'min_price' | 'max_price') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    exportPricesToCSV(filteredPrices, `apmc_prices_${selectedCategory}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
            Daily Crop Price Bulletin
          </h1>
          <p className="text-xs text-slate-500">
            Search, filter, and inspect wholesale spot prices across Navi Mumbai APMC Vashi and benchmark mandis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="agri-btn-secondary text-xs"
            title="Download filtered records as CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="agri-card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search crop or market..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="agri-input w-full pl-9 text-xs"
            />
          </div>

          {/* Crop Selector */}
          <div>
            <select
              value={selectedCropId}
              onChange={(e) => { setSelectedCropId(e.target.value); setCurrentPage(1); }}
              className="agri-select w-full text-xs"
            >
              <option value="all">All Crops (13 Varieties)</option>
              {crops.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.local_name})</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value as any); setCurrentPage(1); }}
              className="agri-select w-full text-xs"
            >
              <option value="all">All Categories (Fruits & Veg)</option>
              <option value="vegetables">Vegetables Only</option>
              <option value="fruits">Fruits Only</option>
            </select>
          </div>

          {/* Market Filter */}
          <div>
            <select
              value={selectedMarketId}
              onChange={(e) => { setSelectedMarketId(e.target.value); setCurrentPage(1); }}
              className="agri-select w-full text-xs"
            >
              <option value="all">All Markets</option>
              {markets.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date Filter & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Filter:</span>
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
              className="agri-input py-1 text-xs"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
              className="agri-input py-1 text-xs"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">
              Showing <strong>{filteredPrices.length}</strong> matching records
            </span>
            {(searchTerm || selectedCropId !== 'all' || selectedCategory !== 'all' || selectedMarketId !== 'all' || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Prices Table */}
      <div className="agri-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 text-slate-700 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 select-none">
              <tr>
                <th 
                  onClick={() => handleSort('crop_name')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Crop / Commodity</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Market Yard</th>
                <th 
                  onClick={() => handleSort('date')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('min_price')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Min Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('modal_price')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5 text-emerald-800 font-bold">
                    <span>Modal Price</span>
                    <ArrowUpDown className="w-3 h-3 text-emerald-600" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('max_price')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Max Price</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Unit</th>
                <th className="py-3 px-3 text-right">Arrivals (Qtl)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedPrices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <Sprout className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-semibold text-slate-600">No crop price records found</p>
                    <p className="text-[11px] mt-1">Try adjusting your filters or date range.</p>
                  </td>
                </tr>
              ) : (
                paginatedPrices.map((item) => {
                  const cropObj = crops.find(c => c.id === item.crop_id);
                  const pricePerKg = normalizePrice(item.modal_price, item.unit, 'per_kg');

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-emerald-50/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectPriceDetail(item)}
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl shrink-0">{cropObj?.icon || '🌾'}</span>
                          <div>
                            <span className="block group-hover:text-emerald-700 transition-colors font-bold">
                              {item.crop_name}
                            </span>
                            {cropObj?.local_name && (
                              <span className="text-[11px] text-slate-400 font-normal">
                                {cropObj.local_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          item.category === 'fruits' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.category === 'fruits' ? 'Fruit' : 'Vegetable'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        <span className="font-medium">{item.market_name}</span>
                      </td>

                      <td className="py-3 px-3 font-mono text-slate-600">
                        {item.date}
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-500">
                        ₹{item.min_price}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="font-extrabold text-emerald-700 text-sm">
                          ₹{item.modal_price}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          (₹{pricePerKg}/kg)
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-500">
                        ₹{item.max_price}
                      </td>

                      <td className="py-3 px-3 text-center text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium">
                          {item.unit}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-medium text-slate-600">
                        {item.arrivals_quintal ? `${item.arrivals_quintal.toLocaleString()}` : '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectPriceDetail(item)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="View Record Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenHistorical(item.crop_id)}
                            className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Analyze History"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div>
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, filteredPrices.length)}</strong> of{' '}
            <strong>{filteredPrices.length}</strong> entries
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            <span className="px-3 py-1.5 font-semibold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
