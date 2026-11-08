import { SKY } from '../theme/colors';
/**
 * Weather now and for the next days, from Open-Meteo (free, no key). The last answer is kept so the card
 * still shows something without internet, saying how old it is.
 */
import { CloudDrizzle, CloudFog, CloudLightning, CloudMoon, CloudRain, CloudSnow, CloudSun, Cloud, Moon, Sun, type LucideIcon } from 'lucide-react';
import { tr } from '../i18n/translate';

export interface WeatherNow {
  temp: number;
  code: number;
  isDay: boolean;
}

export interface WeatherDay {
  date: string;
  code: number;
  tempMax: number;
  tempMin: number;
  rainProbability: number | null;
}

export interface Weather {
  now: WeatherNow;
  days: WeatherDay[];
  savedAt: string;
}

const CACHE_KEY = 'ayllu_weather';

export function savedWeather(): Weather | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export async function fetchWeather(lat: number, lng: number): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lng.toFixed(3)}` +
    '&current=temperature_2m,weather_code,is_day' +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
    '&forecast_days=5&timezone=America%2FLima';
  const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);
  const { current, daily } = await response.json();
  if (!current || !Array.isArray(daily?.time)) throw new Error('Open-Meteo: respuesta incompleta');

  const weather: Weather = {
    now: { temp: Math.round(current.temperature_2m), code: current.weather_code, isDay: current.is_day === 1 },
    days: daily.time.map((date: string, day: number) => ({
      date,
      code: daily.weather_code[day],
      tempMax: Math.round(daily.temperature_2m_max[day]),
      tempMin: Math.round(daily.temperature_2m_min[day]),
      rainProbability: daily.precipitation_probability_max[day] ?? null
    })),
    savedAt: new Date().toISOString()
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(weather));
  } catch {
    // shown now, not kept for later
  }
  return weather;
}

/** WMO weather codes, in plain words of the chosen language. */
export function weatherWords(code: number): string {
  if (code === 0) return tr('Despejado');
  if (code <= 2) return tr('Parcialmente nublado');
  if (code === 3) return tr('Nublado');
  if (code <= 48) return tr('Neblina');
  if (code <= 57) return tr('Llovizna');
  if (code <= 67) return tr('Lluvia');
  if (code <= 77) return tr('Nieve');
  if (code <= 82) return tr('Chubascos');
  return tr('Tormenta');
}

export function weatherIcon(code: number, isDay = true): LucideIcon {
  if (code === 0) return isDay ? Sun : Moon;
  if (code <= 2) return isDay ? CloudSun : CloudMoon;
  if (code === 3) return Cloud;
  if (code <= 48) return CloudFog;
  if (code <= 57) return CloudDrizzle;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudRain;
  if (code <= 77 || code === 85 || code === 86) return CloudSnow;
  return CloudLightning;
}

/** The card's sky (src/theme/colors.ts): white text at 7:1 or more on every gradient. */
export function weatherSky(code: number, isDay: boolean): string {
  if (!isDay) return SKY.night;
  if (code <= 2) return SKY.clear;
  if (code <= 48) return SKY.cloudy;
  if (code <= 82) return SKY.rain;
  return SKY.storm;
}
