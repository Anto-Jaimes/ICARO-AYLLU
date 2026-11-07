import React, { useMemo, useState } from 'react';
import { Activity, ChevronRight, Search, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { SERVICE_CATEGORIES } from '../data/categories';
import { EmptyState, LoadingRow } from '../components/EmptyState';
import { ForecastStrip } from '../components/ForecastStrip';
import { PostRow } from '../components/PostRow';
import { SafetyBlock } from '../components/SafetyBlock';
import { useForecast } from '../hooks/useForecast';
import { useIsDesktop } from '../hooks/useMediaQuery';
import { useReports } from '../hooks/useReports';
import { mediaUrl, REPORT_KINDS, reportTitle } from '../services/reportsService';
import { formatRelativeTime } from '../utils/time';

const NEARBY_ROWS = 4;
const NEARBY_ROWS_DESKTOP = 8;
const NEWS_ROWS = 1; // on a phone the directory comes first: news must not push it away
const NEWS_ROWS_DESKTOP = 4;

const NewsPreview: React.FC<{ rows: number }> = ({ rows }) => {
  const { setIsNewsOpen } = useApp();
  const { feed } = useHazards();
  const filter = useMemo(() => ({ department: feed?.department?.name ?? null }), [feed?.department?.name]);
  const { reports } = useReports(filter, rows);

  return (
    <section aria-labelledby="news-title" className="pt-4">
      <div className="flex items-center justify-between gap-2 px-4">
        <h2 id="news-title" className="text-section font-bold">Noticias de tu zona</h2>
        <button
          type="button"
          className="shrink-0 min-h-12 text-secondary font-bold text-anil underline underline-offset-4"
          onClick={() => setIsNewsOpen(true)}
        >
          Ver todas
        </button>
      </div>

      {reports.length === 0 ? (
        <p className="px-4 text-secondary text-ink-2">Todavía no hay noticias aquí.</p>
      ) : (
        <ul className="list-plain">
          {reports.map((report) => {
            const kind = REPORT_KINDS.find((option) => option.id === report.kind) ?? REPORT_KINDS[5];
            const Icon = kind.icon;
            return (
              <li key={report.id}>
                <button type="button" className="row" onClick={() => setIsNewsOpen(true)}>
                  {report.media_path && report.media_type === 'image' ? (
                    <img src={mediaUrl(report.media_path)} alt="" className="w-11 h-11 shrink-0 rounded-lg object-cover bg-sunken" />
                  ) : (
                    <span className="grid place-items-center shrink-0 w-11 h-11 rounded-lg bg-sunken text-rojo">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </span>
                  )}
                  <span className="flex-1 min-w-0">
                    <span className="block text-row font-semibold truncate">{reportTitle(report.kind)} en {report.district}</span>
                    <span className="block text-secondary text-ink-2 truncate">{formatRelativeTime(report.created_at)}: {report.description}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-ink-2" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

/** On a wide screen the space beside the directory shows what the Alertas screen sums up. */
const DesktopSidebar: React.FC = () => {
  const { hasLocation, userLocation, setIsAlertsOpen } = useApp();
  const { feed } = useHazards();
  const days = useForecast(
    hasLocation ? userLocation.lat : feed?.department?.lat,
    hasLocation ? userLocation.lng : feed?.department?.lng
  );
  const quake = feed?.quakes[0] ?? feed?.latest_quake_peru;

  return (
    <aside className="min-w-0">
      <NewsPreview rows={NEWS_ROWS_DESKTOP} />

      <section aria-labelledby="forecast-title" className="pt-6">
        <h2 id="forecast-title" className="px-4 pb-2 text-section font-bold">Pronóstico</h2>
        <ForecastStrip days={days} />
      </section>

      {quake && (
        <section aria-labelledby="quake-title" className="pt-6">
          <h2 id="quake-title" className="px-4 pb-1 text-section font-bold">Último sismo</h2>
          <button type="button" className="row" onClick={() => setIsAlertsOpen(true)}>
            <span className="grid place-items-center shrink-0 w-11 h-11 rounded-lg bg-sunken text-anil">
              <Activity className="w-6 h-6" aria-hidden="true" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-row font-semibold">Magnitud {quake.magnitude}</span>
              <span className="block text-secondary text-ink-2">{quake.detail}</span>
              <span className="block text-meta text-ink-2">{formatRelativeTime(quake.occurred_at)}</span>
            </span>
          </button>
        </section>
      )}
    </aside>
  );
};

export const HomeScreen: React.FC = () => {
  const { items, hasLocation, openServices, isLoadingItems } = useApp();
  const isDesktop = useIsDesktop();
  const [query, setQuery] = useState('');
  const rows = isDesktop ? NEARBY_ROWS_DESKTOP : NEARBY_ROWS;

  const nearby = useMemo(() => {
    const services = items.filter((item) => item.type === 'service');
    // Without a position, the best recommended beat an order that would mean nothing.
    const sorted = [...services].sort((a, b) =>
      hasLocation ? (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0) : b.vistosBuenos - a.vistosBuenos
    );
    return sorted.slice(0, rows);
  }, [items, hasLocation, rows]);

  return (
    <div className="app-nav-offset">
      <SafetyBlock />

      <div className="page lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="min-w-0">
          <form
            role="search"
            className="px-4 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              openServices({ query: query.trim() });
            }}
          >
            <label htmlFor="home-search" className="sr-only">Buscar un servicio</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-2" aria-hidden="true" />
              <input
                id="home-search"
                type="search"
                enterKeyHint="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="¿Qué necesitas?"
                className="field pl-12"
              />
            </div>
          </form>

          <div className="chip-row pt-2" role="group" aria-label="Buscar por tipo de servicio">
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                className="chip"
                onClick={() => openServices({ category: category.id })}
              >
                {category.label}
              </button>
            ))}
          </div>

          {!isDesktop && <NewsPreview rows={NEWS_ROWS} />}

          <h2 className="px-4 pt-6 pb-1 text-section font-bold">{hasLocation ? 'Cerca de ti' : 'Los más recomendados'}</h2>

          {nearby.length === 0 ? (
            isLoadingItems ? (
              <LoadingRow text="Buscando servicios..." />
            ) : (
              <EmptyState icon={Store} title="Todavía no hay servicios cerca" line="Toca Publicar para ofrecer el tuyo." />
            )
          ) : (
            <>
              <ul className="list grid-wide">
                {nearby.map((item) => (
                  <li key={item.id}><PostRow item={item} /></li>
                ))}
              </ul>
              <div className="px-4 pt-2 lg:max-w-xs">
                <button type="button" className="btn btn-secondary" onClick={() => openServices()}>
                  Ver todos los servicios
                </button>
              </div>
            </>
          )}
        </div>

        {isDesktop && <DesktopSidebar />}
      </div>
    </div>
  );
};
