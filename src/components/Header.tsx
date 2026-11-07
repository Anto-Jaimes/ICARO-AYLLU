import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  HelpCircle, 
  MapPin, 
  Siren,
  Share2,
  Check
} from 'lucide-react';
import { IcaroBrandLogo } from './IcaroBrandLogo';
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
  const [copiedStatus, setCopiedStatus] = useState<boolean>(false);
  const isEmergency = mode === 'emergency';

  const handleShareSafeStatus = () => {
    const text = `🚨 ESTADO VECINAL ICARO-AYLLU: Me encuentro en ${userLocation.name}. Reporte generado a las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;
    if (navigator.share) {
      navigator.share({ title: 'Estado Vecinal', text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2500);
    }
  };

  return (
    <>
      <header className={`sticky top-0 z-30 transition-colors border-b ${
        isEmergency 
          ? 'bg-[#0B0F19] text-white border-red-900/50 shadow-xl' 
          : 'bg-white text-slate-900 border-slate-200 shadow-xs'
      }`}>
        {/* Barra superior de telemetría y estado rápido (Estilo Red Cross / Safe & Well) */}
        <div className={`px-4 py-1 text-xs flex justify-between items-center ${
          isEmergency ? 'bg-[#070A10] text-slate-400 border-b border-slate-800' : 'bg-slate-50 text-slate-500 border-b border-slate-100'
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
                <span>Modo Offline (Almacenamiento Local)</span>
              </span>
            )}

            {pendingOfflineCount > 0 && (
              <span className="bg-slate-800 text-white font-bold px-1.5 py-0.5 rounded text-[10px]">
                {pendingOfflineCount} sincronizaciones pendientes
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={requestCurrentGPS}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 transition"
              title="Actualizar ubicación precisa"
            >
              <MapPin className="w-3 h-3 text-slate-400" />
              <span className="truncate max-w-[150px] sm:max-w-[220px]">{userLocation.name}</span>
            </button>

            {/* Botón "Estoy Seguro / Compartir Estado" (Patrón Red Cross Safe&Well) */}
            <button
              onClick={handleShareSafeStatus}
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition ${
                isEmergency
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Compartir mensaje rápido de estado con tu familia"
            >
              {copiedStatus ? <Check className="w-3 h-3 text-emerald-500" /> : <Share2 className="w-3 h-3" />}
              <span>{copiedStatus ? 'Copiado' : 'Estoy Seguro'}</span>
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
          {/* Logo y contexto comunitario */}
          <div className="flex items-center gap-3">
            <IcaroBrandLogo size={40} isEmergency={isEmergency} />
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
                  ? 'Coordinación y auxilio vecinal ante sismos e inundaciones' 
                  : 'Proximidad, servicios locales y apoyo solidario'}
              </p>
            </div>
          </div>

          {/* Botones de acción rápida */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSirenOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition active:scale-95"
              title="Activar sirena sonora de alerta"
            >
              <Siren className="w-3.5 h-3.5 text-red-700" />
              <span className="hidden sm:inline">Sirena Sonora</span>
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
