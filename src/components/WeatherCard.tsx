import React, { useEffect, useState } from 'react';
import { Droplets } from 'lucide-react';
import { fetchWeather, savedWeather, Weather, weatherIcon, weatherSky, weatherWords } from '../services/weatherService';
import { formatRelativeTime } from '../utils/time';

const dayName = (date: string, index: number) => {
  if (index === 0) return 'Hoy';
  const name = new Date(`${date}T12:00:00-05:00`).toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', '');
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** The weather where the neighbour is: now in large, and the next days with an icon each. */
export const WeatherCard: React.FC<{ lat?: number; lng?: number; place: string }> = ({ lat, lng, place }) => {
  const [weather, setWeather] = useState<Weather | null>(savedWeather);
  const [isSaved, setIsSaved] = useState(true);

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    let isCurrent = true;
    fetchWeather(lat, lng)
      .then((fresh) => {
        if (!isCurrent) return;
        setWeather(fresh);
        setIsSaved(false);
      })
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [lat, lng]);

  if (!weather) {
    return (
      <section aria-label="Pronóstico" className="mx-4 p-4 rounded-2xl bg-sunken">
        <p className="text-secondary text-ink-2">Consultando el pronóstico...</p>
      </section>
    );
  }

  const { now, days } = weather;
  const NowIcon = weatherIcon(now.code, now.isDay);
  const today = days[0];

  return (
    <section
      aria-labelledby="weather-title"
      className="mx-4 p-4 rounded-2xl text-white shadow-sm"
      style={{ background: weatherSky(now.code, now.isDay) }}
    >
      <h2 id="weather-title" className="text-secondary font-semibold truncate">Pronóstico en {place}</h2>
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <p className="text-[56px] leading-none font-light" aria-label={`${now.temp} grados`}>{now.temp}°</p>
          <p className="pt-1 text-row font-semibold">{weatherWords(now.code)}</p>
          {today && <p className="text-secondary opacity-90">Máx. {today.tempMax}°, mín. {today.tempMin}°</p>}
        </div>
        <NowIcon className="w-16 h-16 shrink-0 opacity-95" aria-hidden="true" />
      </div>

      <ul className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t border-white/25">
        {days.slice(0, 5).map((day, index) => {
          const DayIcon = weatherIcon(day.code);
          return (
            <li key={day.date} className="flex flex-col items-center gap-1 text-center">
              <span className="text-meta font-semibold">{dayName(day.date, index)}</span>
              <DayIcon className="w-6 h-6" aria-label={weatherWords(day.code)} />
              <span className="text-meta font-semibold">{day.tempMax}°</span>
              <span className="text-meta opacity-90">{day.tempMin}°</span>
              {(day.rainProbability ?? 0) >= 30 && (
                <span className="flex items-center text-meta" title="Probabilidad de lluvia">
                  <Droplets className="w-3.5 h-3.5" aria-hidden="true" />
                  {day.rainProbability}%
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {isSaved && <p className="pt-2 text-meta opacity-90">Guardado {formatRelativeTime(weather.savedAt).toLowerCase()}.</p>}
    </section>
  );
};
