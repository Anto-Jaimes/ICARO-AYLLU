/**
 * The exact place for rescue messages. GPS gives the point (5 decimals, about 1 m, plus how precise the
 * phone says it is) and the Plus Code; no public map knows "manzana y lote" in Peru's settlements, so
 * the neighbour writes it once, and it goes in the messages only when they are near where they wrote
 * it (it describes that place, not wherever the phone is).
 */
import type { UserLocation } from '../types';
import { tr } from '../i18n/translate';
import { placeLabel } from '../services/geoService';
import { calculateDistanceMeters } from './geo';
import { getLocalPlusCode } from './plusCodes';

const KEY = 'ayllu_exact_reference_v1';
/** Farther than this from where it was written, the reference is about another place. */
export const REFERENCE_RADIUS_M = 200;
export const MAX_REFERENCE = 120;

export interface ExactReference {
  text: string;
  lat: number;
  lng: number;
}

export function loadReference(): ExactReference | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as ExactReference | null;
    return saved && typeof saved.text === 'string' && Number.isFinite(saved.lat) && Number.isFinite(saved.lng) ? saved : null;
  } catch {
    return null;
  }
}

/** False when the phone could not store it. An empty text removes it. */
export function saveReference(text: string, lat: number, lng: number): boolean {
  try {
    const clean = text.replace(/\s+/g, ' ').trim().slice(0, MAX_REFERENCE);
    if (!clean) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, JSON.stringify({ text: clean, lat, lng }));
    return true;
  } catch {
    return false;
  }
}

/** The written manzana y lote, only when the phone is near where it was written. */
export function referenceNear(lat: number, lng: number): string | null {
  const saved = loadReference();
  if (!saved) return null;
  return calculateDistanceMeters(lat, lng, saved.lat, saved.lng) <= REFERENCE_RADIUS_M ? saved.text : null;
}

export const mapLink = (lat: number, lng: number) => `https://maps.google.com/?q=${lat.toFixed(5)},${lng.toFixed(5)}`;

/**
 * "Estoy en Mz. B Lt. 12, Av. Cajamarquilla, Lurigancho: https://maps.google.com/?q=... GPS ±8 m.
 * Plus Code: 7792+4R." Without a real position it says so: a guessed place would send help to the
 * wrong street.
 */
export function locationSentence(location: UserLocation, hasLocation: boolean): string {
  if (!hasLocation) return tr('No pude obtener mi ubicación.');
  const reference = referenceNear(location.lat, location.lng);
  const street = placeLabel(location.name);
  const place = reference ? `${reference}, ${street}` : street;
  const parts = [tr('Estoy en {place}: {link}', { place, link: mapLink(location.lat, location.lng) })];
  if (location.accuracy && location.accuracy < 1000) parts.push(tr('GPS ±{meters} m.', { meters: Math.round(location.accuracy) }));
  parts.push(`Plus Code: ${getLocalPlusCode(location.lat, location.lng).fullCode}.`);
  return parts.join(' ');
}
