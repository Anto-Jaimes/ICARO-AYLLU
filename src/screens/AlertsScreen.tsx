import React, { useEffect, useRef, useState } from 'react';
import { CircleHelp, ShieldAlert } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { PERU_DEPARTMENTS } from '../data/departments';
import { ForecastStrip } from '../components/ForecastStrip';
import { LevelTag } from '../components/LevelTag';
import { TopBar } from '../components/TopBar';
import { useBackHandler } from '../hooks/useBackHandler';
import { useForecast } from '../hooks/useForecast';
import {
  HazardFeed,
  HazardZone,
  isSenamhiFresh,
  loadHazardFeed,
  NoticeLevel
} from '../services/hazardService';
import { formatDayRange, formatRelativeTime } from '../utils/time';
import { useT } from '../i18n/LanguageContext';

const LEVEL_NAMES: Record<number, NoticeLevel> = { 2: 'amarillo', 3: 'naranja', 4: 'rojo' };
const ZONE_TITLES: Record<HazardZone['kind'], string> = {
  huaico: 'Riesgo de huaico',
  lluvia_intensa: 'Lluvia intensa'
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="pt-6">
    <h2 className="px-4 pb-2 text-section font-bold">{title}</h2>
    {children}
  </section>
);

export const AlertsScreen: React.FC = () => {
  const { setIsAlertsOpen, hasLocation, userLocation } = useApp();
  const { feed: ownFeed, savedAt: ownSavedAt } = useHazards();
  const t = useT();
  // null follows the neighbour; an id is a department they chose to look at.
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [otherFeed, setOtherFeed] = useState<HazardFeed | null>(null);
  const latestLoad = useRef(0);

  const close = () => setIsAlertsOpen(false);
  useBackHandler(true, close);

  useEffect(() => {
    if (!departmentId) {
      setOtherFeed(null);
      return;
    }
    const loadId = ++latestLoad.current;
    setOtherFeed(null);
    loadHazardFeed(null, null, departmentId).then((result) => {
      if (loadId === latestLoad.current) setOtherFeed(result?.feed ?? null);
    });
  }, [departmentId]);

  const feed = departmentId ? otherFeed : ownFeed;
  const forecastLat = departmentId || !hasLocation ? feed?.department?.lat : userLocation.lat;
  const forecastLng = departmentId || !hasLocation ? feed?.department?.lng : userLocation.lng;

  const forecast = useForecast(forecastLat, forecastLng);

  const departmentName = feed?.department?.name ?? t('el Perú');
  const isFresh = feed ? isSenamhiFresh(feed) : false;
  const summary = feed?.huaico_summary;

  return (
    <div className="app-nav-offset">
      <TopBar title="Alertas" onBack={close} />

      <div className="page">
      <div className="px-4 pt-3 lg:max-w-sm">
        <label htmlFor="alerts-department" className="block pb-1 text-secondary font-bold">{t('Departamento')}</label>
        <select
          id="alerts-department"
          value={departmentId ?? ''}
          onChange={(event) => setDepartmentId(event.target.value || null)}
          className="field"
        >
          <option value="">{hasLocation ? t('Mi ubicación') : 'Lima'}</option>
          {PERU_DEPARTMENTS.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
      </div>

      {!departmentId && ownSavedAt && (
        <p role="status" className="mx-4 mt-3 p-3 rounded-lg bg-offline text-white text-secondary">
          {t('Sin internet. Datos guardados {time}.', { time: formatRelativeTime(ownSavedAt).toLowerCase() })}
        </p>
      )}

      {!feed ? (
        <p className="px-4 pt-6 text-secondary text-ink-2">
          {departmentId ? t('Consultando alertas...') : t('Conéctate a internet para ver las alertas.')}
        </p>
      ) : (
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {feed.zones_here.length > 0 && (
            <Section title={t('Qué hacer')}>
              <ul className="list-plain">
                {feed.zones_here.map((zone) => (
                  <li key={zone.kind} className="px-4 py-3">
                    <p className="flex flex-wrap items-center gap-2 text-row font-bold">
                      {t(ZONE_TITLES[zone.kind])}
                      <LevelTag level={LEVEL_NAMES[zone.level]} />
                    </p>
                    {zone.recommendation && <p className="mt-2">{zone.recommendation}</p>}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t('Huaicos y lluvia en {place}', { place: departmentName })}>
            {!isFresh ? (
              <div className="flex gap-3 px-4">
                <CircleHelp className="w-6 h-6 shrink-0" aria-hidden="true" />
                <p>{t('Sin datos actualizados de SENAMHI. No podemos decirte si hay riesgo.')}</p>
              </div>
            ) : (
              <div className="px-4 space-y-3">
                {summary ? (
                  <div>
                    <p className="flex flex-wrap items-center gap-2 font-bold">
                      {summary.districts === 1
                        ? t('1 distrito con riesgo de huaico')
                        : t('{count} distritos con riesgo de huaico', { count: summary.districts })}
                      <LevelTag level={LEVEL_NAMES[summary.max_level]} />
                    </p>
                    {summary.top_districts?.length > 0 && (
                      <p className="mt-1 text-secondary text-ink-2">{t('Entre ellos: {districts}.', { districts: summary.top_districts.join(', ') })}</p>
                    )}
                  </div>
                ) : (
                  <p>{t('Sin zonas de huaico hoy.')}</p>
                )}
                {feed.rain_level !== null ? (
                  <p className="flex flex-wrap items-center gap-2 font-bold">
                    {t('Lluvia intensa en 24 horas')}
                    <LevelTag level={LEVEL_NAMES[feed.rain_level]} />
                  </p>
                ) : (
                  <p>{t('Sin lluvia intensa en 24 horas.')}</p>
                )}
              </div>
            )}
          </Section>

          {feed.notices.length > 0 && (
            <Section title={t('Avisos de SENAMHI')}>
              <ul className="list-plain">
                {feed.notices.map((notice) => (
                  <li key={notice.id}>
                    <a href={notice.url} target="_blank" rel="noreferrer" className="row items-start">
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-2">
                          <LevelTag level={notice.level} />
                          <span className="text-secondary text-ink-2">{formatDayRange(notice.starts_at, notice.ends_at)}</span>
                        </span>
                        <span className="block mt-1 text-row font-semibold first-letter:uppercase lowercase">{notice.title}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title={t('Sismos en {place}', { place: departmentName })}>
            {feed.quakes.length === 0 ? (
              <p className="px-4 text-secondary text-ink-2">{t('Sin sismos registrados aquí este año.')}</p>
            ) : (
              <ul className="list-plain">
                {feed.quakes.slice(0, 5).map((quake) => (
                  <li key={quake.id} className="px-4 py-3">
                    <p className="text-row font-semibold">{t('Magnitud {magnitude}', { magnitude: quake.magnitude })}</p>
                    <p className="text-secondary">{quake.detail}</p>
                    <p className="text-meta text-ink-2">{formatRelativeTime(quake.occurred_at)}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="flex gap-2 px-4 pt-2 text-meta text-ink-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              {t('Los sismos no se pueden predecir. Aquí ves los registrados por el IGP.')}
            </p>
          </Section>

          <Section title={t('Pronóstico')}>
            <ForecastStrip days={forecast} />
          </Section>

          <p className="px-4 pt-6 text-meta text-ink-2 lg:col-span-2">
            {t('Fuentes oficiales: IGP y SENAMHI. Pronóstico: Open-Meteo.')}
          </p>
        </div>
      )}
      </div>
    </div>
  );
};
