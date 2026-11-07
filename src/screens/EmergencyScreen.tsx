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
      {/* In an emergency, hearing a trapped neighbour by sound can matter more than anything else. */}
      <button type="button" className="row border-b border-line" onClick={() => setIsAcousticOpen(true)}>
        <Waves className="w-6 h-6 shrink-0 text-rojo" aria-hidden="true" />
        <span className="flex-1">
          <span className="block text-row font-semibold">Radar por sonido</span>
          <span className="block text-secondary text-ink-2">Pide o escucha socorro con el parlante y el micrófono, sin internet</span>
        </span>
      </button>

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
