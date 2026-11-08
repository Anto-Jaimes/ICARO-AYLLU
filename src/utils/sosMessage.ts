import { UserLocation } from '../types';
import { tr } from '../i18n/translate';
import { placeLabel } from '../services/geoService';

// Spanish keys: smsLink() writes them in the neighbour's language when the message is made.
export const SOS_OPENING = 'S.O.S. Necesito ayuda urgente.';
export const SAFE_OPENING = 'Estoy a salvo.';

/**
 * A text message that leaves without internet. The place goes in only when the phone really
 * knows it: a guessed place would send rescuers to the wrong street.
 */
export function smsLink(opening: string, location: UserLocation, hasLocation: boolean): string {
  const place = hasLocation
    ? ` ${tr('Estoy en {place}: {link}', {
        place: placeLabel(location.name),
        link: `https://maps.google.com/?q=${location.lat.toFixed(5)},${location.lng.toFixed(5)}`
      })}`
    : ` ${tr('No pude obtener mi ubicación.')}`;
  return `sms:?body=${encodeURIComponent(tr(opening) + place)}`;
}
