import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { HazardProvider, SafetyTone, useHazards } from './context/HazardContext';
import { BottomNav } from './components/BottomNav';
import { BottomSheet } from './components/BottomSheet';
import { MenuSheet, TutorialSheet } from './components/HelpSheets';
import { NoticeToast } from './components/NoticeToast';
import { PostSheet } from './components/PostSheet';
import { PublishSheet } from './components/PublishSheet';
import { ReportSheet } from './components/ReportSheet';
import { SosSheet } from './components/SosSheet';
import { EmergencyBar } from './components/TopBar';
import { PrintableMuralModal } from './components/PrintableMuralModal';
import { BatterySaverScreen } from './screens/BatterySaverScreen';
import { runBackHandler, useBackHandler } from './hooks/useBackHandler';
import { exitApp, listenForBackButton, setStatusBarOverDark } from './lib/native';
import { AlertsScreen } from './screens/AlertsScreen';
import { EmergencyScreen } from './screens/EmergencyScreen';
import { FavorsScreen } from './screens/FavorsScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NewsScreen } from './screens/NewsScreen';
import { ServicesScreen } from './screens/ServicesScreen';

// The map library is heavy: it loads only when someone opens the map.
const MapScreen = lazy(() => import('./screens/MapScreen'));

const DARK_TONES: SafetyTone[] = ['safe', 'rojo', 'unknown', 'offline'];

const OfflineStrip: React.FC = () => {
  const { isOnline, pendingOfflineCount } = useApp();
  if (isOnline) return null;

  const pending =
    pendingOfflineCount === 1 ? '1 publicación pendiente' : pendingOfflineCount > 1 ? `${pendingOfflineCount} publicaciones pendientes` : '';

  return (
    <p
      role="status"
      className="fixed z-20 inset-x-0 flex items-center min-h-12 px-4 bg-offline text-white text-secondary lg:left-60"
      style={{ bottom: 'var(--content-bottom)' }}
    >
      {['Sin internet', pending].filter(Boolean).join('. ')}
    </p>
  );
};

const PublishButton: React.FC = () => {
  const { mode, openPublish, isOnline } = useApp();
  const isEmergency = mode === 'emergency';

  return (
    <button
      type="button"
      onClick={() => openPublish()}
      className={`fixed z-20 right-4 lg:hidden inline-flex items-center gap-2 min-h-14 pl-4 pr-5 rounded-lg font-bold text-row shadow-[0_4px_16px_#12182647] ${
        isEmergency ? 'bg-rojo active:bg-rojo-press text-white' : 'bg-anil active:bg-anil-press text-white'
      }`}
      style={{ bottom: `calc(var(--nav-height) + var(--safe-bottom) + ${isOnline ? 16 : 64}px)` }}
    >
      <Plus className="w-6 h-6" aria-hidden="true" />
      {isEmergency ? 'Reportar' : 'Publicar'}
    </button>
  );
};

const Shell: React.FC = () => {
  const { mode, setMode, tab, setTab, homeTab, isAlertsOpen, setIsAlertsOpen, isNewsOpen, isMuralOpen, setIsMuralOpen, isBatterySaver, setIsBatterySaver } = useApp();
  const { verdict } = useHazards();
  const isEmergency = mode === 'emergency';
  const [isExitOpen, setIsExitOpen] = useState(false);

  useBackHandler(isAlertsOpen, () => setIsAlertsOpen(false));

  useEffect(() => {
    document.documentElement.dataset.mode = mode;
  }, [mode]);

  // Android Back: close what is open, then return home, then leave the app.
  useEffect(() => {
    return listenForBackButton(() => {
      if (runBackHandler()) return;
      if (tab !== homeTab) setTab(homeTab);
      else exitApp();
    });
  }, [tab, homeTab, setTab]);

  useEffect(() => {
    const isOverHero = !isEmergency && tab === 'home' && !isAlertsOpen && !isNewsOpen;
    setStatusBarOverDark(isBatterySaver || isEmergency || (isOverHero && DARK_TONES.includes(verdict.tone)));
  }, [isBatterySaver, isEmergency, tab, isAlertsOpen, isNewsOpen, verdict.tone]);

  const screen = (() => {
    if (isAlertsOpen) return <AlertsScreen />;
    if (isNewsOpen) return <NewsScreen />;
    if (tab === 'map') {
      return (
        <Suspense fallback={<p className="p-4 text-secondary text-ink-2">Abriendo el mapa...</p>}>
          <MapScreen />
        </Suspense>
      );
    }
    if (isEmergency) return <EmergencyScreen />;
    if (tab === 'services') return <ServicesScreen />;
    if (tab === 'favors') return <FavorsScreen />;
    return <HomeScreen />;
  })();

  // A full black screen: nothing else is drawn, so the phone lights as few pixels as possible.
  if (isBatterySaver) return <BatterySaverScreen onExit={() => setIsBatterySaver(false)} />;

  return (
    <div data-mode={mode}>
      <main className="lg:ml-60">
        {isEmergency && !isAlertsOpen && !isNewsOpen && <EmergencyBar onExit={() => setIsExitOpen(true)} />}
        {screen}
      </main>

      {tab !== 'map' && !isAlertsOpen && !isNewsOpen && <PublishButton />}
      <OfflineStrip />
      <BottomNav />

      <PostSheet />
      <PublishSheet />
      <ReportSheet />
      <SosSheet />
      <MenuSheet />
      <TutorialSheet />

      <BottomSheet open={isExitOpen} onClose={() => setIsExitOpen(false)} title="¿Salir del modo emergencia?">
        <div className="px-4 space-y-2" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <p className="pb-2 text-secondary">Volverás a ver los servicios y favores de tu barrio.</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              setIsExitOpen(false);
              setMode('normal');
            }}
          >
            Sí, salir
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setIsExitOpen(false)}>
            Seguir en emergencia
          </button>
        </div>
      </BottomSheet>

      <NoticeToast />
      <PrintableMuralModal isOpen={isMuralOpen} onClose={() => setIsMuralOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <HazardProvider>
        <Shell />
      </HazardProvider>
    </AppProvider>
  );
}

export default App;
