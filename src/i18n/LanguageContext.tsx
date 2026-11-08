import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Lang, LANG_KEY, readSavedLang, setCurrentLang, TextParams, translate } from './translate';

export type { Lang, TextParams } from './translate';
export { tr } from './translate';

export const LANGUAGES: { id: Lang; name: string; htmlLang: string }[] = [
  { id: 'es', name: 'Español', htmlLang: 'es-PE' },
  { id: 'en', name: 'English', htmlLang: 'en' },
  { id: 'qu', name: 'Runasimi (quechua)', htmlLang: 'qu' },
  { id: 'ay', name: 'Aymar aru (aimara)', htmlLang: 'ay' }
];

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

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readSavedLang);

  // Screen readers pronounce with the right voice when the page says its language.
  useEffect(() => {
    document.documentElement.lang = LANGUAGES.find((option) => option.id === lang)?.htmlLang ?? 'es-PE';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    // Code outside React reads the new language before anything re-renders.
    setCurrentLang(next);
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
