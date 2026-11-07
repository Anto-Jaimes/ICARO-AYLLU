import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  AlertTriangle, 
  Wifi, 
  WifiOff, 
  HelpCircle, 
  MapPin, 
  Navigation,
  Volume2
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
      <header className={`sticky top-0 z-30 transition-colors duration-300 shadow-md ${
        isEmergency 
          ? 'bg-rose-950 text-white border-b-4 border-rose-500' 
          : 'bg-white text-slate-800 border-b border-slate-200'
      }`}>
        {/* Top micro bar: Connectivity & Neighborhood GPS */}
        <div className={`px-4 py-1.5 text-xs flex justify-between items-center ${
          isEmergency ? 'bg-rose-900/60 text-rose-200' : 'bg-slate-100 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <Wifi className="w-3.5 h-3.5" /> En línea
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                Modo Offline Activo
              </span>
            )}

            {pendingOfflineCount > 0 && (
              <span className="bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded text-[10px] animate-bounce">
                {pendingOfflineCount} por sincronizar
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={requestCurrentGPS}
              className="flex items-center gap-1 hover:underline cursor-pointer transition text-[11px]"
              title="Actualizar mi geolocalización precisa"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate max-w-[140px] sm:max-w-[200px]">{userLocation.name}</span>
              <Navigation className="w-3 h-3 text-slate-400" />
            </button>

            <button
              onClick={() => setIsTutorialOpen(true)}
              className="flex items-center gap-1 text-[11px] font-medium hover:text-amber-500 transition cursor-pointer"
              title="Ver tutorial de uso"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">¿Cómo funciona?</span>
            </button>
          </div>
        </div>

        {/* Main Bar */}
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Brand / Logo */}
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-md transition-all ${
              isEmergency 
                ? 'bg-rose-600 text-white shadow-rose-900/50 animate-emergency-pulse' 
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-orange-500/30'
            }`}>
              {isEmergency ? '🚨' : '☀️'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight">ICARO-AYLLU</span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                  isEmergency 
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-400/40' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  Red Vecinal
                </span>
              </div>
              <p className={`text-[11px] font-medium leading-none ${
                isEmergency ? 'text-rose-300' : 'text-slate-500'
              }`}>
                {isEmergency 
                  ? 'Coordinación y Ayuda Vecinal Inmediata' 
                  : 'Economía Local & Cadena de Favores'}
              </p>
            </div>
          </div>

          {/* Emergency Siren & Mode Switcher */}
          <div className="flex items-center gap-2">
            {/* Siren Alarm Trigger Button */}
            <button
              onClick={() => setIsSirenOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500 text-rose-500 hover:text-rose-600 font-extrabold text-xs transition cursor-pointer"
              title="Activar Sirena Sonora Vecinal de Pánico"
            >
              <Volume2 className="w-4 h-4 animate-pulse text-rose-500" />
              <span className="hidden sm:inline">Sirena Vecinal</span>
            </button>

            {/* Emergency Mode Toggle Switch */}
            <button
              onClick={toggleMode}
              className={`relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-md transition-all duration-300 ${
                isEmergency
                  ? 'bg-rose-600 hover:bg-rose-500 text-white ring-2 ring-rose-400 ring-offset-2 ring-offset-rose-950 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-rose-400'
              }`}
              title="Activar o desactivar el Modo Emergencia en tu barrio"
            >
              {isEmergency ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-300 animate-bounce" />
                  <span>MODO EMERGENCIA ACTIVO</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="hidden sm:inline">Activar</span>
                  <span className="text-rose-700 font-extrabold">Modo Emergencia</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Emergency banner if active */}
        {isEmergency && (
          <div className="bg-rose-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between animate-fadeIn">
            <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Priorizando auxilio a vecinos vulnerables, brigadas y recursos críticos.
              </span>
              <button 
                onClick={toggleMode}
                className="text-[11px] underline hover:text-rose-200 cursor-pointer ml-2"
              >
                Salir de emergencia
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Emergency Siren Modal */}
      <EmergencySirenModal
        isOpen={isSirenOpen}
        onClose={() => setIsSirenOpen(false)}
      />
    </>
  );
};
