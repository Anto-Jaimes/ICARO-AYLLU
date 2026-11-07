import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Briefcase, 
  HeartHandshake, 
  Map, 
  PlusCircle, 
  AlertOctagon, 
  ShieldAlert, 
  Layers
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const { mode, activeTab, setActiveTab, setIsPublishModalOpen } = useApp();
  const isEmergency = mode === 'emergency';

  return (
    <>
      {/* Desktop Tabs Header Navigation */}
      <div className={`hidden md:block border-b transition-colors ${
        isEmergency ? 'bg-rose-900/30 border-rose-800' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <nav className="flex space-x-1 py-2">
            {!isEmergency ? (
              <>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                    activeTab === 'services'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>1. Servicios de Proximidad (Oficios)</span>
                </button>

                <button
                  onClick={() => setActiveTab('favors')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                    activeTab === 'favors'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>2. Cadena de Favores (Sin Dinero)</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Mapa de Proximidad</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('emergency_board')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                    activeTab === 'emergency_board'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-rose-200 hover:bg-rose-900/50 hover:text-white'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 animate-bounce" />
                  <span>Tablero Humanitario & Recursos</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-rose-700 text-white shadow-md'
                      : 'text-rose-200 hover:bg-rose-900/50 hover:text-white'
                  }`}
                >
                  <Map className="w-4 h-4" />
                  <span>Mapa de Emergencias y Brigadas</span>
                </button>
              </>
            )}
          </nav>

          {/* Quick Publish 3-Clicks Button for Desktop */}
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-extrabold text-sm shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer ${
              isEmergency
                ? 'bg-amber-400 hover:bg-amber-300 text-rose-950 ring-2 ring-amber-300'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publicar en 3 Clics</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb friendly) */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-md px-2 py-1 flex items-center justify-around shadow-2xl transition-colors ${
        isEmergency 
          ? 'bg-rose-950/95 border-rose-800 text-rose-200' 
          : 'bg-white/95 border-slate-200 text-slate-600'
      }`}>
        {!isEmergency ? (
          <>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                activeTab === 'services' 
                  ? 'text-amber-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Oficios</span>
            </button>

            <button
              onClick={() => setActiveTab('favors')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                activeTab === 'favors' 
                  ? 'text-emerald-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <HeartHandshake className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Favores</span>
            </button>

            {/* Central Floating Button */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-amber-500 to-orange-500 text-white w-13 h-13 rounded-full shadow-lg ring-4 ring-white active:scale-95 transition cursor-pointer"
              aria-label="Publicar en 3 clics"
            >
              <PlusCircle className="w-7 h-7" />
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                activeTab === 'map' 
                  ? 'text-sky-600 font-bold scale-105' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Map className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Mapa</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setActiveTab('emergency_board')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                activeTab === 'emergency_board' 
                  ? 'text-rose-400 font-extrabold scale-105' 
                  : 'text-rose-300/70 hover:text-white'
              }`}
            >
              <AlertOctagon className="w-5 h-5 mb-0.5 animate-pulse" />
              <span className="text-[10px]">Auxilio</span>
            </button>

            {/* Central Floating Emergency SOS Button */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex flex-col items-center justify-center -mt-5 bg-rose-600 text-white w-14 h-14 rounded-full shadow-lg shadow-rose-900/60 ring-4 ring-rose-950 active:scale-95 transition cursor-pointer animate-emergency-pulse"
              aria-label="Pedir auxilio urgente"
            >
              <ShieldAlert className="w-7 h-7" />
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex flex-col items-center justify-center p-2 rounded-xl transition ${
                activeTab === 'map' 
                  ? 'text-amber-400 font-extrabold scale-105' 
                  : 'text-rose-300/70 hover:text-white'
              }`}
            >
              <Map className="w-5 h-5 mb-0.5" />
              <span className="text-[10px]">Mapa SOS</span>
            </button>
          </>
        )}
      </div>
    </>
  );
};
