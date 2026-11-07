import React, { useMemo, useState } from 'react';
import { Boxes, HandHeart, Phone, UsersRound, Waves, type LucideIcon } from 'lucide-react';
import { Tab, useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { CommunityItem, PostType } from '../types';
import { describeDistance } from '../utils/geo';
import { AcousticBeaconSheet } from '../components/AcousticBeaconSheet';

interface EmergencyView {
  type: PostType;
  heading: string;
  empty: string;
  icon: LucideIcon;
}

const VIEWS: Partial<Record<Tab, EmergencyView>> = {
  neighbors: { type: 'emergency_need', heading: 'Vecinos que piden ayuda', empty: 'Nadie ha pedido ayuda cerca', icon: HandHeart },
  resources: { type: 'emergency_resource', heading: 'Recursos para compartir', empty: 'Todavía no hay recursos cerca', icon: Boxes },
  groups: { type: 'support_group', heading: 'Grupos de ayuda', empty: 'Todavía no hay grupos cerca', icon: UsersRound }
};

const URGENCY_ORDER = ['critica', 'alta', 'media', 'baja'];

const EmergencyRow: React.FC<{ item: CommunityItem }> = ({ item }) => {
  const { openItem, updateItemStatus } = useApp();
  const distance = describeDistance(item.distanceMeters);
  const isNeed = item.type === 'emergency_need';
  const isOnTheWay = item.status === 'in_progress';

  return (
    <div className="px-4 py-3">
      <button type="button" onClick={() => openItem(item.id)} className="block w-full min-h-12 text-left">
        <span className="block text-row font-bold">{item.title}</span>
        <span className="block text-secondary">
          {[item.neighborhood, distance].filter(Boolean).join(', ')}
        </span>
        {isOnTheWay && <span className="block text-secondary font-bold">Un vecino ya va en camino</span>}
      </button>

      <div className="flex gap-2 mt-2">
        {isNeed && !isOnTheWay && (
          <button type="button" className="btn btn-danger" onClick={() => updateItemStatus(item.id, 'in_progress')}>
            Voy a ayudar
          </button>
        )}
        {item.authorPhone && (
          <a href={`tel:${item.authorPhone}`} className="btn btn-secondary">
            <Phone className="w-5 h-5" aria-hidden="true" />
            Llamar
          </a>
        )}
      </div>
    </div>
  );
};

export const EmergencyScreen: React.FC = () => {
  const { items, tab, hasLocation, isLoadingItems } = useApp();
  const { verdict } = useHazards();
  const [isAcousticOpen, setIsAcousticOpen] = useState(false);
  const view = VIEWS[tab] ?? VIEWS.neighbors!;

  const posts = useMemo(() => {
    return items
      .filter((item) => item.type === view.type && item.status !== 'resolved')
      .sort(
        (a, b) =>
          URGENCY_ORDER.indexOf(a.urgencyLevel ?? 'baja') - URGENCY_ORDER.indexOf(b.urgencyLevel ?? 'baja') ||
          (hasLocation ? (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) : 0)
      );
  }, [items, view.type, hasLocation]);

  return (
    <div className="app-nav-offset page">
      {/* Banner de Radar Acústico P2P (Data-over-Sound) */}
      <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-slate-950 to-indigo-950 text-white rounded-2xl shadow-sm border border-indigo-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-800/60 shadow-inner">
            <Waves className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <span className="block text-secondary font-bold text-slate-100 flex items-center gap-1.5">
              Radar Acústico P2P
              <span className="text-[10px] bg-cyan-900/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/60 font-bold uppercase">
                100% Offline
              </span>
            </span>
            <span className="block text-caption text-slate-300 truncate">
              Emite o escucha socorro por ondas de sonido sin red ni Bluetooth
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAcousticOpen(true)}
          className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-secondary font-bold rounded-xl shrink-0 shadow transition-all active:scale-95"
        >
          Abrir
        </button>
      </div>

      <p className="px-4 pt-3 text-secondary font-bold">{verdict.title}</p>
      <h2 className="px-4 pt-3 pb-1 text-section font-bold">{view.heading}</h2>

      {posts.length === 0 ? (
        isLoadingItems ? (
          <LoadingRow text="Buscando reportes..." />
        ) : (
          <EmptyState icon={view.icon} title={view.empty} line="Toca Reportar si necesitas ayuda o puedes darla." />
        )
      ) : (
        <ul className="list-plain grid-wide">
          {posts.map((item) => (
            <li key={item.id}><EmergencyRow item={item} /></li>
          ))}
        </ul>
      )}

      {/* Sheet de Radar Acústico */}
      <AcousticBeaconSheet
        open={isAcousticOpen}
        onClose={() => setIsAcousticOpen(false)}
      />
    </div>
  );
};
