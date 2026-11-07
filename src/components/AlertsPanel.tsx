import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CloudRain,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PERU_DEPARTMENTS } from '../data/departments';
import {
  DayForecast,
  fetchForecast,
  HazardFeed,
  HazardZone,
  isSenamhiFresh,
  loadHazardFeed,
  NoticeLevel,
  subscribeToHazardEvents
} from '../services/hazardService';
import { formatDayRange, formatRelativeTime } from '../utils/time';

// Day to day the panel stays short: the neighbourhood directory is the main screen.
const COMPACT_ITEMS = 1;

const LEVEL_NAMES: Record<number, NoticeLevel> = { 2: 'amarillo', 3: 'naranja', 4: 'rojo' };

// Each level always shows its name too: color alone must not carry the meaning.
const LEVEL_STYLES: Record<NoticeLevel, { chip: string; banner: string; label: string }> = {
  amarillo: {
    label: 'Amarillo',
    chip: 'bg-yellow-200 text-yellow-950 border-yellow-400',
    banner: 'bg-yellow-50 border-yellow-400 text-yellow-950'
  },
  naranja: {
    label: 'Naranja',
    chip: 'bg-orange-200 text-orange-950 border-orange-400',
    banner: 'bg-orange-50 border-orange-400 text-orange-950'
  },
  rojo: {
    label: 'Rojo',
    chip: 'bg-red-600 text-white border-red-700',
    banner: 'bg-red-50 border-red-500 text-red-950'
  }
};

const ZONE_TITLES: Record<HazardZone['kind'], string> = {
  huaico: 'Riesgo de huaico en tu zona',
  lluvia_intensa: 'Lluvia intensa en tu zona'
};

const LevelChip: React.FC<{ level: NoticeLevel }> = ({ level }) => (
  <span className={`inline-block shrink-0 px-2 py-0.5 rounded-md border text-xs font-bold ${LEVEL_STYLES[level].chip}`}>
    {LEVEL_STYLES[level].label}
  </span>
);

function magnitudeStyle(magnitude: number): string {
  if (magnitude >= 6) return 'bg-red-600 text-white';
  if (magnitude >= 5) return 'bg-orange-200 text-orange-950';
  return 'bg-slate-200 text-slate-800';
}

const StatusBanner: React.FC<{ tone: string; icon: React.ReactNode; title: string; children?: React.ReactNode }> = ({
  tone,
  icon,
  title,
  children
}) => (
  <div className={`flex items-start gap-2.5 p-3 rounded-2xl border ${tone}`}>
    <span className="mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0 text-sm">
      <p className="font-bold">{title}</p>
      {children}
    </div>
  </div>
);

/** What SENAMHI says about huaicos and rain here, or that we cannot know right now. */
const RiskStatus: React.FC<{ feed: HazardFeed }> = ({ feed }) => {
  const departmentName = feed.department?.name ?? 'esta zona';

  // Without a fresh bulletin, an empty result would read as "safe". It only means "unknown".
  if (!isSenamhiFresh(feed)) {
    return (
      <StatusBanner
        tone="bg-slate-100 border-slate-300 text-slate-800"
        icon={<HelpCircle className="w-5 h-5" aria-hidden="true" />}
        title="Riesgo de huaico y lluvias: sin datos actualizados"
      >
        <p>
          No recibimos el último boletín de SENAMHI, así que no podemos decirte si hay riesgo.{' '}
          <a
            href="https://www.senamhi.gob.pe/?p=aviso-activacion-quebrada"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            Consultar en SENAMHI
          </a>
        </p>
      </StatusBanner>
    );
  }

  return (
    <div className="space-y-2">
      {feed.zones_here.map((zone) => {
        const level = LEVEL_NAMES[zone.level];
        return (
          <StatusBanner
            key={zone.kind}
            tone={LEVEL_STYLES[level].banner}
            icon={<ShieldAlert className="w-5 h-5" aria-hidden="true" />}
            title={ZONE_TITLES[zone.kind]}
          >
            <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <LevelChip level={level} />
              {zone.district && <span>{zone.district}, {zone.province}</span>}
            </p>
            {zone.recommendation && <p className="mt-1">{zone.recommendation}</p>}
          </StatusBanner>
        );
      })}

      {feed.is_here && feed.zones_here.length === 0 && (
        <StatusBanner
          tone="bg-emerald-50 border-emerald-300 text-emerald-950"
          icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
          title="Tu ubicación no está en una zona de huaico ni de lluvia intensa hoy"
        />
      )}

      {feed.huaico_summary ? (
        <StatusBanner
          tone={LEVEL_STYLES[LEVEL_NAMES[feed.huaico_summary.max_level]].banner}
          icon={<AlertTriangle className="w-5 h-5" aria-hidden="true" />}
          title={`Huaicos en ${departmentName}: ${feed.huaico_summary.districts} distritos en riesgo`}
        >
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5">
            <span>Nivel máximo</span>
            <LevelChip level={LEVEL_NAMES[feed.huaico_summary.max_level]} />
          </p>
          {feed.huaico_summary.top_districts?.length > 0 && (
            <p className="mt-1">Entre ellos: {feed.huaico_summary.top_districts.join(', ')}.</p>
          )}
        </StatusBanner>
      ) : (
        !feed.is_here && (
          <StatusBanner
            tone="bg-emerald-50 border-emerald-300 text-emerald-950"
            icon={<CheckCircle2 className="w-5 h-5" aria-hidden="true" />}
            title={`Sin zonas de huaico hoy en ${departmentName}`}
          />
        )
      )}

      {feed.rain_level !== null && (
        <StatusBanner
          tone={LEVEL_STYLES[LEVEL_NAMES[feed.rain_level]].banner}
          icon={<CloudRain className="w-5 h-5" aria-hidden="true" />}
          title={`Lluvia intensa en ${departmentName} en las próximas 24 horas`}
        >
          <p className="mt-0.5 flex items-center gap-1.5">
            <span>Nivel máximo</span>
            <LevelChip level={LEVEL_NAMES[feed.rain_level]} />
          </p>
        </StatusBanner>
      )}
    </div>
  );
};

const ForecastDays: React.FC<{ days: DayForecast[] | null; muted: string; surface: string }> = ({ days, muted, surface }) => {
  if (days === null) return <p className={`text-sm ${muted}`}>Consultando el pronóstico...</p>;
  if (days.length === 0) return <p className={`text-sm ${muted}`}>Pronóstico no disponible.</p>;

  const dayNames = ['Hoy', 'Mañana', 'Pasado'];
  return (
    <ul className="grid grid-cols-3 gap-2">
      {days.map((day, index) => (
        <li key={day.date} className={`p-2.5 rounded-xl border text-center ${surface}`}>
          <p className={`text-xs font-bold ${muted}`}>{dayNames[index]}</p>
          <p className="text-base font-bold mt-0.5">{day.tempMax}° / {day.tempMin}°</p>
          <p className="text-xs mt-0.5">{day.condition}</p>
          <p className={`text-xs mt-0.5 ${muted}`}>
            Lluvia {day.rainProbability ?? 0}%{day.rainMm > 0 ? ` • ${day.rainMm} mm` : ''}
          </p>
        </li>
      ))}
    </ul>
  );
};

export const AlertsPanel: React.FC = () => {
  const { userLocation, mode } = useApp();
  // null follows the neighbour's location; an id is a department they chose to look at.
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [feed, setFeed] = useState<HazardFeed | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const latestLoad = useRef(0);

  const isEmergency = mode === 'emergency';
  // In an emergency nothing hides behind a tap.
  const showEverything = isExpanded || isEmergency;
  const muted = isEmergency ? 'text-slate-300' : 'text-slate-600';
  const surface = isEmergency ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200';

  const loadFeed = useCallback(async () => {
    const loadId = ++latestLoad.current;
    setLoading(true);
    const result = await loadHazardFeed(userLocation.lat, userLocation.lng, departmentId);
    // A slower, older answer must not replace the department now on screen.
    if (loadId !== latestLoad.current) return;

    setFeed(result?.feed ?? null);
    setSavedAt(result?.savedAt ?? null);
    setLoading(false);
  }, [userLocation.lat, userLocation.lng, departmentId]);

  useEffect(() => {
    loadFeed();
    return subscribeToHazardEvents(loadFeed);
  }, [loadFeed]);

  // The forecast follows the point in view: the neighbour, or the chosen department.
  const forecastLat = departmentId ? feed?.department?.lat : userLocation.lat;
  const forecastLng = departmentId ? feed?.department?.lng : userLocation.lng;

  useEffect(() => {
    if (forecastLat === undefined || forecastLng === undefined) return;

    let isCurrent = true;
    setForecast(null);
    fetchForecast(forecastLat, forecastLng)
      .then((days) => {
        if (isCurrent) setForecast(days);
      })
      .catch((err) => {
        console.warn('Pronóstico no disponible:', err);
        if (isCurrent) setForecast([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [forecastLat, forecastLng]);

  const departmentName = feed?.department?.name;
  const notices = feed?.notices ?? [];
  const allQuakes = feed?.quakes ?? [];
  const visibleNotices = showEverything ? notices : notices.slice(0, COMPACT_ITEMS);
  const quakes = showEverything ? allQuakes : allQuakes.slice(0, COMPACT_ITEMS);
  const hasMoreToShow = notices.length > COMPACT_ITEMS || allQuakes.length > COMPACT_ITEMS;
  const latestPeruQuake = feed?.latest_quake_peru;
  const showLatestPeruQuake = latestPeruQuake && !quakes.some((quake) => quake.id === latestPeruQuake.id);

  return (
    <section
      aria-labelledby="alerts-title"
      className={`mb-5 p-4 rounded-3xl border transition-colors ${
        isEmergency ? 'bg-slate-900 border-red-500/50 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="alerts-title" className="text-lg font-bold">
            Alertas en {departmentName ?? 'tu zona'}
          </h2>
          <p className={`text-sm ${muted}`}>
            {departmentId ? 'Departamento elegido por ti' : 'Según tu ubicación'}
          </p>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label htmlFor="alerts-department" className={`block text-xs font-semibold mb-1 ${muted}`}>
              Ver departamento
            </label>
            <select
              id="alerts-department"
              value={departmentId ?? ''}
              onChange={(event) => {
                setDepartmentId(event.target.value || null);
                setIsExpanded(false);
              }}
              className="min-h-11 px-3 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold"
            >
              <option value="">Mi ubicación</option>
              {PERU_DEPARTMENTS.map((department) => (
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadFeed}
            disabled={loading}
            aria-label="Actualizar alertas"
            title="Actualizar alertas"
            className={`min-h-11 min-w-11 flex items-center justify-center rounded-xl border cursor-pointer ${surface}`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {savedAt && (
        <p className="mt-3 p-2.5 rounded-xl bg-amber-100 text-amber-950 text-sm font-semibold" role="status">
          Sin conexión. Datos guardados {formatRelativeTime(savedAt).toLowerCase()}.
        </p>
      )}

      {!feed && !loading && (
        <p className="mt-3 p-3 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold" role="status">
          No pudimos cargar las alertas. Toca actualizar cuando tengas conexión.
        </p>
      )}

      {!feed && loading && <p className={`mt-3 text-sm ${muted}`}>Consultando alertas...</p>}

      {feed && (
        <div className="mt-3 space-y-4">
          <RiskStatus feed={feed} />

          {notices.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-1.5">Avisos de SENAMHI ({notices.length})</h3>
              <ul className="space-y-2">
                {visibleNotices.map((notice) => (
                  <li key={notice.id} className={`p-3 rounded-xl border ${surface}`}>
                    <div className="flex items-start gap-2">
                      <LevelChip level={notice.level} />
                      <a href={notice.url} target="_blank" rel="noreferrer" className="text-sm font-semibold underline-offset-2 hover:underline">
                        {notice.title}
                      </a>
                    </div>
                    <p className={`text-xs mt-1 ${muted}`}>{formatDayRange(notice.starts_at, notice.ends_at)}</p>
                    {notice.detail && <p className={`text-sm mt-1 ${muted}`}>{notice.detail}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold mb-1.5 flex items-center gap-1.5">
              <Activity className="w-4 h-4" aria-hidden="true" />
              <span>Sismos en {departmentName ?? 'tu zona'}</span>
            </h3>
            {quakes.length === 0 ? (
              <p className={`text-sm ${muted}`}>Sin sismos registrados aquí este año.</p>
            ) : (
              <ul className="space-y-1.5">
                {quakes.map((quake) => (
                  <li key={quake.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${surface}`}>
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-sm font-bold ${magnitudeStyle(quake.magnitude)}`}>
                      M {quake.magnitude}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{quake.detail}</p>
                      <p className={`text-xs ${muted}`}>
                        {formatRelativeTime(quake.occurred_at)} • {quake.depth_km} km de profundidad
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {showLatestPeruQuake && (
              <p className={`text-sm mt-1.5 ${muted}`}>
                Último en el Perú: M {latestPeruQuake.magnitude}, {latestPeruQuake.detail} ({formatRelativeTime(latestPeruQuake.occurred_at).toLowerCase()}).
              </p>
            )}
            <p className={`text-xs mt-1.5 ${muted}`}>
              Los sismos no se pueden predecir: aquí ves los ya registrados por el IGP.
            </p>
            {hasMoreToShow && !isEmergency && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                className="mt-1 min-h-11 text-sm font-semibold underline cursor-pointer"
              >
                {isExpanded ? 'Ver menos' : 'Ver todas las alertas'}
              </button>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold mb-1.5">Pronóstico</h3>
            <ForecastDays days={forecast} muted={muted} surface={surface} />
          </div>

          <p className={`text-xs ${muted}`}>
            Fuentes:{' '}
            <a href="https://ultimosismo.igp.gob.pe/" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">
              IGP<ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>{' '}
            y{' '}
            <a href="https://www.senamhi.gob.pe/?p=aviso-meteorologico" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-0.5">
              SENAMHI<ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
            . Pronóstico: Open-Meteo.
            {feed.updated_at?.igp && ` Sismos actualizados ${formatRelativeTime(feed.updated_at.igp).toLowerCase()}.`}
          </p>
        </div>
      )}
    </section>
  );
};
