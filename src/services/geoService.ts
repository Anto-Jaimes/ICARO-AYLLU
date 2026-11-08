/**
 * Service for place search, reverse geocoding and routing.
 * Uses OpenStreetMap Nominatim and OSRM (Open Source Routing Machine) servers.
 * Completely free, no API key required, with in-memory caching.
 */
import type { MapPoint } from './myPlaces';
import { getLang, tr } from '../i18n/translate';

/** The name reverseGeocode() gives when it finds none. Kept in Spanish as data: show it with t(). */
export const LOCATED_FALLBACK = 'Tu ubicación';

/** A place name as the neighbour should read it: the app's own "Tu ubicación" in their language, real names as they are. */
export function placeLabel(name: string): string {
  return name === LOCATED_FALLBACK ? tr(name) : name;
}

// Nominatim's usage policy allows one request per second from the whole app.
const NOMINATIM_GAP_MS = 1100;
let nextNominatimAt = 0;

function waitForNominatim(signal?: AbortSignal): Promise<void> {
  const now = Date.now();
  const startAt = Math.max(now, nextNominatimAt);
  nextNominatimAt = startAt + NOMINATIM_GAP_MS;
  if (startAt === now) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, startAt - now);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    }, { once: true });
  });
}

/** The caller's signal plus a time limit, without AbortSignal.any (missing in older Android WebViews). */
function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), ms);
  controller.signal.addEventListener('abort', () => clearTimeout(timer), { once: true });
  if (signal?.aborted) controller.abort(signal.reason);
  else signal?.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
  return controller.signal;
}

const geocodeCache = new Map<string, string>();
const walkingRouteCache = new Map<string, { durationMinutes: number; distanceMeters: number }>();

export interface WalkingEstimate {
  distanceMeters: number;
  durationMinutes: number;
  formattedText: string;
}

/**
 * Converts latitude and longitude coordinates into a human-readable street and neighborhood name.
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    await waitForNominatim();
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=es`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AYLLU-App/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim responded with status ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};
    
    // Pick the most relevant local details
    const road = address.road || address.pedestrian || address.neighbourhood || address.suburb || '';
    const houseNumber = address.house_number ? ` #${address.house_number}` : '';
    const district = address.suburb || address.city_district || address.town || address.city || '';

    const street = road ? `${road}${houseNumber}` : '';
    const formatted = [street, district].filter(Boolean).join(', ') || LOCATED_FALLBACK;
    geocodeCache.set(cacheKey, formatted);
    return formatted;
  } catch (error) {
    console.warn('Reverse geocoding fallback used:', error);
    return LOCATED_FALLBACK;
  }
}

/**
 * Calculates real pedestrian walking route distance and time between two points using OSRM Walking API.
 */
export async function calculateWalkingEstimate(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<WalkingEstimate> {
  const cacheKey = `${originLat.toFixed(4)},${originLng.toFixed(4)}->${destLat.toFixed(4)},${destLng.toFixed(4)}`;
  if (walkingRouteCache.has(cacheKey)) {
    const cached = walkingRouteCache.get(cacheKey)!;
    return {
      distanceMeters: cached.distanceMeters,
      durationMinutes: cached.durationMinutes,
      formattedText: formatWalkingText(cached.durationMinutes, cached.distanceMeters)
    };
  }

  try {
    // OSRM coordinates order: {longitude},{latitude}
    const url = `${ROUTERS.foot}/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OSRM responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const distanceMeters = Math.round(route.distance);
      const durationMinutes = Math.max(1, Math.round(route.duration / 60));

      walkingRouteCache.set(cacheKey, { distanceMeters, durationMinutes });

      return {
        distanceMeters,
        durationMinutes,
        formattedText: formatWalkingText(durationMinutes, distanceMeters)
      };
    }
  } catch (err) {
    console.warn('OSRM walking route error, using Haversine fallback estimate:', err);
  }

  // Fallback estimation assuming walking speed of 4.5 km/h (75 m/min)
  const dLat = (destLat - originLat) * 111000;
  const dLng = (destLng - originLng) * 111000 * Math.cos((originLat * Math.PI) / 180);
  const straightDistance = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  const walkingDistance = Math.round(straightDistance * 1.25); // Factor for street detours
  const minutes = Math.max(1, Math.round(walkingDistance / 75));

  return {
    distanceMeters: walkingDistance,
    durationMinutes: minutes,
    formattedText: formatWalkingText(minutes, walkingDistance)
  };
}

function formatWalkingText(minutes: number, distanceMeters: number): string {
  if (minutes <= 1) return tr('A 1 min a pie ({meters}m)', { meters: distanceMeters });
  if (distanceMeters < 1000) return tr('A {minutes} min a pie ({meters}m)', { minutes, meters: distanceMeters });
  return tr('A {minutes} min a pie ({km} km)', { minutes, km: (distanceMeters / 1000).toFixed(1) });
}

/** A place found by the search box. */
export interface PlaceResult extends MapPoint {
  id: string;
  name: string;
  address: string;
}

export const MIN_SEARCH_LENGTH = 3;
const MAX_RESULTS = 5;
const searchCache = new Map<string, PlaceResult[]>();

type NominatimAddress = Record<string, string | undefined>;

interface NominatimPlace {
  place_id?: number;
  lat?: string;
  lon?: string;
  name?: string;
  display_name?: string;
  address?: NominatimAddress;
}

const streetOf = (address: NominatimAddress) =>
  address.road ? `${address.road}${address.house_number ? ` ${address.house_number}` : ''}` : '';

// "Parque Kennedy" + "Surquillo Viejo, Miraflores, Lima": enough to tell two places apart.
function shortAddress(address: NominatimAddress, name: string): string {
  const candidates = [
    streetOf(address),
    address.neighbourhood || address.quarter,
    address.suburb || address.city_district,
    address.city || address.town || address.village || address.county,
    address.state
  ];
  const seen = new Set([name.toLowerCase()]);
  const picked: string[] = [];
  for (const part of candidates) {
    if (!part || seen.has(part.toLowerCase())) continue;
    seen.add(part.toLowerCase());
    picked.push(part);
    if (picked.length === 3) break;
  }
  return picked.join(', ');
}

function toPlaceResult(raw: NominatimPlace): PlaceResult | null {
  const lat = Number(raw.lat);
  const lng = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address = raw.address ?? {};
  const name = raw.name?.trim() || streetOf(address) || raw.display_name?.split(',')[0]?.trim() || tr('Lugar sin nombre');
  return { id: String(raw.place_id ?? `${lat},${lng}`), name, address: shortAddress(address, name), lat, lng };
}

/**
 * Up to five places in Peru that match the text, nearest area first. Throws when there is no answer,
 * so the search box can tell "nothing found" from "could not search".
 */
export async function searchPlaces(query: string, near: MapPoint | null, signal?: AbortSignal): Promise<PlaceResult[]> {
  const text = query.trim().replace(/\s+/g, ' ');
  // The language is part of the key: a place with no name is named in the language of the screen.
  const cacheKey = `${getLang()}|${text.toLowerCase()}|${near ? `${near.lat.toFixed(1)},${near.lng.toFixed(1)}` : ''}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: text,
    countrycodes: 'pe',
    'accept-language': 'es',
    limit: String(MAX_RESULTS),
    addressdetails: '1'
  });
  // Prefers the neighbour's area without hiding the rest of Peru.
  if (near) params.set('viewbox', [near.lng - 0.5, near.lat + 0.5, near.lng + 0.5, near.lat - 0.5].join(','));

  await waitForNominatim(signal);
  // A page cannot set User-Agent; the Referer the browser sends identifies the app, as the policy asks.
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: 'application/json' },
    signal: withTimeout(signal, 10_000)
  });
  if (!response.ok) throw new Error(`Nominatim responded with status ${response.status}`);

  const data: unknown = await response.json();
  const results = (Array.isArray(data) ? (data as NominatimPlace[]) : [])
    .map(toPlaceResult)
    .filter((place): place is PlaceResult => place !== null)
    .slice(0, MAX_RESULTS);
  searchCache.set(cacheKey, results);
  return results;
}

/** A street or place name for a point picked on the map, or null when there is none. */
export async function describePoint(lat: number, lng: number): Promise<string | null> {
  const name = await reverseGeocode(lat, lng);
  return name === LOCATED_FALLBACK ? null : name;
}

export type TravelMode = 'foot' | 'car';

export interface Route {
  mode: TravelMode;
  distanceMeters: number;
  minutes: number;
  /** [lng, lat] pairs, ready for a GeoJSON line. */
  line: [number, number][];
}

// The public OSRM demo server answers every profile with car routes (a 4.8 km "walk" in 6 minutes),
// so walking uses the FOSSGIS foot server, which runs the same OSRM software.
const ROUTERS: Record<TravelMode, string> = {
  foot: 'https://routing.openstreetmap.de/routed-foot/route/v1/foot',
  car: 'https://router.project-osrm.org/route/v1/driving'
};

const routeCache = new Map<string, Route>();

/** The route along the streets, or null when the server cannot be reached or finds none. */
export async function fetchRoute(mode: TravelMode, from: MapPoint, to: MapPoint, signal?: AbortSignal): Promise<Route | null> {
  const cacheKey = `${mode}:${from.lat.toFixed(4)},${from.lng.toFixed(4)}>${to.lat.toFixed(4)},${to.lng.toFixed(4)}`;
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  try {
    const url = `${ROUTERS[mode]}/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: withTimeout(signal, 10_000) });
    if (!response.ok) return null;
    const data = await response.json();
    const route = data?.code === 'Ok' ? data.routes?.[0] : null;
    const line = route?.geometry?.coordinates;
    if (!Array.isArray(line) || line.length < 2) return null;

    const result: Route = {
      mode,
      distanceMeters: Math.round(route.distance),
      minutes: Math.max(1, Math.round(route.duration / 60)),
      line
    };
    routeCache.set(cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

const WALKING_METERS_PER_MINUTE = 75; // 4.5 km/h, the same pace as the walking router
const STREET_DETOUR = 1.25; // streets are longer than a straight line
const MAX_WALK_TO_SHOW_MIN = 180;

/** Minutes on foot along a path of this length. */
export const walkingMinutesAlong = (pathMeters: number) =>
  Math.max(1, Math.round(pathMeters / WALKING_METERS_PER_MINUTE));

/** Minutes on foot guessed from a straight-line distance, for when no route is available. */
export const estimateWalkingMinutes = (straightMeters: number) => walkingMinutesAlong(straightMeters * STREET_DETOUR);

/** Walking time is worth showing only when walking is a real option. */
export const isWalkable = (minutes: number) => minutes <= MAX_WALK_TO_SHOW_MIN;

/** "1,2" in Spanish, Quechua and Aymara as written in Peru; "1.2" in English. */
export const decimal = (value: number, digits = 1) => {
  const text = value.toFixed(digits);
  return getLang() === 'en' ? text : text.replace('.', ',');
};

/** "850 m", "1,2 km", "320 km". */
export function formatMeters(meters: number): string {
  if (meters < 1000) return `${Math.max(10, Math.round(meters / 10) * 10)} m`;
  if (meters < 100_000) return `${decimal(meters / 1000)} km`;
  return `${Math.round(meters / 1000)} km`;
}

/** "1 minuto", "15 minutos", "1 hora y 10 minutos", in the chosen language. */
export function formatMinutes(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  const minutesText = (count: number) => (count === 1 ? tr('1 minuto') : tr('{count} minutos', { count }));
  if (total < 60) return minutesText(total);
  const rest = total % 60;
  const hourCount = Math.floor(total / 60);
  const hours = hourCount === 1 ? tr('1 hora') : tr('{count} horas', { count: hourCount });
  return rest ? tr('{hours} y {minutes}', { hours, minutes: minutesText(rest) }) : hours;
}

/** "unos 15 minutos", "cerca de 1 hora y 10 minutos": every time here is an estimate. */
export function aboutMinutes(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  if (total === 1) return tr('1 minuto');
  return total < 60 ? tr('unos {time}', { time: formatMinutes(total) }) : tr('cerca de {time}', { time: formatMinutes(total) });
}
