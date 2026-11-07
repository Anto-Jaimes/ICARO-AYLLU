import { useEffect, useState } from 'react';
import { DayForecast, fetchForecast } from '../services/hazardService';

/** null while loading, [] when unavailable. Skips the request without a point. */
export function useForecast(lat: number | undefined, lng: number | undefined): DayForecast[] | null {
  const [days, setDays] = useState<DayForecast[] | null>(null);

  useEffect(() => {
    if (lat === undefined || lng === undefined) return;

    let isCurrent = true;
    setDays(null);
    fetchForecast(lat, lng)
      .then((forecast) => {
        if (isCurrent) setDays(forecast);
      })
      .catch((err) => {
        console.warn('Pronóstico no disponible:', err);
        if (isCurrent) setDays([]);
      });

    return () => {
      isCurrent = false;
    };
  }, [lat, lng]);

  return days;
}
