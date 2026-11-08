/**
 * Open places to gather after an earthquake, near the neighbour, from OpenStreetMap: assembly points
 * marked on the map, parks, sports pitches and squares. It is not an official INDECI list (none is
 * published as open data), so the app names each one as the map does and says where it comes from.
 * The public Overpass servers refuse browsers, so the safe-zones function asks for the app and keeps
 * each neighbourhood. The last answer is also kept on the phone for when there is no internet.
 */
import { supabase } from '../lib/supabase';
import { calculateDistanceMeters } from '../utils/geo';

export type SafeZoneKind = 'assembly' | 'park' | 'pitch' | 'square';

export interface SafeZone {
  id: string;
  name: string | null;
  kind: SafeZoneKind;
  lat: number;
  lng: number;
  distance_m: number;
}

/** Shown when the map has no name for the place. */
export const SAFE_ZONE_LABELS: Record<SafeZoneKind, string> = {
  assembly: 'Punto de reunión',
  park: 'Parque',
  pitch: 'Losa deportiva',
  square: 'Plaza'
};

const CACHE_KEY = 'ayllu_safe_zones_v1';
const MAX_ZONES = 30;

function withDistance(zones: SafeZone[], lat: number, lng: number): SafeZone[] {
  return zones
    .map((zone) => ({ ...zone, distance_m: Math.round(calculateDistanceMeters(lat, lng, zone.lat, zone.lng)) }))
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, MAX_ZONES);
}

export function savedSafeZones(lat: number, lng: number): SafeZone[] | null {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as { lat: number; lng: number; zones: SafeZone[] } | null;
    // Kept for the same neighbourhood only: far away it would show another place's parks.
    if (!saved || calculateDistanceMeters(lat, lng, saved.lat, saved.lng) > 1000) return null;
    return withDistance(saved.zones, lat, lng);
  } catch {
    return null;
  }
}

export async function nearbySafeZones(lat: number, lng: number): Promise<SafeZone[]> {
  const { data, error } = await supabase.functions.invoke<{ zones: Omit<SafeZone, 'distance_m'>[] }>('safe-zones', { body: { lat, lng } });
  if (error || !data) throw error ?? new Error('safe-zones');
  const sorted = withDistance(data.zones.map((zone) => ({ ...zone, distance_m: 0 })), lat, lng);
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lat, lng, zones: sorted }));
  } catch {
    // shown anyway; only the copy for later is lost
  }
  return sorted;
}
