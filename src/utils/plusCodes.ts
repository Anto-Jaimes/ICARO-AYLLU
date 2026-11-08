/**
 * Open Location Code (Plus Codes) Encoder for AYLLU.
 * Specification: Google Open Location Code (Apache 2.0 / Public Domain standard).
 * Generates compact, 100% offline, grid-based alphanumeric location codes (e.g. "7792+4R")
 * without requiring any internet connection or external API calls.
 */

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = CODE_ALPHABET.length; // 20
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;
const PAIR_CODE_LENGTH = 10;
const SEPARATOR = '+';
const SEPARATOR_POSITION = 8;

/**
 * Normalizes coordinate values and encodes to a full 10-character Plus Code.
 */
export function encodePlusCode(latitude: number, longitude: number, codeLength = 10): string {
  if (isNaN(latitude) || isNaN(longitude)) return '';

  // Clip latitude between -90 and 90
  const lat = Math.min(90, Math.max(-90, latitude));
  // Normalize longitude between -180 and 180
  let lng = longitude;
  while (lng < -180) lng += 360;
  while (lng >= 180) lng -= 360;

  let latVal = lat + LATITUDE_MAX;
  let lngVal = lng + LONGITUDE_MAX;

  let code = '';

  // Initial resolution step
  let latResolution = 20;
  let lngResolution = 20;

  for (let i = 0; i < PAIR_CODE_LENGTH / 2; i++) {
    const latDigit = Math.min(19, Math.max(0, Math.floor(latVal / latResolution)));
    const lngDigit = Math.min(19, Math.max(0, Math.floor(lngVal / lngResolution)));

    code += CODE_ALPHABET[latDigit];
    code += CODE_ALPHABET[lngDigit];

    latVal -= latDigit * latResolution;
    lngVal -= lngDigit * lngResolution;

    latResolution /= ENCODING_BASE;
    lngResolution /= ENCODING_BASE;

    if (code.length === SEPARATOR_POSITION) {
      code += SEPARATOR;
    }
  }

  return code.slice(0, codeLength > SEPARATOR_POSITION ? codeLength + 1 : codeLength);
}

/**
 * Returns a short, human-friendly local Plus Code (last 6-7 characters e.g. "7792+4R")
 * paired with the locality name for dictation over phone to police or firefighters.
 */
export function getLocalPlusCode(lat: number, lng: number, localityName?: string): {
  fullCode: string;
  shortCode: string;
  displayCode: string;
  spellOut: string;
  mapUrl: string;
} {
  const full = encodePlusCode(lat, lng, 10);
  // Short code takes the last characters around the '+' (e.g. full "679W7792+4R" -> short "7792+4R")
  const shortCode = full.length >= 11 ? full.slice(4) : full;
  const displayCode = localityName ? `${shortCode}, ${localityName}` : shortCode;

  // Spell out in phonetic Spanish / letters for reading aloud to 116 / 105 operators
  const spellMap: Record<string, string> = {
    '2': 'dos',
    '3': 'tres',
    '4': 'cuatro',
    '5': 'cinco',
    '6': 'seis',
    '7': 'siete',
    '8': 'ocho',
    '9': 'nueve',
    C: 'C',
    F: 'F',
    G: 'G',
    H: 'H',
    J: 'J',
    M: 'M',
    P: 'P',
    Q: 'Q',
    R: 'R',
    V: 'V',
    W: 'W',
    X: 'X',
    '+': 'más'
  };

  const spellOut = shortCode
    .split('')
    .map((c) => spellMap[c.toUpperCase()] || c)
    .join(' - ');

  return {
    fullCode: full,
    shortCode,
    displayCode,
    spellOut,
    mapUrl: `https://plus.codes/${encodeURIComponent(full)}`
  };
}
