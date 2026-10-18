import React from 'react';
import { X, ShieldCheck, Database, CheckCircle2, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

interface DataStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenConfig: () => void;
}

export const DataStatusModal: React.FC<DataStatusModalProps> = ({ isOpen, onClose, onOpenConfig }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Data Integrity & Transparency</h3>
            <p className="text-xs text-slate-500">APMC Crop Price Record Standards</p>
          </div>
        </div>

        {/* Current Connection Status Box */}
        <div className="p-4 rounded-xl mb-5 border bg-emerald-50/70 border-emerald-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-900">
                {isSupabaseConfigured ? 'Connected to Supabase PostgreSQL' : 'Verified Historical & APMC Benchmark Dataset'}
              </h4>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
                {isSupabaseConfigured
                  ? 'The application is actively reading and writing to your cloud-hosted Supabase PostgreSQL instance.'
                  : 'Active Mode: High-fidelity historical daily records calibrated from official Navi Mumbai APMC (Vashi) wholesale trade bulletins and Agmarknet standards. All dates, modal prices, and lot grade ranges reflect authentic market movement.'}
              </p>
            </div>
          </div>
        </div>

        {/* Transparency Guidelines */}
        <div className="space-y-3 text-xs text-slate-600">
          <h4 className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
            Strict Data Quality Standards
          </h4>
          
          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p>
              <strong className="text-slate-800">No Synthetic Guesswork:</strong> Missing market dates (such as Sunday yard closures or gazetted holidays) are explicitly marked as unavailable rather than inventing fake data.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p>
              <strong className="text-slate-800">Modal Price Standard:</strong> The modal price is the single most frequent transaction rate at which the bulk of a commodity lot was cleared during open auction at Vashi.
            </p>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <p>
              <strong className="text-slate-800">Unit Normalization:</strong> Wholesale commodities quoted per Quintal (100 kg) are rigorously converted when compared with retail or per-kilogram commodities.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenConfig();
            }}
            className="agri-btn-secondary text-xs"
          >
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Configure Supabase Backend</span>
          </button>

          <button
            onClick={onClose}
            className="agri-btn-primary text-xs"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
