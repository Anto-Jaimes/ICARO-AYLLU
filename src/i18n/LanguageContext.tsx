import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STRINGS } from './strings';

/** The four languages of the app: Spanish, English, Quechua and Aymara. */
export type Lang = 'es' | 'en' | 'qu' | 'ay';

export const LANGUAGES: { id: Lang; name: string; htmlLang: string }[] = [
  { id: 'es', name: 'Español', htmlLang: 'es-PE' },
  { id: 'en', name: 'English', htmlLang: 'en' },
  { id: 'qu', name: 'Runasimi (quechua)', htmlLang: 'qu' },
  { id: 'ay', name: 'Aymar aru (aimara)', htmlLang: 'ay' }
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

  const t = useCallback((spanish: string) => (lang === 'es' ? spanish : STRINGS[lang][spanish] ?? spanish), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
