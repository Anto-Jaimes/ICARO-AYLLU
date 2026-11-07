/** The nearest police station, fire station and hospital, from OpenStreetMap data kept in our database. */
import { supabase } from '../lib/supabase';

export type PlaceKind = 'police' | 'fire_station' | 'hospital';

export interface EmergencyPlace {
  kind: PlaceKind;
  name: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  distance_m: number;
}

interface SavedPlaces {
  lat: number;
  lng: number;
  places: EmergencyPlace[];
  savedAt: string;
}

const CACHE_KEY = 'ayllu_emergency_places';

/** Kept for a blackout without internet: the last list fetched, with where it was fetched. */
export function savedEmergencyPlaces(): SavedPlaces | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
  } catch {
    return null;
  }
}

export async function nearbyEmergencyPlaces(lat: number, lng: number): Promise<EmergencyPlace[]> {
  const { data, error } = await supabase.rpc('nearby_emergency_places', { p_lat: lat, p_lng: lng, p_per_kind: 1 });
  if (error) throw error;
  const places = (data ?? []) as EmergencyPlace[];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng, places, savedAt: new Date().toISOString() }));
  } catch {
    // shown now, just not saved for later
  }
  return places;
}

/** Phone numbers from the map come in many shapes; the dialler needs only digits and "+". */
export const dialablePhone = (phone: string) => phone.replace(/[^\d+]/g, '');

export const formatDistance = (meters: number) =>
  meters < 1000 ? `a ${Math.max(50, Math.round(meters / 50) * 50)} m` : `a ${(meters / 1000).toFixed(1).replace('.', ',')} km`;
