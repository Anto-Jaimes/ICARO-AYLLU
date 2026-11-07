import React from 'react';
import { DayForecast } from '../services/hazardService';

const DAY_NAMES = ['Hoy', 'Mañana', 'Pasado'];

export const ForecastStrip: React.FC<{ days: DayForecast[] | null }> = ({ days }) => {
  if (days === null) return <p className="px-4 text-secondary text-ink-2">Consultando el pronóstico...</p>;
  if (days.length === 0) return <p className="px-4 text-secondary text-ink-2">Pronóstico no disponible.</p>;

  return (
    <ul className="grid grid-cols-3 divide-x divide-line">
      {days.map((day, index) => (
        <li key={day.date} className="px-3 text-center">
          <p className="text-secondary font-bold">{DAY_NAMES[index]}</p>
          <p className="text-section font-bold">{day.tempMax}°</p>
          <p className="text-meta text-ink-2">{day.condition}</p>
          <p className="text-meta text-ink-2">Lluvia {day.rainProbability ?? 0}%</p>
        </li>
      ))}
    </ul>
  );
};
