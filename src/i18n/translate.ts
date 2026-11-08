import { STRINGS } from './strings';

/**
 * Languages with a table. The four offered ones are Spanish, English, Southern Quechua and Aymara;
 * Quechua Central (qu-cen) and Asháninka (cni) are started but not offered yet (see LanguageContext).
 */
export type Lang = 'es' | 'en' | 'qu' | 'ay' | 'qu-cen' | 'cni';

/** Values put into a sentence: t('Hay avisos en {place}', { place }). */
export type TextParams = Record<string, string | number>;

export const LANG_KEY = 'ayllu_lang';
const LANG_IDS: Lang[] = ['es', 'en', 'qu', 'ay'];

function savedLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return LANG_IDS.includes(saved as Lang) ? (saved as Lang) : 'es';
  } catch {
    return 'es';
  }
}

// The language outside React (services, utils, contexts). LanguageProvider keeps it in step.
let currentLang: Lang = savedLang();

export const getLang = (): Lang => currentLang;
export const setCurrentLang = (lang: Lang) => {
  currentLang = lang;
};
export const readSavedLang = savedLang;

function fill(text: string, params?: TextParams): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

/**
 * The Spanish text in `lang`. The Spanish sentence is the key; when it has no translation yet the
 * Spanish one is shown, so a screen never goes blank. `{name}` placeholders are filled from params.
 */
export function translate(lang: Lang, spanish: string, params?: TextParams): string {
  if (!spanish) return spanish;
  if (lang === 'es') return fill(spanish, params);
  const table = STRINGS[lang];
  const text = table[spanish] ?? table[spanish.trim()] ?? spanish;
  return fill(text, params);
}

/** translate() in the current language, for code outside React components. */
export const tr = (spanish: string, params?: TextParams): string => translate(currentLang, spanish, params);

// The bottom bar gives each tab a fifth of the phone: these words do not fit, so the bar uses a shorter one.
const SHORT_LABELS: Partial<Record<Lang, Record<string, string>>> = {
  qu: { Servicios: "Llamk'ay", Vecinos: 'Llaqtamasi', Donaciones: 'Quykuy' },
  ay: { Donaciones: "Waxt'a", Vecinos: "Jak'a jaqi" }
};

/** The text for a tight place (the bottom bar): a shorter word when the usual one does not fit. */
export function translateShort(lang: Lang, spanish: string): string {
  return SHORT_LABELS[lang]?.[spanish] ?? translate(lang, spanish);
}

const DATE_LOCALE: Record<Lang, string> = { es: 'es-PE', en: 'en-GB', qu: 'es-PE', ay: 'es-PE', 'qu-cen': 'es-PE', cni: 'es-PE' };

// Quechua and Aymara have no month names in the phone's date library: their dates are written in numbers.
const NUMERIC_DATES: Lang[] = ['qu', 'ay', 'qu-cen', 'cni'];

/** A date as people read it in the current language: "8 de noviembre de 2026", "8 November 2026", "8/11/2026". */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }): string {
  const lang = currentLang;
  if (NUMERIC_DATES.includes(lang)) {
    const numeric: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'numeric', timeZone: options.timeZone };
    if (options.year) numeric.year = 'numeric';
    return date.toLocaleDateString('es-PE', numeric);
  }
  return date.toLocaleDateString(DATE_LOCALE[lang], options);
}

// Quechua weekdays, Sunday to Saturday (Intichaw, Killachaw...), short so five fit in a row.
const QUECHUA_WEEKDAYS = ['Inti', 'Killa', 'Ati', 'Quyllur', 'Illapa', "Ch'aska", "K'uychi"];
const ENGLISH_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Vie", "Fri", "Ch'aska", "9/11"... a short name for a day in Peru, in the current language. */
export function weekdayShort(date: Date): string {
  const lang = currentLang;
  if (lang === 'qu') {
    const index = ENGLISH_WEEKDAYS.indexOf(date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Lima' }));
    return QUECHUA_WEEKDAYS[index] ?? '';
  }
  // Aymara weekday names vary a lot between regions: the day and month are clearer.
  if (lang === 'ay') return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'numeric', timeZone: 'America/Lima' });
  const name = date.toLocaleDateString(DATE_LOCALE[lang], { weekday: 'short', timeZone: 'America/Lima' }).replace('.', '');
  return name.charAt(0).toUpperCase() + name.slice(1);
}
