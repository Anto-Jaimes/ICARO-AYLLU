import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import { 
  X, 
  Handshake, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  QrCode, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AyniHandshakeModalProps {
  item: CommunityItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AyniHandshakeModal: React.FC<AyniHandshakeModalProps> = ({ item, isOpen, onClose }) => {
  const { toggleVistoBueno } = useApp();
  const [borrowerName, setBorrowerName] = useState<string>('');
  const [returnDays, setReturnDays] = useState<number>(2);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const handleConfirmLoan = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmed(true);
    toggleVistoBueno(item.id);

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore
    }
  };

  const handleReset = () => {
    setIsConfirmed(false);
    setBorrowerName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500 rounded-xl text-white">
              <Handshake className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Ayni Handshake Comunitario
              </h3>
              <p className="text-[11px] text-emerald-200">
                Pacto vecinal de confianza y reciprocidad
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="p-1 text-slate-300 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {!isConfirmed ? (
            <form onSubmit={handleConfirmLoan} className="space-y-4">
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950">
                <span className="font-bold block text-slate-800 mb-0.5">
                  Objeto o favor en préstamo:
                </span>
                <p className="font-semibold text-emerald-900">
                  {item.title}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Dueño solidario: {item.authorName} ({item.neighborhood})
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre del vecino que lo recibe *
                </label>
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  placeholder="Ej: Vecino Mateo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiempo estimado de préstamo (Días)
                </label>
                <select
                  value={returnDays}
                  onChange={(e) => setReturnDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value={1}>1 día (Uso rápido hoy)</option>
                  <option value={2}>2 días (Fin de semana)</option>
                  <option value={4}>4 días</option>
                  <option value={7}>1 semana</option>
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Beneficio de Confianza Ayni:</span>
                </div>
                <p>
                  Al devolver la herramienta o cumplir el favor, ambos vecinos suman <strong>+1 Visto Bueno Comunitario</strong> visible para todo el barrio.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar Préstamo Solidario</span>
              </button>
            </form>
          ) : (
            <div className="text-center py-4 space-y-3 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl">
                🤝
              </div>
              <h4 className="font-black text-lg text-slate-900">
                ¡Pacto de Ayni Confirmado!
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                <strong>{borrowerName}</strong> ha registrado el préstamo de <em>"{item.title}"</em> por <strong>{returnDays} días</strong>.
              </p>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-900">
                ⭐ Ambos vecinos han recibido +1 Visto Bueno Vecinal por cooperativismo comunitario.
              </div>
              <button
                onClick={handleReset}
                className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar y volver al muro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
