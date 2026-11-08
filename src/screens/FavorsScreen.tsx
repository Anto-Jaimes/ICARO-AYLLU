import React, { useMemo, useState } from 'react';
import { Check, HandHeart, HandHelping } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FAVOR_CATEGORIES } from '../data/categories';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { PostRow } from '../components/PostRow';
import { TopBar } from '../components/TopBar';

type Side = 'favor_offer' | 'favor_request';

const SIDES: { type: Side; label: string }[] = [
  { type: 'favor_offer', label: 'Ofrecen' },
  { type: 'favor_request', label: 'Piden' }
];

export const FavorsScreen: React.FC = () => {
  const { items, hasLocation, isLoadingItems, openPublish } = useApp();
  const [side, setSide] = useState<Side>('favor_offer');
  const [category, setCategory] = useState<string | null>(null);

  const counts = useMemo(() => ({
    favor_offer: items.filter((item) => item.type === 'favor_offer').length,
    favor_request: items.filter((item) => item.type === 'favor_request' && item.status !== 'resolved').length
  }), [items]);

  // Requests still waiting come first; the nearest first within each group.
  const favors = useMemo(() => {
    const isDone = (status: string) => (status === 'resolved' ? 1 : 0);
    return items
      .filter((item) => item.type === side)
      .filter((item) => !category || item.category === category)
      .sort((a, b) => isDone(a.status) - isDone(b.status) || (hasLocation ? (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) : 0));
  }, [items, side, category, hasLocation]);

  return (
    <div className="app-nav-offset">
      <TopBar title="Favores" />
      <div className="page">
      <p className="px-4 pt-3 text-secondary text-ink-2">
        Presta, regala o pide una mano, sin dinero. Coordinan por WhatsApp o llamada.
      </p>

      <div className="grid grid-cols-2 gap-2 px-4 pt-3 lg:max-w-md">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openPublish({ type: 'favor_request', category: 'ayuda_temporal', title: 'Necesito una mano' })}
        >
          <HandHelping className="w-5 h-5" aria-hidden="true" />
          Pedir un favor
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => openPublish({ type: 'favor_offer', category: 'ayuda_temporal', title: 'Puedo dar una mano' })}
        >
          <HandHeart className="w-5 h-5" aria-hidden="true" />
          Ofrecer o prestar
        </button>
      </div>

      <div className="px-4 pt-3 lg:max-w-md" role="group" aria-label="Qué quieres ver">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-sunken">
          {SIDES.map((option) => (
            <button
              key={option.type}
              type="button"
              aria-pressed={side === option.type}
              onClick={() => setSide(option.type)}
              className={`min-h-12 rounded-lg text-secondary font-bold ${
                side === option.type ? 'bg-anil text-white' : 'text-ink'
              }`}
            >
              {option.label} ({counts[option.type]})
            </button>
          ))}
        </div>
      </div>

      <div className="chip-row pt-2" role="group" aria-label="Filtrar favores">
        {FAVOR_CATEGORIES.map((option) => (
          <button
            key={option.id}
            type="button"
            className="chip"
            aria-pressed={category === option.id}
            onClick={() => setCategory(category === option.id ? null : option.id)}
          >
            {category === option.id && <Check className="w-4 h-4" aria-hidden="true" />}
            {option.label}
          </button>
        ))}
      </div>

      {favors.length === 0 ? (
        isLoadingItems ? (
          <LoadingRow text="Buscando favores..." />
        ) : (
          <EmptyState
            icon={HandHeart}
            title="Nadie ha publicado aquí todavía"
            line={side === 'favor_offer' ? 'Toca Publicar para prestar o regalar algo.' : 'Toca Publicar para pedir una mano.'}
          />
        )
      ) : (
        <ul className="list grid-wide pt-2">
          {favors.map((item) => (
            <li key={item.id}><PostRow item={item} showRecommendations={false} /></li>
          ))}
        </ul>
      )}
      </div>
    </div>
  );
};
