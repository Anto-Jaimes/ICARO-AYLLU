import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  HelpCircle, 
  MapPin, 
  Siren,
  Building2,
  Bell
} from 'lucide-react';
import { EmergencySirenModal } from './EmergencySirenModal';

export const Header: React.FC = () => {
  const { 
    mode, 
    toggleMode, 
    isOnline, 
    pendingOfflineCount, 
    setIsTutorialOpen, 
    userLocation, 
    requestCurrentGPS
  } = useApp();

  const [isSirenOpen, setIsSirenOpen] = useState<boolean>(false);
  const isEmergency = mode === 'emergency';

  return (
    <>
      <header className={`sticky top-0 z-30 transition-colors border-b ${
        isEmergency 
          ? 'bg-slate-900 text-white border-slate-800' 
          : 'bg-white text-slate-900 border-slate-200'
      }`}>
        {/* Barra superior institucional */}
        <div className={`px-4 py-1 text-xs flex justify-between items-center ${
          isEmergency ? 'bg-slate-950 text-slate-400 border-b border-slate-800/80' : 'bg-slate-50 text-slate-500 border-b border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                <Wifi className="w-3 h-3 text-slate-400" />
                <span>En línea</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[10px]">
                <WifiOff className="w-3 h-3 text-amber-700" />
                <span>Almacenamiento Local (Offline)</span>
              </span>
            )}

            {pendingOfflineCount > 0 && (
              <span className="bg-slate-800 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                {pendingOfflineCount} pendientes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={requestCurrentGPS}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition"
              title="Actualizar ubicación"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px] sm:max-w-[220px]">{userLocation.name}</span>
            </button>

            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 transition"
              title="Guía de uso"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guía</span>
            </button>
          </div>
        </div>

        {/* Main Bar */}
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          {/* Logo sobrio y formal */}
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white transition-colors ${
              isEmergency ? 'bg-red-700' : 'bg-slate-800'
            }`}>
              {isEmergency ? <ShieldAlert className="w-5 h-5" /> : <Building2 className="w-5 h-5 text-slate-200" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight">
                  {isEmergency ? 'ICARO • Centro de Contingencia' : 'ICARO • Red Comunitaria'}
                </span>
                <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded border ${
                  isEmergency ? 'bg-red-950 text-red-300 border-red-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {isEmergency ? 'Emergencia' : 'Ayllu'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal leading-none mt-0.5">
                {isEmergency 
                  ? 'Coordinación y auxilio barrial ante sismos e inundaciones' 
                  : 'Proximidad, servicios locales y apoyo solidario'}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSirenOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition active:scale-95"
              title="Alerta Sonora"
            >
              <Siren className="w-3.5 h-3.5 text-red-700" />
              <span className="hidden sm:inline">Alerta Sonora</span>
            </button>

            <button
              onClick={toggleMode}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs transition active:scale-95 border ${
                isEmergency
                  ? 'bg-red-800 hover:bg-red-700 text-white border-red-900'
                  : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-300" />
              <span>{isEmergency ? 'Desactivar Modo SOS' : 'Modo SOS / Emergencia'}</span>
            </button>
          </div>
        </div>
      </header>

      <EmergencySirenModal
        isOpen={isSirenOpen}
        onClose={() => setIsSirenOpen(false)}
      />
    </>
  );
};
