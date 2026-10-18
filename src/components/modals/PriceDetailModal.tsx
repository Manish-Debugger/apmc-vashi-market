import React from 'react';
import { X, TrendingUp, Calendar, MapPin, Scale, FileText, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { CropPrice, Crop } from '../../types/apmc';
import { normalizePrice } from '../../utils/calculations';

interface PriceDetailModalProps {
  price: CropPrice | null;
  cropDetails?: Crop;
  onClose: () => void;
  onOpenHistorical: (cropId: string) => void;
}

export const PriceDetailModal: React.FC<PriceDetailModalProps> = ({
  price,
  cropDetails,
  onClose,
  onOpenHistorical,
}) => {
  if (!price) return null;

  const spread = price.max_price - price.min_price;
  const spreadPercent = price.modal_price > 0 ? ((spread / price.modal_price) * 100).toFixed(1) : '0';

  const pricePerKg = normalizePrice(price.modal_price, price.unit, 'per_kg');
  const pricePerQuintal = normalizePrice(price.modal_price, price.unit, 'per_quintal');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-2xl flex items-center justify-center shadow-xs">
            {cropDetails?.icon || '🌾'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900">{price.crop_name}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                price.category === 'fruits' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {price.category === 'fruits' ? 'Fruit' : 'Vegetable'}
              </span>
            </div>
            {cropDetails?.local_name && (
              <p className="text-xs text-slate-500 font-medium">{cropDetails.local_name}</p>
            )}
          </div>
        </div>

        {/* Key Price Cards */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">Minimum Price</span>
            <span className="text-base font-bold text-slate-700">₹{price.min_price}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Lower Grade</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-center ring-1 ring-emerald-300">
            <span className="text-[11px] font-semibold text-emerald-800 block mb-1">Modal Price</span>
            <span className="text-xl font-extrabold text-emerald-700">₹{price.modal_price}</span>
            <span className="text-[10px] text-emerald-600 font-medium block mt-0.5">Bulk Cleared</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
            <span className="text-[11px] font-medium text-slate-500 block mb-1">Maximum Price</span>
            <span className="text-base font-bold text-slate-700">₹{price.max_price}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Premium Grade</span>
          </div>
        </div>

        {/* Metadata Details */}
        <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs mb-5">
          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
              <span>Record Date:</span>
            </span>
            <span className="font-semibold text-slate-800">{price.date}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>Market Yard:</span>
            </span>
            <span className="font-semibold text-slate-800">{price.market_name}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Scale className="w-3.5 h-3.5" />
              <span>Quoted Unit:</span>
            </span>
            <span className="font-semibold text-slate-800">{price.unit}</span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Layers className="w-3.5 h-3.5" />
              <span>Lot Spread:</span>
            </span>
            <span className="font-semibold text-slate-800">
              ₹{spread} ({spreadPercent}% spread between min/max)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-500">
              <Scale className="w-3.5 h-3.5" />
              <span>Standardized Equivalents:</span>
            </span>
            <span className="font-semibold text-emerald-700">
              ₹{pricePerKg}/kg • ₹{pricePerQuintal}/quintal
            </span>
          </div>

          {price.arrivals_quintal !== undefined && price.arrivals_quintal > 0 && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5 text-slate-500">
                <FileText className="w-3.5 h-3.5" />
                <span>Market Arrivals:</span>
              </span>
              <span className="font-semibold text-slate-800">{price.arrivals_quintal} Quintals</span>
            </div>
          )}

          <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
            <span className="text-slate-500">Bulletin Source:</span>
            <span className="font-medium text-slate-700">{price.source}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenHistorical(price.crop_id);
            }}
            className="agri-btn-primary w-full text-xs"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Open Historical Analyzer for {price.crop_name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
