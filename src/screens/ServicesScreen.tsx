import React, { useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, Search, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SERVICE_CATEGORIES } from '../data/categories';
import { BottomSheet } from '../components/BottomSheet';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { PostRow } from '../components/PostRow';
import { TopBar } from '../components/TopBar';
import { UNLIMITED_RADIUS_M } from '../utils/geo';

const DISTANCES = [
  { meters: 500, label: 'A 500 m', detail: 'Caminando, muy cerca' },
  { meters: 1000, label: 'A 1 km', detail: 'Tu barrio' },
  { meters: 3000, label: 'A 3 km', detail: 'Los barrios de al lado' },
  { meters: UNLIMITED_RADIUS_M, label: 'Toda la zona', detail: 'Sin límite de distancia' }
];

export const ServicesScreen: React.FC = () => {
  const { items, hasLocation, servicesFilter, isLoadingItems } = useApp();
  const [category, setCategory] = useState<string | null>(servicesFilter.category ?? null);
  const [query, setQuery] = useState(servicesFilter.query ?? '');
  const [radius, setRadius] = useState(3000);
  const [isDistanceOpen, setIsDistanceOpen] = useState(false);

  useEffect(() => {
    setCategory(servicesFilter.category ?? null);
    setQuery(servicesFilter.query ?? '');
  }, [servicesFilter]);

  const services = useMemo(() => {
    const search = query.trim().toLowerCase();
    return items
      .filter((item) => item.type === 'service')
      .filter((item) => !category || item.category === category)
      .filter((item) => !hasLocation || (item.distanceMeters ?? 0) <= radius)
      .filter((item) => !search || `${item.title} ${item.description} ${item.authorName}`.toLowerCase().includes(search))
      .sort((a, b) => b.vistosBuenos - a.vistosBuenos || (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }, [items, category, query, radius, hasLocation]);

  const currentDistance = DISTANCES.find((distance) => distance.meters === radius) ?? DISTANCES[2];
  const canWiden = hasLocation && radius < UNLIMITED_RADIUS_M;

  return (
    <div className="app-nav-offset">
      <TopBar title="Servicios" />

      <div className="px-4 pt-3 relative">
        <label htmlFor="services-search" className="sr-only">Buscar un servicio</label>
        <Search className="absolute left-8 top-[30px] w-5 h-5 text-ink-2" aria-hidden="true" />
        <input
          id="services-search"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="¿Qué necesitas?"
          className="field pl-12"
        />
      </div>

      <div className="chip-row pt-2" role="group" aria-label="Filtrar servicios">
        {hasLocation && (
          <button type="button" className="chip" onClick={() => setIsDistanceOpen(true)}>
            {currentDistance.label}
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
        {SERVICE_CATEGORIES.map((option) => (
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

      {services.length === 0 ? (
        isLoadingItems ? (
          <LoadingRow text="Buscando servicios..." />
        ) : (
          <EmptyState
            icon={Store}
            title="Todavía no hay servicios cerca"
            line={canWiden ? 'Prueba buscando más lejos.' : 'Toca Publicar para ofrecer el tuyo.'}
            action={
              canWiden && (
                <button type="button" className="btn btn-primary" onClick={() => setRadius(UNLIMITED_RADIUS_M)}>
                  Ver más lejos
                </button>
              )
            }
          />
        )
      ) : (
        <ul className="list pt-2">
          {services.map((item) => (
            <li key={item.id}><PostRow item={item} /></li>
          ))}
        </ul>
      )}

      <BottomSheet open={isDistanceOpen} onClose={() => setIsDistanceOpen(false)} title="¿Qué tan lejos?">
        <ul className="list-plain pb-4">
          {DISTANCES.map((distance) => (
            <li key={distance.meters}>
              <button
                type="button"
                className="row"
                aria-pressed={radius === distance.meters}
                onClick={() => {
                  setRadius(distance.meters);
                  setIsDistanceOpen(false);
                }}
              >
                <span className="flex-1">
                  <span className="block text-row font-semibold">{distance.label}</span>
                  <span className="block text-secondary text-ink-2">{distance.detail}</span>
                </span>
                {radius === distance.meters && <Check className="w-6 h-6 text-anil" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </div>
  );
};
