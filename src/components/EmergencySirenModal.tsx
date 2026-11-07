import React, { useState, useEffect } from 'react';
import { communitySiren } from '../utils/audioAlarm';
import { Volume2, VolumeX, AlertOctagon, X, Zap, ShieldAlert } from 'lucide-react';

interface EmergencySirenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySirenModal: React.FC<EmergencySirenModalProps> = ({ isOpen, onClose }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [flashLight, setFlashLight] = useState<boolean>(false);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setFlashLight((prev) => !prev);
      }, 250);
    } else {
      setFlashLight(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!isOpen && isPlaying) {
      communitySiren.stopSiren();
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSound = () => {
    if (isPlaying) {
      communitySiren.stopSiren();
      setIsPlaying(false);
    } else {
      const ok = communitySiren.startSiren();
      if (ok) setIsPlaying(true);
    }
  };

  const handleClose = () => {
    communitySiren.stopSiren();
    setIsPlaying(false);
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-colors duration-200 ${
      flashLight ? 'bg-rose-600/90' : 'bg-black/80'
    } backdrop-blur-md`}>
      <div className="bg-slate-950 text-white rounded-3xl max-w-md w-full p-6 text-center border-2 border-rose-500 shadow-2xl relative overflow-hidden">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center animate-bounce shadow-lg shadow-rose-900/60">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        <h3 className="text-xl font-black tracking-tight text-white uppercase">
          Sirena Vecinal de Alarma
        </h3>
        <p className="text-xs text-rose-300 mt-1 max-w-xs mx-auto">
          Emite una señal acústica estridente y destellos de pantalla para alertar a los vecinos de tu cuadra ante peligro inminente.
        </p>

        {/* Big Siren Button */}
        <div className="my-6">
          <button
            onClick={toggleSound}
            className={`w-36 h-36 rounded-full mx-auto font-black text-sm flex flex-col items-center justify-center gap-1 shadow-2xl transition-all transform active:scale-95 cursor-pointer ${
              isPlaying
                ? 'bg-rose-600 ring-8 ring-rose-400/50 animate-pulse text-white'
                : 'bg-gradient-to-tr from-amber-500 to-rose-600 text-white hover:brightness-110'
            }`}
          >
            {isPlaying ? (
              <>
                <VolumeX className="w-10 h-10 animate-bounce" />
                <span>DETENER SIRENA</span>
              </>
            ) : (
              <>
                <Volume2 className="w-10 h-10" />
                <span>ACTIVAR ALARMA</span>
              </>
            )}
          </button>
        </div>

        <div className="p-3 bg-rose-950/60 rounded-xl border border-rose-800 text-[11px] text-rose-200">
          ⚠️ <strong>Uso responsable:</strong> Úsala únicamente en emergencias reales (sismos, aniegos, personas atrapadas o llamados de auxilio en tu manzana).
        </div>
      </div>
    </div>
  );
};
