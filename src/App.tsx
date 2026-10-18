import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LivePriceTicker } from './components/LivePriceTicker';
import { DashboardPage } from './components/pages/DashboardPage';
import { DailyPricesPage } from './components/pages/DailyPricesPage';
import { HistoricalAnalyzerPage } from './components/pages/HistoricalAnalyzerPage';
import { CropComparisonPage } from './components/pages/CropComparisonPage';
import { RevenueCalculatorPage } from './components/pages/RevenueCalculatorPage';
import { TrendInsightsPage } from './components/pages/TrendInsightsPage';
import { AboutPage } from './components/pages/AboutPage';
import { AdminPage } from './components/pages/AdminPage';
import { DataStatusModal } from './components/modals/DataStatusModal';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';
import { PriceDetailModal } from './components/modals/PriceDetailModal';
import { Crop, CropPrice, Market, User } from './types/apmc';
import { fetchCrops, fetchMarkets, fetchCropPrices, getActiveUser, resetToSeedData } from './lib/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCropId, setSelectedCropId] = useState<string>('crop-onion');
  
  // Data State
  const [crops, setCrops] = useState<Crop[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [prices, setPrices] = useState<CropPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals state
  const [isDataStatusModalOpen, setIsDataStatusModalOpen] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [selectedPriceDetail, setSelectedPriceDetail] = useState<CropPrice | null>(null);

  // Load data on startup
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [cropsData, marketsData, pricesData] = await Promise.all([
        fetchCrops(),
        fetchMarkets(),
        fetchCropPrices(),
      ]);

      setCrops(cropsData);
      setMarkets(marketsData);
      setPrices(pricesData);

      // Check active auth user
      const user = getActiveUser();
      setCurrentUser(user);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Navigate to Historical Analyzer with a specific crop
  const handleOpenHistorical = (cropId: string) => {
    setSelectedCropId(cropId);
    setActiveTab('historical');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Reset seed data callback
  const handleResetSeedData = () => {
    const fresh = resetToSeedData();
    setCrops(fresh.crops);
    setMarkets(fresh.markets);
    setPrices(fresh.prices);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ scale: [1, 1.08, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-2xl bg-white p-2 border border-slate-200/90 flex items-center justify-center shadow-xl shadow-emerald-950/10 mb-4"
        >
          <img src="/apmc-logo.png" alt="APMC Logo" className="w-full h-full object-contain" />
        </motion.div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Loading APMC Vashi Market Data...</h2>
        <p className="text-xs text-slate-500 mt-1">Connecting to database and verifying commodity auction series</p>
      </div>
    );
  }

  const selectedCropDetail = crops.find(c => c.id === selectedPriceDetail?.crop_id);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenDataStatusModal={() => setIsDataStatusModalOpen(true)}
      />

      {/* Live Continuous Marquee Ticker */}
      <LivePriceTicker
        crops={crops}
        prices={prices}
        onSelectCrop={handleOpenHistorical}
      />

      {/* Main Content Area with Smooth Page Transition */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            {activeTab === 'dashboard' && (
              <DashboardPage
                crops={crops}
                markets={markets}
                prices={prices}
                setActiveTab={setActiveTab}
                setSelectedCropId={setSelectedCropId}
                onOpenDataStatusModal={() => setIsDataStatusModalOpen(true)}
                onSelectPriceDetail={setSelectedPriceDetail}
              />
            )}

            {activeTab === 'daily-prices' && (
              <DailyPricesPage
                crops={crops}
                markets={markets}
                prices={prices}
                onSelectPriceDetail={setSelectedPriceDetail}
                onOpenHistorical={handleOpenHistorical}
              />
            )}

            {activeTab === 'historical' && (
              <HistoricalAnalyzerPage
                crops={crops}
                markets={markets}
                prices={prices}
                selectedCropId={selectedCropId}
                setSelectedCropId={setSelectedCropId}
                onSelectPriceDetail={setSelectedPriceDetail}
              />
            )}

            {activeTab === 'comparison' && (
              <CropComparisonPage
                crops={crops}
                markets={markets}
                prices={prices}
              />
            )}

            {activeTab === 'calculator' && (
              <RevenueCalculatorPage
                crops={crops}
                markets={markets}
                prices={prices}
              />
            )}

            {activeTab === 'insights' && (
              <TrendInsightsPage
                crops={crops}
                markets={markets}
                prices={prices}
                onSelectCrop={handleOpenHistorical}
              />
            )}

            {activeTab === 'about' && (
              <AboutPage />
            )}

            {activeTab === 'admin' && (
              <AdminPage
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                crops={crops}
                markets={markets}
                prices={prices}
                onRefreshData={loadInitialData}
                onOpenConfigModal={() => setIsConfigModalOpen(true)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer
        setActiveTab={setActiveTab}
        onOpenDataStatusModal={() => setIsDataStatusModalOpen(true)}
      />

      {/* Modals */}
      <DataStatusModal
        isOpen={isDataStatusModalOpen}
        onClose={() => setIsDataStatusModalOpen(false)}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />

      <SupabaseConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onResetSeedData={handleResetSeedData}
      />

      <PriceDetailModal
        price={selectedPriceDetail}
        cropDetails={selectedCropDetail}
        onClose={() => setSelectedPriceDetail(null)}
        onOpenHistorical={handleOpenHistorical}
      />
    </div>
  );
}

export default App;
