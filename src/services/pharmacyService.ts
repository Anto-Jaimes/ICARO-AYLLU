/**
 * Pharmacies near the neighbour, from OpenStreetMap (loaded into emergency_places by
 * scripts/import-emergency-places.ts --farmacias), and DIGEMID's official search for medicines and
 * their prices. Which pharmacy is "de turno" today is not published as open data, so the app never
 * says it. The last list is kept for when there is no internet.
 */
import { supabase } from '../lib/supabase';

/** DIGEMID's Observatorio Peruano de Productos Farmacéuticos (linked from gob.pe/42006). */
export const DIGEMID_SEARCH_URL = 'https://opm-digemid.minsa.gob.pe/#/consulta-producto';

const CACHE_KEY = 'ayllu_pharmacies_v2';

export interface Pharmacy {
  name: string | null;
  phone: string | null;
  address: string | null;
  opening_hours: string | null;
  lat: number;
  lng: number;
  distance_m: number;
}

interface SavedPharmacies {
  savedAt: string;
  pharmacies: Pharmacy[];
}

// An earlier version kept a made-up list here; it must not come back from storage.
try {
  localStorage.removeItem('ayllu_digemid_pharmacies_v1');
} catch {
  // nothing to remove
}

/** "24/7" is how the map writes "open all day"; anything else is shown as the map has it. */
export const isOpenAllDay = (hours: string | null) => hours?.replace(/\s/g, '') === '24/7';

export function savedPharmacies(): SavedPharmacies | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as SavedPharmacies | null;
  } catch {
    return null;
  }
}

export async function nearbyPharmacies(lat: number, lng: number): Promise<Pharmacy[]> {
  const { data, error } = await supabase.rpc('nearby_pharmacies', { p_lat: lat, p_lng: lng, p_limit: 8 });
  if (error) throw error;
  const pharmacies = (data ?? []) as Pharmacy[];
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), pharmacies }));
  } catch {
    // shown anyway; only the copy for later is lost
  }
  return pharmacies;
}
