import React from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../i18n/LanguageContext';

/** Spanish, English, Quechua or Aymara; each written in its own language so anyone finds theirs. */
export const LanguagePicker: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <section aria-labelledby="language-title" className="px-4 py-3">
      <h3 id="language-title" className="flex items-center gap-2 pb-2 text-secondary font-bold">
        <Languages className="w-5 h-5 text-anil" aria-hidden="true" />
        {t('Idioma')}
      </h3>
      <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="language-title">
        {LANGUAGES.map((option) => (
          <button
            key={option.id}
            type="button"
            lang={option.htmlLang}
            aria-pressed={lang === option.id}
            onClick={() => setLang(option.id)}
            className={`min-h-12 px-3 rounded-lg text-secondary font-bold text-left ${
              lang === option.id ? 'bg-anil text-white' : 'bg-sunken text-ink'
            }`}
          >
            {option.name}
          </button>
        ))}
      </div>
    </section>
  );
};
