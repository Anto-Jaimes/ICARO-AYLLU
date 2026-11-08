/**
 * The neighbour's own places: home and a short list of named spots (a school, a meeting point).
 * They live only on this phone, so they work without internet and never reach the database.
 */

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface Home extends MapPoint {
  /** A street or place name to recognise it by; empty when none was found. */
  address: string;
}

export interface MyPlace extends MapPoint {
  id: string;
  name: string;
  address: string;
}

export const MAX_PLACES = 20;
export const MAX_PLACE_NAME = 40;

const HOME_KEY = 'ayllu_my_home_v1';
const PLACES_KEY = 'ayllu_my_places_v1';

const isPoint = (value: unknown): value is MapPoint =>
  typeof value === 'object' && value !== null &&
  Number.isFinite((value as MapPoint).lat) && Number.isFinite((value as MapPoint).lng);

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

/** False when the phone refused to store it (full or blocked storage). */
function write(key: string, value: unknown): boolean {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadHome(): Home | null {
  const saved = read(HOME_KEY);
  if (!isPoint(saved)) return null;
  return { lat: saved.lat, lng: saved.lng, address: String((saved as Home).address ?? '') };
}

export function saveHome(home: Home): boolean {
  return write(HOME_KEY, { lat: home.lat, lng: home.lng, address: home.address });
}

export function clearHome(): boolean {
  return write(HOME_KEY, null);
}

export function loadPlaces(): MyPlace[] {
  const saved = read(PLACES_KEY);
  if (!Array.isArray(saved)) return [];
  return saved
    .filter((place): place is MyPlace => isPoint(place) && typeof (place as MyPlace).name === 'string')
    .map((place) => ({
      id: String(place.id ?? crypto.randomUUID()),
      name: place.name.slice(0, MAX_PLACE_NAME),
      address: String(place.address ?? ''),
      lat: place.lat,
      lng: place.lng
    }))
    .slice(0, MAX_PLACES);
}

export function savePlaces(places: MyPlace[]): boolean {
  return write(PLACES_KEY, places.slice(0, MAX_PLACES));
}

export function newPlace(name: string, point: MapPoint, address: string): MyPlace {
  return { id: crypto.randomUUID(), name: name.trim().slice(0, MAX_PLACE_NAME), address, lat: point.lat, lng: point.lng };
}
