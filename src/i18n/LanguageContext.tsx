import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Lang, LANG_KEY, readSavedLang, setCurrentLang, TextParams, translate } from './translate';

export type { Lang, TextParams } from './translate';
export { tr } from './translate';

export interface LanguageOption {
  id: Lang;
  name: string;
  nativeName: string;
  short: string;
  htmlLang: string;
  region: string;
}

/**
 * Every language the team has started. The app offers the four agreed ones (Spanish, Southern Quechua,
 * Aymara, English): they are translated on every screen. Quechua Central and Asháninka are still partial,
 * so offering them would leave half of each screen in Spanish.
 */
export const ALL_LANGUAGES: LanguageOption[] = [
  { id: 'es', name: 'Español', nativeName: 'Español', short: 'ES', htmlLang: 'es-PE', region: 'Perú' },
  { id: 'qu', name: 'Quechua Sureño', nativeName: 'Urin Runasimi', short: 'QUS', htmlLang: 'qu', region: 'Cusco, Ayacucho, Puno, Apurímac' },
  { id: 'qu-cen', name: 'Quechua Central', nativeName: 'Chawpi Runashimi', short: 'QUC', htmlLang: 'qu-PE', region: 'Áncash, Wanka, Huánuco, Pasco' },
  { id: 'ay', name: 'Aimara', nativeName: 'Aymar aru', short: 'AY', htmlLang: 'ay', region: 'Puno, Moquegua, Tacna' },
  { id: 'cni', name: 'Asháninka', nativeName: 'Asháninka', short: 'CNI', htmlLang: 'cni', region: 'Selva Central, Junín, Ucayali' },
  { id: 'en', name: 'English', nativeName: 'English', short: 'EN', htmlLang: 'en', region: 'International' }
];

const OFFERED: Lang[] = ['es', 'qu', 'ay', 'en'];
export const LANGUAGES: LanguageOption[] = ALL_LANGUAGES.filter((option) => OFFERED.includes(option.id));

export type Translate = (spanish: string, params?: TextParams) => string;

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The text in the chosen language; the Spanish one when it is not translated yet. */
  t: Translate;
}

const LanguageContext = createContext<LanguageValue>({
  lang: 'es',
  setLang: () => {},
  t: (spanish, params) => translate('es', spanish, params)
});

let languageChangedAt = 0;

/**
 * True right after the neighbour picks another language. Every screen is drawn again then, and a sheet
 * that was open should simply be there, not slide up as if it had just been opened.
 */
export function languageJustChanged(): boolean {
  return Date.now() - languageChangedAt < 800;
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readSavedLang);

  // Screen readers pronounce with the right voice when the page says its language.
  useEffect(() => {
    document.documentElement.lang = LANGUAGES.find((option) => option.id === lang)?.htmlLang ?? 'es-PE';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    // Code outside React reads the new language before anything re-renders.
    setCurrentLang(next);
    languageChangedAt = Date.now();
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // it goes back to Spanish next time, which is safe
    }
  }, []);

  const t = useCallback<Translate>((spanish, params) => translate(lang, spanish, params), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;

/**
 * A translated sentence with pieces of markup inside, so the words around them can move:
 * fillNodes(t('Te llamaremos al {phone}.'), { phone: <strong>{phone}</strong> }).
 */
export function fillNodes(text: string, nodes: Record<string, ReactNode>): ReactNode[] {
  return text.split(/(\{\w+\})/).map((part, index) => {
    const name = /^\{(\w+)\}$/.exec(part)?.[1];
    return name !== undefined && name in nodes ? <React.Fragment key={index}>{nodes[name]}</React.Fragment> : part;
  });
}
