import { UserLocation } from '../types';

export const SOS_OPENING = 'S.O.S. Necesito ayuda urgente.';
export const SAFE_OPENING = 'Estoy a salvo.';

/**
 * A text message that leaves without internet. The place goes in only when the phone really
 * knows it: a guessed place would send rescuers to the wrong street.
 */
export function smsLink(opening: string, location: UserLocation, hasLocation: boolean): string {
  const place = hasLocation
    ? ` Estoy en ${location.name}: https://maps.google.com/?q=${location.lat.toFixed(5)},${location.lng.toFixed(5)}`
    : ' No pude obtener mi ubicación.';
  return `sms:?body=${encodeURIComponent(opening + place)}`;
}
