import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, ShieldAlert, Wrench, HeartHandshake } from 'lucide-react';

interface PrintableMuralModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintableMuralModal: React.FC<PrintableMuralModalProps> = ({ isOpen, onClose }) => {
  const { items, userLocation } = useApp();

  if (!isOpen) return null;

  const services = items.filter((i) => i.type === 'service');
  const favors = items.filter((i) => i.type === 'favor_offer');
  const emergencies = items.filter((i) =>
    ['emergency_need', 'emergency_resource', 'support_group'].includes(i.type)
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white text-slate-900 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-300 relative print:shadow-none print:border-none print:rounded-none print:p-4">
        {/* Modal Controls (Hidden when printed) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-anil text-white rounded-xl font-bold">
              <Printer className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Mural Comunal Imprimible (Bodega / Tambo)
              </h3>
              <p className="text-xs text-ink-2">
                Pega este resumen en la pared para vecinos sin smartphone o ante apagones.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-anil hover:bg-anil-press text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-ink-2 hover:text-ink transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE SHEET */}
        <div className="space-y-6">
          <div className="border-b-4 border-black pb-3 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">☀️</span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                  Mural Comunal • AYLLU
                </h1>
              </div>
              <p className="text-xs font-bold text-slate-600 mt-0.5">
                Red Vecinal de Proximidad, Economía Solidaria y Resiliencia Comunitaria
              </p>
            </div>
            <div className="text-right text-xs">
              <p className="font-black">Zona: {userLocation.name}</p>
              <p className="text-slate-500">Fecha: {new Date().toLocaleDateString('es-PE')}</p>
            </div>
          </div>

          {/* Section 1: Emergency & Brigades */}
          <div className="border-2 border-rojo rounded-2xl p-4 bg-red-50/50">
            <div className="flex items-center gap-1.5 font-black text-rojo text-sm mb-2 uppercase">
              <ShieldAlert className="w-4 h-4" />
              <span>Teléfonos de Auxilio y Brigadas de Emergencia</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {emergencies.slice(0, 4).map((emg) => (
                <div key={emg.id} className="bg-white p-2.5 rounded-lg border border-red-200">
                  <span className="font-bold block text-slate-900 truncate">{emg.title}</span>
                  <div className="flex justify-between text-[11px] text-slate-600 mt-1">
                    <span>Contacto: {emg.authorName}</span>
                    <strong className="text-rojo">{emg.authorPhone || 'Comunidad'}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Verified Local Services */}
          <div>
            <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm mb-2 border-b-2 border-slate-300 pb-1 uppercase">
              <Wrench className="w-4 h-4 text-anil" />
              <span>Directorio de Oficios con Visto Bueno Vecinal</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {services.slice(0, 6).map((srv) => (
                <div key={srv.id} className="p-2.5 rounded-xl border border-slate-300 bg-slate-50">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-900">{srv.title}</span>
                    <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                      {srv.vistosBuenos} Vistos Buenos
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1 mt-1">{srv.description}</p>
                  <div className="mt-2 flex justify-between items-center text-[11px] border-t border-slate-200 pt-1">
                    <span className="font-medium text-slate-700">{srv.authorName} ({srv.neighborhood})</span>
                    <span className="font-bold text-slate-900">{srv.authorPhone || 'En la zona'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Ayni Tool Lending */}
          <div>
            <div className="flex items-center gap-1.5 font-black text-slate-800 text-sm mb-2 border-b-2 border-slate-300 pb-1 uppercase">
              <HeartHandshake className="w-4 h-4 text-emerald-600" />
              <span>Herramientas en Préstamo Solidario (Pacto Ayni)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {favors.slice(0, 4).map((fav) => (
                <div key={fav.id} className="p-2 rounded-xl border border-emerald-300 bg-emerald-50/50">
                  <span className="font-bold text-slate-900 block">{fav.title}</span>
                  <div className="flex justify-between items-center text-[11px] text-slate-600 mt-1">
                    <span>Dueño: {fav.authorName}</span>
                    <span className="font-bold text-emerald-800">{fav.authorPhone || 'En la zona'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-300 pt-3 text-center text-[11px] text-slate-500">
            <p>Pacto de reciprocidad comunitaria • La verdadera riqueza del barrio es la ayuda mutua entre vecinos.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
