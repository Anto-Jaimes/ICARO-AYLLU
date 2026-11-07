import React, { useState } from 'react';
import { CheckCircle2, AlertOctagon, Users, Shield, HeartHandshake, Phone } from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { useApp } from '../context/AppContext';

interface SafetyCheckinSheetProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'ayllu_safety_status_v1';

export const SafetyCheckinSheet: React.FC<SafetyCheckinSheetProps> = ({ open, onClose }) => {
  const { userLocation, showNotice } = useApp();
  const [myStatus, setMyStatus] = useState<'safe' | 'danger' | null>(() => {
    return (localStorage.getItem(STORAGE_KEY) as 'safe' | 'danger') || null;
  });

  // Simulated neighborhood live triage counter
  const [safeCount, setSafeCount] = useState<number>(38);
  const [dangerCount, setDangerCount] = useState<number>(2);

  const handleMarkSafe = () => {
    setMyStatus('safe');
    localStorage.setItem(STORAGE_KEY, 'safe');
    setSafeCount((prev) => prev + 1);
    showNotice('Marcado como: "Estoy a salvo en mi hogar"');
  };

  const handleMarkDanger = () => {
    setMyStatus('danger');
    localStorage.setItem(STORAGE_KEY, 'danger');
    setDangerCount((prev) => prev + 1);
    showNotice('ALERTA: Reportaste que necesitas auxilio vecinal');
  };

  const handleClear = () => {
    setMyStatus(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Censo Rápido: ¿Estás a salvo?">
      <div className="px-4 pb-6 space-y-4 text-ink">
        <p className="text-secondary text-ink-2">
          Tras un sismo o desborde, marca tu estado con <strong>un solo toque</strong> para no saturar las líneas celulares y orientar a las brigadas.
        </p>

        {/* Live Census Counter */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-surface rounded-2xl border border-line">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 block">{safeCount}</span>
            <span className="text-meta font-bold text-emerald-800">Vecinos a salvo</span>
          </div>

          <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-center">
            <span className="text-xl sm:text-2xl font-black text-rojo block">{dangerCount}</span>
            <span className="text-meta font-bold text-rojo">Requieren auxilio</span>
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleMarkSafe}
            className={`w-full min-h-[72px] p-4 rounded-2xl font-bold text-section flex items-center justify-between transition cursor-pointer shadow-sm ${
              myStatus === 'safe'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-300'
                : 'bg-emerald-50 text-emerald-900 border-2 border-emerald-400 hover:bg-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
              <div className="text-left">
                <span className="block font-black text-row">ESTOY A SALVO</span>
                <span className="block text-meta font-normal opacity-90">Mi familia y yo estamos bien</span>
              </div>
            </div>
            {myStatus === 'safe' && <span className="text-meta font-black bg-white/20 px-2 py-0.5 rounded">Marcado</span>}
          </button>

          <button
            type="button"
            onClick={handleMarkDanger}
            className={`w-full min-h-[72px] p-4 rounded-2xl font-bold text-section flex items-center justify-between transition cursor-pointer shadow-sm ${
              myStatus === 'danger'
                ? 'bg-rojo text-white ring-4 ring-red-300'
                : 'bg-red-50 text-red-900 border-2 border-red-400 hover:bg-red-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-8 h-8 text-rojo shrink-0" />
              <div className="text-left">
                <span className="block font-black text-row">NECESITO AUXILIO</span>
                <span className="block text-meta font-normal opacity-90">Atrapado, herido o sin salida</span>
              </div>
            </div>
            {myStatus === 'danger' && <span className="text-meta font-black bg-white/20 px-2 py-0.5 rounded">Alerta</span>}
          </button>
        </div>

        {myStatus && (
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-meta text-ink-2 underline hover:text-ink cursor-pointer"
            >
              Cambiar o borrar mi estado
            </button>
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
