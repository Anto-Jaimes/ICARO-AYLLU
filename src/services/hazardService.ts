/**
 * Official hazard data for Peru, as stored by the ingest (IGP and SENAMHI), plus a
 * short forecast for the exact point. Nothing here ever invents a calm or a hazard:
 * failures reach the screen as "no data".
 */

import { supabase } from '../lib/supabase';

const CACHE_PREFIX = 'icaro_ayllu_hazard_feed_v1:';
// SENAMHI publishes daily and the relay refreshes every 30 minutes.
const SENAMHI_FRESH_HOURS = 6;

export type NoticeLevel = 'amarillo' | 'naranja' | 'rojo';

export interface HazardZone {
  kind: 'huaico' | 'lluvia_intensa';
  level: number;
  description: string | null;
  recommendation: string | null;
  province: string | null;
  district: string | null;
}

export interface HazardNotice {
  id: string;
  title: string;
  detail: string | null;
  level: NoticeLevel;
  starts_at: string;
  ends_at: string;
  url: string;
}

export interface Quake {
  id: string;
  detail: string;
  magnitude: number;
  depth_km: number;
  occurred_at: string;
  url: string;
}

export interface HazardFeed {
  department: { id: string; name: string; lat: number; lng: number } | null;
  is_here: boolean;
  zones_here: HazardZone[];
  huaico_summary: { max_level: number; districts: number; top_districts: string[] } | null;
  rain_level: number | null;
  notices: HazardNotice[];
  quakes: Quake[];
  latest_quake_peru: Quake | null;
  updated_at: { igp?: string; senamhi?: string } | null;
}

export interface LoadedFeed {
  feed: HazardFeed;
  /** Set when this is a saved copy because the server could not be reached. */
  savedAt: string | null;
}

export interface DayForecast {
  date: string;
  condition: string;
  rainProbability: number | null;
  rainMm: number;
  tempMax: number;
  tempMin: number;
}

function readCache(key: string): LoadedFeed | null {
  try {
    const cached = JSON.parse(localStorage.getItem(key) ?? 'null');
    return cached?.feed ? { feed: cached.feed, savedAt: cached.savedAt } : null;
  } catch {
    return null;
  }
}

function writeCache(key: string, feed: HazardFeed): void {
  try {
    localStorage.setItem(key, JSON.stringify({ feed, savedAt: new Date().toISOString() }));
  } catch {
    // Storage full or blocked: the live data on screen is unaffected.
  }
}

/** Live data, or the last saved copy for this view. Null only if there is neither. */
export async function loadHazardFeed(
  lat: number,
  lng: number,
  departmentId: string | null
): Promise<LoadedFeed | null> {
  const cacheKey = CACHE_PREFIX + (departmentId ?? 'here');

  try {
    const { data, error } = await supabase.rpc('hazard_feed', {
      p_lat: lat,
      p_lng: lng,
      p_department_id: departmentId
    });
    if (error) throw error;

    writeCache(cacheKey, data);
    return { feed: data, savedAt: null };
  } catch (err) {
    console.warn('No se pudieron actualizar las alertas:', err);
    return readCache(cacheKey);
  }
}

/** False means we cannot claim anything about huaicos or rain, not that there is no risk. */
export function isSenamhiFresh(feed: HazardFeed): boolean {
  const updatedAt = feed.updated_at?.senamhi;
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < SENAMHI_FRESH_HOURS * 3_600_000;
}

function describeWeather(code: number): string {
  if (code === 0) return 'Despejado';
  if (code <= 3) return 'Parcialmente nublado';
  if (code <= 48) return 'Neblina';
  if (code <= 57) return 'Llovizna';
  if (code <= 67) return 'Lluvia';
  if (code <= 77) return 'Nieve';
  if (code <= 82) return 'Chubascos';
  return 'Tormenta';
}

export async function fetchForecast(lat: number, lng: number): Promise<DayForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max' +
    '&forecast_days=3&timezone=America%2FLima';

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Open-Meteo respondió ${response.status}`);

  const { daily } = await response.json();
  if (!Array.isArray(daily?.time)) throw new Error('Open-Meteo: respuesta sin pronóstico');

  return daily.time.map((date: string, day: number) => ({
    date,
    condition: describeWeather(daily.weather_code[day]),
    rainProbability: daily.precipitation_probability_max[day],
    rainMm: daily.precipitation_sum[day],
    tempMax: Math.round(daily.temperature_2m_max[day]),
    tempMin: Math.round(daily.temperature_2m_min[day])
  }));
}

/** Calls onChange when a new quake or notice arrives. Returns the unsubscribe function. */
export function subscribeToHazardEvents(onChange: () => void): () => void {
  const channel = supabase
    .channel(`hazard-feed-${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'hazard_events' }, onChange)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
