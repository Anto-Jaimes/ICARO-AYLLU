import React from 'react';
import { Activity, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { formatRelativeTime } from '../utils/time';
import { useT } from '../i18n/LanguageContext';

/** Colour by strength; white text stays readable on every one. */
function quakeSky(magnitude: number): { background: string; words: string } {
  if (magnitude >= 6) return { background: 'linear-gradient(160deg, #7f1d1d 0%, #b91c1c 100%)', words: 'Fuerte' };
  if (magnitude >= 4.5) return { background: 'linear-gradient(160deg, #7c2d12 0%, #c2410c 100%)', words: 'Moderado' };
  return { background: 'linear-gradient(160deg, #1e293b 0%, #3730a3 100%)', words: 'Leve' };
}

/** The latest earthquake from the IGP, in large: how strong, where and how long ago. */
export const QuakeCard: React.FC = () => {
  const { setIsAlertsOpen } = useApp();
  const t = useT();
  const { feed } = useHazards();
  const quake = feed?.quakes[0] ?? feed?.latest_quake_peru;
  if (!quake) return null;
  const { background, words } = quakeSky(quake.magnitude);

  return (
    <button
      type="button"
      onClick={() => setIsAlertsOpen(true)}
      className="mx-4 block w-[calc(100%-2rem)] p-4 rounded-2xl text-left text-white shadow-sm"
      style={{ background }}
      aria-label={t('Último sismo: magnitud {magnitude}, {place}, {time}. Ver alertas', {
        magnitude: quake.magnitude,
        place: quake.detail,
        time: formatRelativeTime(quake.occurred_at).toLowerCase()
      })}
    >
      <span className="flex items-center gap-2 text-secondary font-semibold">
        <Activity className="w-5 h-5" aria-hidden="true" />
        {t('Último sismo')}
        <ChevronRight className="w-5 h-5 ml-auto" aria-hidden="true" />
      </span>
      <span className="flex items-end gap-3 pt-1">
        <span className="text-[56px] leading-none font-light">{quake.magnitude.toFixed(1)}</span>
        <span className="pb-1">
          <span className="block text-row font-semibold">{t(words)}</span>
          <span className="block text-secondary opacity-90">{t('Magnitud')}</span>
        </span>
      </span>
      <span className="block pt-2 text-secondary">{quake.detail}</span>
      <span className="block text-meta opacity-90">
        {quake.depth_km
          ? t('{time}, a {depth} km de profundidad. Fuente: IGP.', { time: formatRelativeTime(quake.occurred_at), depth: quake.depth_km })
          : t('{time}. Fuente: IGP.', { time: formatRelativeTime(quake.occurred_at) })}
      </span>
    </button>
  );
};
