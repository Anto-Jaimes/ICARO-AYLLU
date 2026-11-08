import React from 'react';
import { ChevronRight, Radar, X } from 'lucide-react';
import { formatMeters } from '../services/geoService';
import { useT } from '../i18n/LanguageContext';

export const RADAR_RADII = [500, 1000, 3000];

/** Round radii read better as 1 km than 1,0 km. */
const radiusLabel = (meters: number) => (meters < 1000 ? `${meters} m` : `${meters / 1000} km`);

export interface RadarItem {
  id: string;
  title: string;
  layerLabel: string;
  color: string;
  distance: number;
}

interface RadarPanelProps {
  radius: number;
  counts: { label: string; count: number }[];
  nearest: RadarItem[];
  onRadius: (meters: number) => void;
  onOpen: (id: string) => void;
  onClose: () => void;
}

/** What the radar found around the neighbour: how many of each, and the closest ones first. */
export const RadarPanel: React.FC<RadarPanelProps> = ({ radius, counts, nearest, onRadius, onOpen, onClose }) => {
  const t = useT();
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  const summary = counts.map(({ label, count }) => `${count} ${t(label).toLowerCase()}`).join(', ');

  return (
    <section aria-labelledby="radar-title" className="max-h-[45dvh] overflow-y-auto">
      <div className="flex items-start gap-3 px-4 pt-3">
        <Radar className="w-6 h-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h2 id="radar-title" className="text-row font-bold">{t('Radar: cerca de ti')}</h2>
          <p role="status" className="text-secondary text-ink-secondary">
            {total === 0
              ? t('Nada publicado a menos de {distance}. Prueba un radio más grande.', { distance: radiusLabel(radius) })
              : t('A menos de {distance}: {summary}.', { distance: radiusLabel(radius), summary })}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label={t('Apagar el radar')} className="icon-btn -mr-2 -mt-1">
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
      </div>

      <div role="group" aria-label={t('Distancia del radar')} className="flex gap-2 px-4 pt-3">
        {RADAR_RADII.map((meters) => (
          <button
            key={meters}
            type="button"
            aria-pressed={radius === meters}
            onClick={() => onRadius(meters)}
            className={`flex-1 min-h-12 rounded-lg border-2 text-secondary font-bold ${radius === meters ? 'bg-primary border-primary text-white' : 'bg-surface border-border text-ink'}`}
          >
            {radiusLabel(meters)}
          </button>
        ))}
      </div>

      {nearest.length > 0 && (
        <ul className="list-plain pt-2">
          {nearest.map((item) => (
            <li key={item.id}>
              <button type="button" className="row" onClick={() => onOpen(item.id)}>
                <span aria-hidden="true" className="w-4 h-4 shrink-0 rounded-full" style={{ background: item.color }} />
                <span className="flex-1 min-w-0">
                  <span className="block text-row font-semibold truncate">{item.title}</span>
                  <span className="block text-secondary text-ink-secondary">{t(item.layerLabel)}, {t('a {distance}', { distance: formatMeters(item.distance) })}</span>
                </span>
                <ChevronRight className="w-6 h-6 shrink-0 text-ink-secondary" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
