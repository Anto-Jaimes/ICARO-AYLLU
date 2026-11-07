import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  Briefcase, 
  HeartHandshake, 
  Map, 
  PlusCircle, 
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
        isEmergency ? 'bg-slate-950/80 border-red-900/40 backdrop-blur-md' : 'bg-white border-slate-200/90 shadow-xs'
      }`}>
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <nav className="flex space-x-1 py-2">
            {!isEmergency ? (
              <>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    activeTab === 'services'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  <span>Oficios Locales</span>
                </button>

                <button
                  onClick={() => setActiveTab('favors')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    activeTab === 'favors'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Favores Ayni</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-sky-500" />
                  <span>Mapa de Proximidad</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('services')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    activeTab !== 'map'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span>Puesto de Mando & Alertas</span>
                </button>

                <button
                  onClick={() => setActiveTab('map')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                    activeTab === 'map'
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/30 ring-2 ring-red-400/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Map className="w-3.5 h-3.5 text-white" />
                  <span>Mapa de Auxilio Táctico</span>
                </button>
              </>
            )}
          </nav>

          <button
            onClick={() => setIsPublishModalOpen(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs transition cursor-pointer active:scale-95 shadow-md ${
              isEmergency 
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white shadow-red-600/30' 
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Publicar (3 Clics)</span>
          </button>
        </div>
      </div>

      {/* Floating Action Bottom Bar tipo iOS / 21st.dev para Móviles */}
      <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md">
        <nav className={`p-1.5 rounded-2xl flex items-center justify-around shadow-2xl border backdrop-blur-xl ${
          isEmergency 
            ? 'bg-slate-950/90 border-red-500/50 text-white shadow-red-950/50' 
            : 'bg-white/90 border-slate-200/90 text-slate-800 shadow-slate-900/15'
        }`}>
          {!isEmergency ? (
            <>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeTab === 'services' ? 'text-amber-600 font-black' : 'text-slate-500 font-semibold'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span className="text-[10px]">Oficios</span>
              </button>

              <button
                onClick={() => setActiveTab('favors')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeTab === 'favors' ? 'text-emerald-600 font-black' : 'text-slate-500 font-semibold'
                }`}
              >
                <HeartHandshake className="w-4 h-4" />
                <span className="text-[10px]">Ayni</span>
              </button>

              {/* Botón Central de 3 Clics */}
              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-90 transition -mt-3 ring-4 ring-white"
                title="Publicar en 3 Clics"
              >
                <PlusCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
                  activeTab === 'map' ? 'text-sky-600 font-black' : 'text-slate-500 font-semibold'
                }`}
              >
                <Map className="w-4 h-4" />
                <span className="text-[10px]">Mapa</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-1.5 py-2 px-4 rounded-xl transition font-black text-xs ${
                  activeTab !== 'map' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                <ShieldAlert className="w-4 h-4 animate-pulse" />
                <span>Puesto Mando</span>
              </button>

              <button
                onClick={() => setIsPublishModalOpen(true)}
                className="p-2.5 rounded-xl bg-red-600 text-white shadow-md active:scale-90 transition ring-2 ring-red-400"
              >
                <PlusCircle className="w-5 h-5" />
              </button>

              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 py-2 px-4 rounded-xl transition font-black text-xs ${
                  activeTab === 'map' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'
                }`}
              >
                <Map className="w-4 h-4" />
                <span>Mapa SOS</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </>
  );
};
