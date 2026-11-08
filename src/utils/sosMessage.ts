import { UserLocation } from '../types';
import { tr } from '../i18n/translate';
import { locationSentence } from './exactLocation';

// Spanish keys: smsLink() writes them in the neighbour's language when the message is made.
export const SOS_OPENING = 'S.O.S. Necesito ayuda urgente.';
export const SAFE_OPENING = 'Estoy a salvo.';

/**
 * A text message that leaves without internet. The place goes in only when the phone really
 * knows it: a guessed place would send rescuers to the wrong street.
 */
export function smsLink(opening: string, location: UserLocation, hasLocation: boolean): string {
  return `sms:?body=${encodeURIComponent(rescueText(opening, location, hasLocation))}`;
}

/** The opening and the exact place (manzana y lote when written, GPS link, precision, Plus Code). */
export function rescueText(opening: string, location: UserLocation, hasLocation: boolean): string {
  return `${tr(opening)} ${locationSentence(location, hasLocation)}`;
}
