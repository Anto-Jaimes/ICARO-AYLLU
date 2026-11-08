import React, { useMemo, useState } from 'react';
import { Megaphone, Search, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { SERVICE_CATEGORIES } from '../data/categories';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { NewsCard } from '../components/NewsCard';
import { PostRow } from '../components/PostRow';
import { QuakeCard } from '../components/QuakeCard';
import { SafetyBlock } from '../components/SafetyBlock';
import { WeatherCard } from '../components/WeatherCard';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { useReports } from '../hooks/useReports';
import { useT } from '../i18n/LanguageContext';
import { placeLabel } from '../services/geoService';

const NEARBY_ROWS = 4;
const NEARBY_ROWS_DESKTOP = 6;
const NEWS_CARDS = 3;
const NEWS_CARDS_DESKTOP = 6;

/** The news of the zone come first: they are what a neighbour most needs to know today. */
const ZoneNews: React.FC<{ count: number }> = ({ count }) => {
  const { setIsNewsOpen, openReport } = useApp();
  const t = useT();
  const { feed } = useHazards();
  const filter = useMemo(() => ({ department: feed?.department?.name ?? null }), [feed?.department?.name]);
  const { reports } = useReports(filter, count);

  return (
    <section aria-labelledby="news-title" className="pt-4">
      <div className="flex items-center justify-between gap-2 px-4 pb-2">
        <h2 id="news-title" className="text-section font-bold">{t('Noticias de tu zona')}</h2>
        <button
          type="button"
          className="shrink-0 min-h-12 text-secondary font-bold text-anil underline underline-offset-4"
          onClick={() => setIsNewsOpen(true)}
        >
          {t('Ver todas')}
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="px-4">
          <p className="text-secondary text-ink-2">{t('Todavía no hay noticias aquí.')}</p>
          <button type="button" className="btn btn-secondary mt-3 lg:max-w-xs" onClick={() => openReport('otro')}>
            <Megaphone className="w-5 h-5" aria-hidden="true" />
            {t('Avisar a tus vecinos')}
          </button>
        </div>
      ) : (
        <ul className="list-plain grid gap-4 px-4 lg:grid-cols-2">
          {reports.map((report) => (
            <li key={report.id}><NewsCard report={report} /></li>
          ))}
        </ul>
      )}
    </section>
  );
};

/** Weather and the latest earthquake, as two cards. */
const TodayCards: React.FC = () => {
  const { hasLocation, userLocation } = useApp();
  const { feed } = useHazards();
  const t = useT();
  const lat = hasLocation ? userLocation.lat : feed?.department?.lat;
  const lng = hasLocation ? userLocation.lng : feed?.department?.lng;
  // "Avenida Petit Thouars #3050, San Isidro" reads as "San Isidro".
  const place = hasLocation ? placeLabel(userLocation.name.split(',').pop()?.trim() || userLocation.name) : feed?.department?.name ?? t('tu zona');

  return (
    <div className="space-y-3 pt-6">
      <WeatherCard lat={lat} lng={lng} place={place} />
      <QuakeCard />
    </div>
  );
};

/** Services nearby: the directory, with its search. */
const NearbyServices: React.FC<{ rows: number }> = ({ rows }) => {
  const { items, hasLocation, openServices, isLoadingItems } = useApp();
  const t = useT();
  const [query, setQuery] = useState('');

  const nearby = useMemo(() => {
    const services = items.filter((item) => item.type === 'service');
    // Without a position, the best recommended beat an order that would mean nothing.
    const sorted = [...services].sort((a, b) =>
      hasLocation ? (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) : b.vistosBuenos - a.vistosBuenos
    );
    return sorted.slice(0, rows);
  }, [items, hasLocation, rows]);

  return (
    <section aria-labelledby="nearby-title" className="pt-6">
      <h2 id="nearby-title" className="px-4 pb-1 text-section font-bold">{t(hasLocation ? 'Cerca de ti' : 'Los más recomendados')}</h2>
      <form
        role="search"
        className="px-4 pt-1"
        onSubmit={(event) => {
          event.preventDefault();
          openServices({ query: query.trim() });
        }}
      >
        <label htmlFor="home-search" className="sr-only">{t('Buscar un servicio')}</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-2" aria-hidden="true" />
          <input
            id="home-search"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('¿Qué necesitas?')}
            className="field pl-12"
          />
        </div>
      </form>

      <div className="chip-row pt-2" role="group" aria-label={t('Buscar por tipo de servicio')}>
        {SERVICE_CATEGORIES.map((category) => (
          <button key={category.id} type="button" className="chip" onClick={() => openServices({ category: category.id })}>
            {t(category.label)}
          </button>
        ))}
      </div>

      {nearby.length === 0 ? (
        isLoadingItems ? (
          <LoadingRow text={t('Buscando servicios...')} />
        ) : (
          <EmptyState icon={Store} title={t('Todavía no hay servicios cerca')} line={t('Toca Publicar para ofrecer el tuyo.')} />
        )
      ) : (
        <>
          <ul className="list">
            {nearby.map((item) => (
              <li key={item.id}><PostRow item={item} /></li>
            ))}
          </ul>
          <div className="px-4 pt-2">
            <button type="button" className="btn btn-secondary" onClick={() => openServices()}>
              {t('Ver todos los servicios')}
            </button>
          </div>
        </>
      )}
    </section>
  );
};

export const HomeScreen: React.FC = () => {
  const isDesktop = useIsDesktop();

  return (
    <div className="app-nav-offset">
      <SafetyBlock />

      <div className="page lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="min-w-0">
          <ZoneNews count={isDesktop ? NEWS_CARDS_DESKTOP : NEWS_CARDS} />
          {!isDesktop && <TodayCards />}
          {!isDesktop && <NearbyServices rows={NEARBY_ROWS} />}
        </div>

        {isDesktop && (
          <aside className="min-w-0">
            <TodayCards />
            <NearbyServices rows={NEARBY_ROWS_DESKTOP} />
          </aside>
        )}
      </div>
    </div>
  );
};
