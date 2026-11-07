import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { FilterBar } from './components/FilterBar';
import { AlertsPanel } from './components/AlertsPanel';
import { ServicesList } from './components/ServicesList';
import { FavorsWall } from './components/FavorsWall';
import { EmergencyBoard } from './components/EmergencyBoard';
import { InteractiveMap } from './components/InteractiveMap';
import { ThreeClickPublishModal } from './components/ThreeClickPublishModal';
import { DetailModal } from './components/DetailModal';
import { TutorialModal } from './components/TutorialModal';
import { NoticeToast } from './components/NoticeToast';

const MainContent: React.FC = () => {
  const { mode, activeTab } = useApp();
  const isEmergency = mode === 'emergency';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isEmergency ? 'bg-slate-950 text-slate-100' : 'bg-slate-100/70 text-slate-800'
    }`}>
      {/* Top Navigation & Status */}
      <Header />
      <Navigation />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-4 py-4 pb-24 md:pb-12">
        {/* Official alerts for the neighbour's area (IGP and SENAMHI) */}
        <AlertsPanel />

        {/* Search, Distance & Category filters */}
        <FilterBar />

        {/* View Switcher */}
        {isEmergency ? (
          activeTab === 'map' ? (
            <InteractiveMap />
          ) : (
            <EmergencyBoard />
          )
        ) : (
          <>
            {activeTab === 'services' && <ServicesList />}
            {activeTab === 'favors' && <FavorsWall />}
            {activeTab === 'map' && <InteractiveMap />}
          </>
        )}

        {/* Footer info & Reset Demo */}
        <footer className="mt-12 pt-6 border-t border-slate-200/60 text-center text-xs text-slate-500 space-y-2">
          <p className="font-semibold">
            ICARO-AYLLU • Plataforma Comunitaria de Proximidad, Economía Solidaria y Resiliencia Vecinal
          </p>
          <p className="text-[11px] text-slate-400">
            Fuentes oficiales: IGP y SENAMHI • Pronóstico: Open-Meteo • Mapas: OpenStreetMap
          </p>
        </footer>
      </main>

      {/* Modals */}
      <ThreeClickPublishModal />
      <DetailModal />
      <TutorialModal />
      <NoticeToast />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}

export default App;
