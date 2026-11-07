import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import { 
  AlertTriangle, 
  LifeBuoy, 
  BatteryCharging, 
  Droplet, 
  Users, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Plus, 
  CheckCircle, 
  Clock, 
  Radio, 
  Heart, 
  ShieldAlert,
  Flame
} from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';

export const EmergencyBoard: React.FC = () => {
  const { 
    filteredItems, 
    setSelectedItemForDetail, 
    setIsPublishModalOpen,
    updateItemStatus,
    toggleVistoBueno
  } = useApp();

  const [subSection, setSubSection] = useState<'all' | 'needs' | 'resources' | 'brigades'>('all');

  const emergencyItems = filteredItems.filter((i) => 
    ['emergency_need', 'emergency_resource', 'support_group'].includes(i.type)
  );

  const displayed = emergencyItems.filter((item) => {
    if (subSection === 'needs') return item.type === 'emergency_need';
    if (subSection === 'resources') return item.type === 'emergency_resource';
    if (subSection === 'brigades') return item.type === 'support_group';
    return true;
  });

  // Emergency stats counter
  const criticalCount = emergencyItems.filter(i => i.type === 'emergency_need' && i.status === 'active').length;
  const resourceCount = emergencyItems.filter(i => i.type === 'emergency_resource').length;
  const brigadeCount = emergencyItems.filter(i => i.type === 'support_group').length;

  return (
    <div className="space-y-4">
      {/* Emergency Alert Hero Header */}
      <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 text-white p-5 rounded-2xl border-2 border-rose-500 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-rose-600 rounded-xl animate-emergency-pulse">
                <ShieldAlert className="w-6 h-6 text-white" />
              </span>
              <div>
                <span className="bg-rose-500 text-white text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-wider animate-pulse">
                  Centro de Comando Vecinal
                </span>
                <h2 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                  Tablero Humanitario & Red de Respuesta Vecinal
                </h2>
              </div>
            </div>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-rose-950 font-black text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4 text-rose-900 animate-bounce" />
              <span>Reportar Necesidad o Compartir Recurso</span>
            </button>
          </div>

          <p className="text-xs text-rose-200 mt-2.5 max-w-2xl leading-relaxed">
            Espacio geolocalizado para identificar vecinos en alta vulnerabilidad (adultos mayores, salud, sin agua), activar brigadas de primeros auxilios y compartir generadores o suministros críticos sin intermediarios.
          </p>

          {/* Real-time emergency counters */}
          <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-rose-800/80">
            <div className="bg-rose-900/60 p-2 rounded-xl text-center border border-rose-800">
              <span className="text-lg sm:text-xl font-black text-amber-300">{criticalCount}</span>
              <p className="text-[10px] text-rose-200 font-semibold leading-tight">Casos por Atender</p>
            </div>
            <div className="bg-rose-900/60 p-2 rounded-xl text-center border border-rose-800">
              <span className="text-lg sm:text-xl font-black text-emerald-400">{resourceCount}</span>
              <p className="text-[10px] text-rose-200 font-semibold leading-tight">Recursos Críticos</p>
            </div>
            <div className="bg-rose-900/60 p-2 rounded-xl text-center border border-rose-800">
              <span className="text-lg sm:text-xl font-black text-sky-400">{brigadeCount}</span>
              <p className="text-[10px] text-rose-200 font-semibold leading-tight">Brigadas Activas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSubSection('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'all'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border border-rose-800'
          }`}
        >
          🚨 Todos los reportes ({emergencyItems.length})
        </button>
        <button
          onClick={() => setSubSection('needs')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'needs'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border border-rose-800'
          }`}
        >
          👵 Vecinos en Vulnerabilidad ({criticalCount})
        </button>
        <button
          onClick={() => setSubSection('resources')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'resources'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border border-rose-800'
          }`}
        >
          💧 Recursos Críticos (Agua / Luz) ({resourceCount})
        </button>
        <button
          onClick={() => setSubSection('brigades')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'brigades'
              ? 'bg-sky-600 text-white shadow-md'
              : 'bg-rose-950/40 text-rose-200 hover:bg-rose-900/50 border border-rose-800'
          }`}
        >
          🚑 Brigadas & Primeros Auxilios ({brigadeCount})
        </button>
      </div>

      {/* Card Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 bg-rose-950/30 rounded-2xl border border-rose-900 p-6 text-rose-200">
          <p className="text-4xl mb-2">🛡️</p>
          <h3 className="font-bold text-white text-base">Sin alertas activas en esta categoría</h3>
          <p className="text-xs text-rose-300 mt-1 mb-4">
            Si conoces a un vecino en necesidad o puedes habilitar agua o electricidad, compártelo ahora.
          </p>
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Publicar reporte de auxilio
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((item) => (
            <EmergencyCard
              key={item.id}
              item={item}
              onOpenDetail={() => setSelectedItemForDetail(item)}
              onToggleVisto={() => toggleVistoBueno(item.id)}
              onResolve={() => updateItemStatus(item.id, item.status === 'resolved' ? 'active' : 'resolved')}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface EmergencyCardProps {
  item: CommunityItem;
  onOpenDetail: () => void;
  onToggleVisto: () => void;
  onResolve: () => void;
}

const EmergencyCard: React.FC<EmergencyCardProps> = ({ 
  item, 
  onOpenDetail, 
  onToggleVisto, 
  onResolve 
}) => {
  const isNeed = item.type === 'emergency_need';
  const isResource = item.type === 'emergency_resource';
  const isBrigade = item.type === 'support_group';
  const isResolved = item.status === 'resolved';

  const whatsappUrl = item.authorPhone && buildWhatsAppLink(
    item.authorPhone,
    `ALERTA VECINAL ICARO-AYLLU: Me comunico respecto al reporte de emergencia "${item.title}" para ofrecer apoyo inmediato.`
  );

  return (
    <div className={`rounded-2xl border-2 transition-all flex flex-col justify-between overflow-hidden shadow-lg ${
      isResolved
        ? 'bg-slate-900/60 border-emerald-700/60 opacity-80'
        : isNeed
          ? 'bg-rose-950/70 border-rose-600/80 hover:border-rose-400'
          : isResource
            ? 'bg-slate-900/80 border-emerald-600/80 hover:border-emerald-400'
            : 'bg-slate-900/80 border-sky-600/80 hover:border-sky-400'
    }`}>
      {/* Header tags */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isNeed && (
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                item.urgencyLevel === 'critica'
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-amber-500 text-slate-950 font-black'
              }`}>
                ⚠️ Auxilio: Urgencia {item.urgencyLevel || 'Alta'}
              </span>
            )}

            {isResource && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                💧 Recurso Crítico Compartido
              </span>
            )}

            {isBrigade && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-sky-500 text-slate-950">
                🚑 Brigada Vecinal / Triage
              </span>
            )}

            {isResolved && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                ✅ ATENDIDO / RESUELTO
              </span>
            )}
          </div>

          <span className="text-[11px] text-rose-300 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" /> {item.createdAt}
          </span>
        </div>

        {/* Title */}
        <h3 
          onClick={onOpenDetail}
          className="font-black text-white text-base hover:text-amber-300 transition cursor-pointer leading-snug"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-rose-100/90 mt-2 line-clamp-3 leading-relaxed">
          {item.description}
        </p>

        {/* Insumo / Nota */}
        {item.priceInfo && (
          <div className="mt-3 p-2 bg-rose-900/50 rounded-xl border border-rose-800 text-xs text-amber-200 font-semibold">
            {item.priceInfo}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-black/40 border-t border-rose-900/60 flex items-center justify-between gap-2 mt-auto text-xs">
        <div className="flex flex-col text-rose-200 min-w-0">
          <div className="flex items-center gap-1 font-medium text-white truncate">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">{item.neighborhood}</span>
          </div>
          <span className="text-[11px] text-amber-300 font-bold pl-4">
            {formatDistance(item.distanceMeters)} • Contacto: {item.authorName}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isNeed && (
            <button
              onClick={onResolve}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                isResolved
                  ? 'bg-rose-900 text-rose-200 hover:bg-rose-800'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Marcar como atendido o reactivar"
            >
              {isResolved ? 'Reabrir' : 'Marcar Atendido'}
            </button>
          )}

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs shadow-md transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Ayudar Ahora</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
