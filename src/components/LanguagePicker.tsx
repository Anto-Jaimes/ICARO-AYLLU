import React from 'react';
import { Languages } from 'lucide-react';
import { LANGUAGES, useLanguage } from '../i18n/LanguageContext';

export const LanguagePicker: React.FC = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <section aria-labelledby="language-title" className="px-4 py-3">
      <h3 id="language-title" className="flex items-center gap-2 pb-2.5 text-secondary font-bold">
        <Languages className="w-5 h-5 text-primary" aria-hidden="true" />
        {t('Idioma')}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="group" aria-labelledby="language-title">
        {LANGUAGES.map((option) => {
          const isSelected = lang === option.id;
          return (
            <button
              key={option.id}
              type="button"
              lang={option.htmlLang}
              aria-pressed={isSelected}
              onClick={() => setLang(option.id)}
              className={`min-h-14 p-3 rounded-xl text-left transition-all ${
 isSelected ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20' : 'bg-sunken text-ink hover:bg-border'
 }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-row leading-tight">{option.nativeName}</span>
                <span
                  className={`text-meta px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${
 isSelected ? 'bg-white/20 text-white' : 'bg-surface text-ink-secondary'
 }`}
                >
                  {option.short}
                </span>
              </div>
              <span className={`block text-meta mt-1 leading-snug ${isSelected ? 'text-white/80' : 'text-ink-secondary'}`}>
                {option.name} • {option.region}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
