import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS, type TranslatedLang } from './strings';

/** The languages of the app: Spanish, Quechua Sureño, Quechua Central, Aymara, Asháninka and English. */
export type Lang = 'es' | 'qu' | 'qu-cen' | 'ay' | 'cni' | 'en';

export interface LanguageOption {
  id: Lang;
  name: string;
  nativeName: string;
  short: string;
  htmlLang: string;
  region: string;
}

export const LANGUAGES: LanguageOption[] = [
  { id: 'es', name: 'Español', nativeName: 'Español', short: 'ES', htmlLang: 'es-PE', region: 'Perú' },
  { id: 'qu', name: 'Quechua Sureño', nativeName: 'Urin Runasimi', short: 'QUS', htmlLang: 'qu', region: 'Cusco, Ayacucho, Puno, Apurímac' },
  { id: 'qu-cen', name: 'Quechua Central', nativeName: 'Chawpi Runashimi', short: 'QUC', htmlLang: 'qu-PE', region: 'Áncash, Wanka, Huánuco, Pasco' },
  { id: 'ay', name: 'Aimara', nativeName: 'Aymar aru', short: 'AY', htmlLang: 'ay', region: 'Puno, Moquegua, Tacna' },
  { id: 'cni', name: 'Asháninka', nativeName: 'Asháninka', short: 'CNI', htmlLang: 'cni', region: 'Selva Central, Junín, Ucayali' },
  { id: 'en', name: 'English', nativeName: 'English', short: 'EN', htmlLang: 'en', region: 'International' }
];

const KEY = 'ayllu_lang';

interface LanguageValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The text in the chosen language; the Spanish one when it is not translated yet. */
  t: (spanish: string) => string;
}

const LanguageContext = createContext<LanguageValue>({ lang: 'es', setLang: () => {}, t: (spanish) => spanish });

function savedLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    return LANGUAGES.some((option) => option.id === saved) ? (saved as Lang) : 'es';
  } catch {
    return 'es';
  }
}

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(savedLang);

  // Screen readers pronounce with the right voice when the page says its language.
  useEffect(() => {
    document.documentElement.lang = LANGUAGES.find((option) => option.id === lang)?.htmlLang ?? 'es-PE';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // it goes back to Spanish next time, which is safe
    }
  }, []);

  const t = useCallback(
    (spanish: string) => {
      if (!spanish || lang === 'es') return spanish;
      const dict = STRINGS[lang as TranslatedLang];
      return dict?.[spanish] ?? dict?.[spanish.trim()] ?? spanish;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
