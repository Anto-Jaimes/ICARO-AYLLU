import React, { useMemo, useState } from 'react';
import { Check, Gift, HandHelping } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DONATION_CATEGORIES } from '../data/categories';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { PostRow } from '../components/PostRow';
import { TopBar } from '../components/TopBar';
import { useT } from '../i18n/LanguageContext';

type Side = 'favor_offer' | 'favor_request';

const SIDES: { type: Side; label: string }[] = [
  { type: 'favor_offer', label: 'Regalan' },
  { type: 'favor_request', label: 'Piden' }
];

/**
 * Donations: a neighbour gives something away (what, where to pick it up, photos), to anyone or to an
 * organisation; or a neighbour or organisation (comedor, olla común, albergue) asks for something.
 * The tab keeps its old id "favors" and the posts their old types, so nothing published is lost.
 */
export const FavorsScreen: React.FC = () => {
  const { items, hasLocation, isLoadingItems, openPublish } = useApp();
  const t = useT();
  const [side, setSide] = useState<Side>('favor_offer');
  const [category, setCategory] = useState<string | null>(null);

  const counts = useMemo(() => ({
    favor_offer: items.filter((item) => item.type === 'favor_offer' && item.status !== 'resolved').length,
    favor_request: items.filter((item) => item.type === 'favor_request' && item.status !== 'resolved').length
  }), [items]);

  // What is still available comes first; the nearest first within each group.
  const donations = useMemo(() => {
    const isDone = (status: string) => (status === 'resolved' ? 1 : 0);
    return items
      .filter((item) => item.type === side)
      .filter((item) => !category || item.category === category)
      .sort((a, b) => isDone(a.status) - isDone(b.status) || (hasLocation ? (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) : 0));
  }, [items, side, category, hasLocation]);

  return (
    <div className="app-nav-offset">
      <TopBar title={t('Donaciones')} />
      <div className="page">
        <p className="px-4 pt-3 text-secondary text-ink-2">
          {t('Regala lo que ya no usas, o pide para tu familia, comedor, olla común o albergue. Sin dinero: coordinan por WhatsApp o llamada.')}
        </p>

        <div className="grid grid-cols-2 gap-2 px-4 pt-3 lg:max-w-md">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => openPublish({ type: 'favor_offer', category: 'otros_donacion', title: '' })}
          >
            <Gift className="w-5 h-5" aria-hidden="true" />
            {t('Donar algo')}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openPublish({ type: 'favor_request', category: 'alimentos', title: '' })}
          >
            <HandHelping className="w-5 h-5" aria-hidden="true" />
            {t('Pedir una donación')}
          </button>
        </div>

        <div className="px-4 pt-3 lg:max-w-md" role="group" aria-label={t('Qué quieres ver')}>
          <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-sunken">
            {SIDES.map((option) => (
              <button
                key={option.type}
                type="button"
                aria-pressed={side === option.type}
                onClick={() => setSide(option.type)}
                className={`min-h-12 rounded-lg text-secondary font-bold ${side === option.type ? 'bg-anil text-white' : 'text-ink'}`}
              >
                {t(option.label)} ({counts[option.type]})
              </button>
            ))}
          </div>
        </div>

        <div className="chip-row pt-2" role="group" aria-label={t('Filtrar donaciones')}>
          {DONATION_CATEGORIES.map((option) => (
            <button
              key={option.id}
              type="button"
              className="chip"
              aria-pressed={category === option.id}
              onClick={() => setCategory(category === option.id ? null : option.id)}
            >
              {category === option.id && <Check className="w-4 h-4" aria-hidden="true" />}
              {t(option.label)}
            </button>
          ))}
        </div>

        {donations.length === 0 ? (
          isLoadingItems ? (
            <LoadingRow text={t('Buscando donaciones...')} />
          ) : (
            <EmptyState
              icon={Gift}
              title={t('Todavía no hay donaciones aquí')}
              line={side === 'favor_offer' ? t('Toca "Donar algo" para regalar lo que ya no usas.') : t('Toca "Pedir una donación" si tu familia u organización necesita algo.')}
            />
          )
        ) : (
          <ul className="list grid-wide pt-2">
            {donations.map((item) => (
              <li key={item.id}><PostRow item={item} showRecommendations={false} /></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
