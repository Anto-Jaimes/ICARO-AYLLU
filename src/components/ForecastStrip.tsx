import React from 'react';
import { DayForecast } from '../services/hazardService';
import { useT } from '../i18n/LanguageContext';

const DAY_NAMES = ['Hoy', 'Mañana', 'Pasado'];

export const ForecastStrip: React.FC<{ days: DayForecast[] | null }> = ({ days }) => {
  const t = useT();
  if (days === null) return <p className="px-4 text-secondary text-ink-2">{t('Consultando el pronóstico...')}</p>;
  if (days.length === 0) return <p className="px-4 text-secondary text-ink-2">{t('Pronóstico no disponible.')}</p>;

  return (
    <ul className="grid grid-cols-3 divide-x divide-line">
      {days.map((day, index) => (
        <li key={day.date} className="px-3 text-center">
          <p className="text-secondary font-bold">{t(DAY_NAMES[index])}</p>
          <p className="text-section font-bold">{day.tempMax}°</p>
          {/* The condition is kept in Spanish with the forecast and shown in the chosen language. */}
          <p className="text-meta text-ink-2">{t(day.condition)}</p>
          <p className="text-meta text-ink-2">{t('Lluvia {percent}%', { percent: day.rainProbability ?? 0 })}</p>
        </li>
      ))}
    </ul>
  );
};
