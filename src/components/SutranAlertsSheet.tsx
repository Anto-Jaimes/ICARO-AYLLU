import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Car, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  MapPin, 
  MessageCircle, 
  Phone, 
  ShieldAlert, 
  TrafficCone 
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { getCachedRoadAlerts, RoadAlert, ROAD_EMERGENCY_CONTACTS } from '../services/sutranService';
import { tapFeedback } from '../lib/native';
import { useLanguage } from '../i18n/LanguageContext';

interface SutranAlertsSheetProps {
  open: boolean;
  onClose: () => void;
}

export const SutranAlertsSheet: React.FC<SutranAlertsSheetProps> = ({ open, onClose }) => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'todos' | 'interrumpido' | 'restringido' | 'normal'>('todos');
  const alerts: RoadAlert[] = getCachedRoadAlerts();

  const filtered = alerts.filter((a) => (filter === 'todos' ? true : a.level === filter));

  const levelBadge = (level: RoadAlert['level']) => {
    switch (level) {
      case 'interrumpido':
        return {
          bg: 'bg-red-950/40 text-red-400 border-red-600',
          dot: 'bg-red-500',
          label: 'Tránsito Interrumpido'
        };
      case 'restringido':
        return {
          bg: 'bg-amber-950/40 text-amber-400 border-amber-500',
          dot: 'bg-amber-500',
          label: 'Tránsito Restringido'
        };
      default:
        return {
          bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-600',
          dot: 'bg-emerald-500',
          label: 'Tránsito Normal'
        };
    }
  };

  return (
    <BottomSheet open={open} onClose={onClose} title={t('Estado de Carreteras (SUTRAN / Provías)')}>
      <div className="flex flex-col gap-3 pb-6 text-ink">
        {/* Header alert */}
        <div className="p-3 bg-amber-950/20 border border-amber-600/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrafficCone className="w-5 h-5 text-amber-500 shrink-0" />
            <div className="text-left">
              <span className="block text-xs font-bold text-ink">
                Red Vial Nacional del Perú (SUTRAN)
              </span>
              <span className="block text-[11px] text-ink-secondary">
                Monitoreo de huaicos, desbordes y bloqueos en carretera
              </span>
            </div>
          </div>
          <a
            href={`https://wa.me/${ROAD_EMERGENCY_CONTACTS.sutranWhatsapp.replace('+', '')}?text=Hola%20SUTRAN,%20reporto%20incidencia%20en%20carretera:`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Fiscafono
          </a>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {[
            { id: 'todos', label: 'Todas las vías' },
            { id: 'interrumpido', label: '🔴 Interrumpidas' },
            { id: 'restringido', label: '🟡 Restringidas' },
            { id: 'normal', label: '🟢 Transitables' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setFilter(cat.id as any); tapFeedback(); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all ${
                filter === cat.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface border border-line text-ink-secondary hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Road Alert Cards */}
        <div className="flex flex-col gap-2.5 max-h-[50vh] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const badge = levelBadge(item.level);
            return (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-surface border border-line flex flex-col gap-2 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="block text-xs font-bold text-ink">
                      {item.highway}
                    </span>
                    <span className="block text-[11px] text-ink-secondary flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      {item.location} • {item.department}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 flex items-center gap-1.5 ${badge.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </div>

                <p className="text-xs text-ink/90 leading-relaxed">
                  {item.description}
                </p>

                {item.alternativeRoute && (
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 text-[11px] text-ink-secondary flex items-start gap-1.5">
                    <Car className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span><strong>Ruta alterna:</strong> {item.alternativeRoute}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Emergency road buttons */}
        <div className="pt-2 border-t border-line grid grid-cols-2 gap-2">
          <a
            href={`tel:${ROAD_EMERGENCY_CONTACTS.policiaCarreteras}`}
            className="py-2 px-3 bg-surface border border-line rounded-xl text-xs font-bold text-ink flex items-center justify-center gap-2 hover:bg-neutral-100"
          >
            <Phone className="w-4 h-4 text-primary" />
            Policía Carreteras (110)
          </a>
          <a
            href={`tel:${ROAD_EMERGENCY_CONTACTS.sutranTollFree}`}
            className="py-2 px-3 bg-surface border border-line rounded-xl text-xs font-bold text-ink flex items-center justify-center gap-2 hover:bg-neutral-100"
          >
            <Phone className="w-4 h-4 text-amber-500" />
            SUTRAN (0800 12345)
          </a>
        </div>
      </div>
    </BottomSheet>
  );
};
