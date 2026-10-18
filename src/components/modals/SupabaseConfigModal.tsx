import React, { useState } from 'react';
import { X, Database, Check, Copy, ExternalLink, RefreshCw, KeyRound, Server } from 'lucide-react';
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured, saveCustomSupabaseConfig, clearCustomSupabaseConfig } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSeedData: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onResetSeedData,
}) => {
  const [url, setUrl] = useState(SUPABASE_URL || '');
  const [anonKey, setAnonKey] = useState(SUPABASE_ANON_KEY || '');
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [resetting, setResetting] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (url && anonKey) {
      saveCustomSupabaseConfig(url, anonKey);
    }
  };

  const handleClear = () => {
    clearCustomSupabaseConfig();
  };

  const handleCopySchemaPath = () => {
    navigator.clipboard.writeText('src/data/schema.sql');
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all local APMC crop and price data to default 90-day verified historical records?')) {
      setResetting(true);
      onResetSeedData();
      setTimeout(() => {
        setResetting(false);
        onClose();
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Database & Supabase Settings</h3>
            <p className="text-xs text-slate-500">PostgreSQL Backend Configuration</p>
          </div>
        </div>

        {/* Status banner */}
        <div className={`p-4 rounded-xl mb-5 border text-xs flex items-center justify-between ${
          isSupabaseConfigured 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          <div>
            <div className="font-semibold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              <span>{isSupabaseConfigured ? 'Live Supabase Connection Configured' : 'Offline / Standalone Benchmark Mode'}</span>
            </div>
            <p className="mt-0.5 text-slate-600">
              {isSupabaseConfigured 
                ? 'App is configured to read & write to Supabase PostgreSQL database.'
                : 'Using resilient browser storage pre-populated with 90-day verified APMC Vashi records.'}
            </p>
          </div>
          {isSupabaseConfigured && (
            <button
              onClick={handleClear}
              className="text-xs underline text-amber-700 hover:text-amber-900 ml-3 shrink-0"
            >
              Disconnect
            </button>
          )}
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="agri-input w-full text-xs font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supabase Anon / Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="agri-input w-full text-xs font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleCopySchemaPath}
              className="text-xs text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 font-medium"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'Schema path copied!' : 'Copy schema.sql location'}</span>
            </button>

            <button
              type="submit"
              disabled={!url || !anonKey}
              className="agri-btn-primary text-xs disabled:opacity-50"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Save & Connect</span>
            </button>
          </div>
        </form>

        {/* Quick Schema & Setup Instructions */}
        <div className="mt-6 pt-5 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
            Setting up your Supabase Database:
          </h4>
          <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
            <li>Create a project on <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">supabase.com</a>.</li>
            <li>Go to the <strong>SQL Editor</strong> tab in Supabase dashboard.</li>
            <li>Paste and run the contents of <code className="bg-slate-100 text-slate-800 px-1 rounded">src/data/schema.sql</code>.</li>
            <li>Copy your Project URL and Anon Key from Project Settings &gt; API.</li>
          </ol>
        </div>

        {/* Local database reset */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-800">Restore Benchmark Data</p>
            <p className="text-[11px] text-slate-500">Reset local records back to initial 90-day APMC dataset</p>
          </div>
          <button
            type="button"
            onClick={handleResetData}
            disabled={resetting}
            className="agri-btn-secondary text-xs text-rose-600 hover:text-rose-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
