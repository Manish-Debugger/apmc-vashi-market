import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Radio } from 'lucide-react';
import { Crop, CropPrice } from '../types/apmc';

interface LivePriceTickerProps {
  crops: Crop[];
  prices: CropPrice[];
  onSelectCrop: (cropId: string) => void;
}

export const LivePriceTicker: React.FC<LivePriceTickerProps> = ({
  crops,
  prices,
  onSelectCrop,
}) => {
  // Get latest price for each crop
  const tickerItems = crops.map(crop => {
    const cropPrices = prices
      .filter(p => p.crop_id === crop.id && p.market_id === 'mkt-vashi')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const latest = cropPrices[0];
    const prev = cropPrices[1] || latest;

    if (!latest) return null;

    const diff = latest.modal_price - prev.modal_price;
    const pct = prev.modal_price > 0 ? (diff / prev.modal_price) * 100 : 0;

    return {
      cropId: crop.id,
      name: crop.name,
      localName: crop.local_name,
      icon: crop.icon,
      price: latest.modal_price,
      unit: latest.unit.replace('₹/', ''),
      diff,
      pct: Number(pct.toFixed(1)),
      isUp: diff >= 0,
    };
  }).filter(Boolean);

  // Duplicate list to achieve continuous seamless loop
  const duplicatedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="bg-slate-900 border-b border-emerald-900/60 text-white overflow-hidden py-2 select-none relative flex items-center group">
      {/* Fixed Live Label Badge */}
      <div className="bg-emerald-600 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 z-10 shadow-md">
        <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
        <span className="hidden sm:inline">Vashi Ticker</span>
      </div>

      {/* Scrolling Content */}
      <motion.div
        className="flex items-center gap-6 whitespace-nowrap pl-4"
        animate={{
          x: ['0%', '-50%'],
        }}
        transition={{
          repeat: Infinity,
          ease: 'linear',
          duration: 35,
        }}
        whileHover={{ animationPlayState: 'paused' }}
      >
        {duplicatedItems.map((item: any, idx) => (
          <div
            key={`${item.cropId}-${idx}`}
            onClick={() => onSelectCrop(item.cropId)}
            className="inline-flex items-center gap-2 text-xs cursor-pointer hover:bg-slate-800/80 px-2.5 py-1 rounded-lg transition-all border border-transparent hover:border-slate-700 active:scale-95"
          >
            <span className="text-sm">{item.icon}</span>
            <span className="font-semibold text-slate-200">{item.name}:</span>
            <span className="font-extrabold text-white">₹{item.price}</span>
            <span className="text-[10px] text-slate-400">/{item.unit}</span>

            <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
              item.isUp ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {item.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span>{item.pct > 0 ? `+${item.pct}` : item.pct}%</span>
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
