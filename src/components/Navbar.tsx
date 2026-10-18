import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sprout, 
  TrendingUp, 
  Table, 
  GitCompare, 
  Calculator, 
  BarChart3, 
  Info, 
  ShieldCheck, 
  Database, 
  Menu, 
  X,
  Lock,
  UserCheck
} from 'lucide-react';
import { User } from '../types/apmc';
import { isSupabaseConfigured } from '../lib/supabase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onOpenConfigModal: () => void;
  onOpenDataStatusModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenConfigModal,
  onOpenDataStatusModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Sprout },
    { id: 'daily-prices', label: 'Daily Prices', icon: Table },
    { id: 'historical', label: 'Price History', icon: TrendingUp },
    { id: 'comparison', label: 'Comparison', icon: GitCompare },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'insights', label: 'Trends', icon: BarChart3 },
    { id: 'about', label: 'About Vashi', icon: Info },
    { id: 'admin', label: 'Admin', icon: currentUser ? UserCheck : Lock },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top Context Notification Bar */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4 sm:px-8 border-b border-emerald-900/50">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-200">Navi Mumbai APMC (Vashi)</span>
            <span className="hidden sm:inline text-emerald-600">|</span>
            <span className="hidden sm:inline text-emerald-300">Daily Wholesale Agricultural Commodity Price Bulletin</span>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenDataStatusModal}
              className="hover:underline flex items-center gap-1.5 text-emerald-300 hover:text-white transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Verified Vashi Historical Records'}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onOpenConfigModal}
              className="text-emerald-300 hover:text-white flex items-center gap-1 transition-colors px-2 py-0.5 rounded-md hover:bg-emerald-900/60"
              title="Database & Supabase Settings"
            >
              <Database className="w-3 h-3" />
              <span className="hidden md:inline font-mono">DB Settings</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Spacious Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo & Brand - Big, Crisp, and Spacious */}
          <motion.div 
            className="flex items-center gap-3.5 cursor-pointer select-none shrink-0"
            onClick={() => handleNavClick('dashboard')}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {/* Big, Clear Emblem Container */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1.5 border border-slate-200 shadow-md shadow-emerald-950/10 flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-emerald-500/20">
              <img 
                src="/apmc-logo.png" 
                alt="Navi Mumbai APMC Vashi Emblem" 
                className="w-full h-full object-contain filter drop-shadow-xs hover:scale-105 transition-transform" 
              />
            </div>

            {/* Clean Brand Typography without Congestion */}
            <div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none font-sans block">
                Navi Mumbai APMC
              </span>
              <span className="text-xs font-semibold text-emerald-700 tracking-wide block mt-1">
                Vashi Wholesale Market • Price & Trend Intelligence
              </span>
            </div>
          </motion.div>

          {/* Desktop Nav Links - Spacious, Streamlined, No Congestion */}
          <nav className="hidden lg:flex items-center gap-1.5 relative bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 shadow-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 z-10 ${
                    isActive
                      ? 'text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {/* Sliding Animated Active Pill Background */}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavPill"
                      className="absolute inset-0 bg-emerald-600 rounded-xl shadow-md shadow-emerald-600/30 -z-10"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}

                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.id === 'admin' && currentUser && (
                    <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer with AnimatePresence */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1 shadow-xl overflow-hidden"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.id === 'admin' && currentUser && (
                    <span className="ml-auto text-xs bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-semibold">
                      Admin Active
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
