import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CommunityItem } from '../types';
import { 
  AlertTriangle, 
  Droplet, 
  Users, 
  MapPin, 
  MessageCircle, 
  Clock, 
  ShieldAlert,
  Flame,
  CheckCircle2,
  Footprints,
  Award
} from 'lucide-react';
import { formatDistance, buildWhatsAppLink } from '../utils/geo';
import { WidenSearchButton } from './WidenSearchButton';

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

  const criticalCount = emergencyItems.filter(i => i.type === 'emergency_need' && i.status === 'active').length;
  const resourceCount = emergencyItems.filter(i => i.type === 'emergency_resource').length;
  const brigadeCount = emergencyItems.filter(i => i.type === 'support_group').length;

  return (
    <div className="space-y-4">
      {/* Tactical Emergency HUD */}
      <div className="bg-slate-950 text-white p-5 sm:p-6 rounded-3xl border border-red-500/60 shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-red-800 rounded-2xl shadow-lg shadow-red-900/40 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 text-white" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider">
                    Puesto de Mando Vecinal
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Despacho en Vivo</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black tracking-tight mt-1 text-white">
                  Tablero Humanitario & Red de Respuesta Inmediata
                </h2>
              </div>
            </div>

            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-800 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-lg transition active:scale-95 cursor-pointer border border-red-700"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              <span>Reportar Necesidad o Recurso SOS</span>
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2.5 max-w-2xl leading-relaxed">
            Coordinación de auxilio directo a vecinos vulnerables (adultos mayores, salud, corte de agua), brigadas de primeros auxilios y recursos comunitarios compartidos.
          </p>

          {/* Bento Grid de Telemetría Táctica */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-red-900/40">
              <span className="text-xl sm:text-2xl font-black text-red-400 block">{criticalCount}</span>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wide mt-0.5">Casos por Atender</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-emerald-900/40">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 block">{resourceCount}</span>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wide mt-0.5">Recursos Críticos</p>
            </div>
            <div className="bg-slate-900/90 p-3 rounded-2xl border border-sky-900/40">
              <span className="text-xl sm:text-2xl font-black text-sky-400 block">{brigadeCount}</span>
              <p className="text-[10px] text-slate-300 font-bold uppercase tracking-wide mt-0.5">Brigadistas en Guardia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de subsecciones sin emojis */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setSubSection('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'all'
              ? 'bg-red-800 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Todos los reportes ({emergencyItems.length})
        </button>
        <button
          onClick={() => setSubSection('needs')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'needs'
              ? 'bg-red-800 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Vecinos en Vulnerabilidad ({criticalCount})
        </button>
        <button
          onClick={() => setSubSection('resources')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'resources'
              ? 'bg-emerald-800 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Recursos Críticos (Agua / Luz) ({resourceCount})
        </button>
        <button
          onClick={() => setSubSection('brigades')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
            subSection === 'brigades'
              ? 'bg-sky-800 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Brigadas & Primeros Auxilios ({brigadeCount})
        </button>
      </div>

      {/* Grid de Tarjetas Tácticas */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 p-6 text-slate-300">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="font-bold text-white text-base">Sin alertas activas en esta categoría</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Si conoces a un vecino en necesidad o puedes habilitar agua o electricidad, compártelo ahora.
          </p>
          <WidenSearchButton />
          <button
            onClick={() => setIsPublishModalOpen(true)}
            className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-md"
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

  const whatsappUrl = buildWhatsAppLink(
    item.authorPhone || '',
    `ALERTA VECINAL ICARO-AYLLU: Me comunico respecto al reporte de emergencia "${item.title}" para ofrecer apoyo inmediato.`
  );

  const walkingMinutes = Math.max(1, Math.round((item.distanceMeters || 100) / 80));

  return (
    <article className={`rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-xl ${
      isResolved
        ? 'bg-slate-900/60 border-emerald-700/40 opacity-75'
        : isNeed
          ? 'bg-slate-950 border-red-500/70 hover:border-red-400 shadow-red-950/40'
          : isResource
            ? 'bg-slate-950 border-emerald-500/60 hover:border-emerald-400 shadow-emerald-950/30'
            : 'bg-slate-950 border-sky-500/60 hover:border-sky-400 shadow-sky-950/30'
    }`}>
      {/* Header tags */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isNeed && (
              <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                item.urgencyLevel === 'critica'
                  ? 'bg-red-800 text-white shadow-md'
                  : 'bg-amber-800 text-white'
              }`}>
                <AlertTriangle className="w-3 h-3" />
                <span>Auxilio: Urgencia {item.urgencyLevel || 'Alta'}</span>
              </span>
            )}

            {isResource && (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-800 text-white flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                <span>Recurso Crítico</span>
              </span>
            )}

            {isBrigade && (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-800 text-white flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Brigada Vecinal / Triage</span>
              </span>
            )}

            {isResolved && (
              <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-700 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Atendido / Resuelto</span>
              </span>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" /> {item.createdAt}
          </span>
        </div>

        {/* Title */}
        <h3 
          onClick={onOpenDetail}
          className="font-bold text-white text-base hover:text-red-400 transition cursor-pointer leading-snug"
        >
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Proximidad urbana OSRM */}
        <div className="mt-3 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-200 font-semibold bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
            <Footprints className="w-3.5 h-3.5 text-amber-500" />
            <span>{walkingMinutes} min a pie ({formatDistance(item.distanceMeters || 120)})</span>
          </div>

          {/* Sello Visto Bueno */}
          <button
            onClick={onToggleVisto}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition active:scale-95 ${
              item.hasUserVoted
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-900 text-emerald-400 border border-emerald-900/60 hover:bg-slate-800'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>{item.vistosBuenos} Vistos Buenos</span>
          </button>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between gap-3 mt-auto text-xs">
        <div className="flex items-center gap-1.5 text-slate-400 truncate">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate font-medium">{item.neighborhood}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResolve}
            className={`px-3 py-1.5 rounded-xl font-bold transition ${
              isResolved 
                ? 'bg-slate-800 text-slate-400 hover:text-white' 
                : 'bg-emerald-900/40 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/60'
            }`}
          >
            {isResolved ? 'Reabrir' : 'Atender'}
          </button>

          {item.authorPhone && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition active:scale-95"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contactar</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
};
