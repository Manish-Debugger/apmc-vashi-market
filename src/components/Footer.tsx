import React from 'react';
import { Sprout, ExternalLink, MapPin, Clock, Phone, AlertCircle } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
  onOpenDataStatusModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ setActiveTab, onOpenDataStatusModal }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-16 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Market Info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center overflow-hidden">
                <img src="/apmc-logo.png" alt="APMC Logo" className="w-full h-full object-contain" />
              </div>
              <span>APMC Crop Pulse</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Agricultural Produce Market Committee (APMC) Crop Price Information and Trend Analysis System, focused on Navi Mumbai APMC, Vashi.
            </p>
            <div className="text-xs space-y-1.5 pt-2">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Sector 19, Vashi, Navi Mumbai, Maharashtra 400703</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Auction Yards: 04:00 AM – 01:00 PM (Mon–Sat)</span>
              </div>
            </div>
          </div>

          {/* Quick Modules */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Core Modules</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setActiveTab('daily-prices')} className="hover:text-emerald-400 transition-colors">
                  Daily Crop Prices Table
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('historical')} className="hover:text-emerald-400 transition-colors">
                  Historical Price Analyzer
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('comparison')} className="hover:text-emerald-400 transition-colors">
                  Multi-Crop Comparison Tool
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('calculator')} className="hover:text-emerald-400 transition-colors">
                  Net Selling Revenue Calculator
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('insights')} className="hover:text-emerald-400 transition-colors">
                  Market Trend Insights
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('admin')} className="hover:text-emerald-400 transition-colors">
                  Administrator Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Official Sources & Verification */}
          <div>
            <h4 className="text-white text-xs font-semibold uppercase tracking-wider mb-3">Official Market Sources</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a 
                  href="https://agmarknet.gov.in" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>AGMARKNET (DMI, GoI)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a 
                  href="https://www.msamb.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-emerald-400 flex items-center gap-1 transition-colors"
                >
                  <span>MSAMB (Maharashtra State Ag Marketing)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button 
                  onClick={onOpenDataStatusModal} 
                  className="text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Data Integrity & Methodology</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Statutory Disclaimer */}
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Market Advisory Notice</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Price reports represent historical and modal transactions recorded in the wholesale yards of Navi Mumbai APMC, Vashi. Prices fluctuate daily based on lot grade, arrival volumes, moisture, and bidding. Users should verify spot prices before commercial dispatch.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} APMC Crop Price Information & Trend Analysis System. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveTab('about')} className="hover:text-slate-300">About Vashi Mandi</button>
            <span>•</span>
            <button onClick={onOpenDataStatusModal} className="hover:text-slate-300">Data Transparency</button>
            <span>•</span>
            <span>Navi Mumbai, India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
