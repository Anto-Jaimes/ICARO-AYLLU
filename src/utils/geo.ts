import { tr } from '../i18n/translate';

const WALKING_METERS_PER_MINUTE = 75;
const STREET_DETOUR = 1.25; // streets are longer than a straight line
const MAX_WALKING_MINUTES = 30;

/** The "Sin límite" option of the distance filter. */
export const UNLIMITED_RADIUS_M = 100000;

/** Rough box around Peru: a reading outside it must not move the neighbour abroad. */
export function isInPeru(lat: number, lng: number): boolean {
  return lat >= -18.6 && lat <= 0.2 && lng >= -81.6 && lng <= -68.4;
}

// Calculates distance in meters between two lat/lng coordinates using the Haversine formula
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/** "a 6 min a pie" when walkable, otherwise kilometres. Null without a real position. */
export function describeDistance(meters?: number): string | null {
  if (meters === undefined || Number.isNaN(meters)) return null;
  const minutes = Math.max(1, Math.round((meters * STREET_DETOUR) / WALKING_METERS_PER_MINUTE));
  return minutes <= MAX_WALKING_MINUTES ? tr('a {minutes} min a pie', { minutes }) : tr('a {km} km', { km: (meters / 1000).toFixed(1) });
}

/** Returns a number that WhatsApp and the dialer can open, or undefined if it is not one. */
export function normalizePhone(rawPhone: string): string | undefined {
  const phone = rawPhone.replace(/[^\d+]/g, '');
  if (/^9\d{8}$/.test(phone)) return `+51${phone}`; // Peruvian mobile without country code
  return /^\+?\d{6,15}$/.test(phone) ? phone : undefined;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}
