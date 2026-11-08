import React, { ReactNode } from 'react';
import { ArrowLeft, CircleHelp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioGuideButton } from './AudioGuideButton';
import { LANGUAGES, useLanguage, useT } from '../i18n/LanguageContext';

export const TopBarLanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={`inline-flex items-center rounded-md bg-sunken p-0.5 border border-line text-xs font-bold shrink-0 max-w-[210px] overflow-x-auto ${className}`}
      style={{ scrollbarWidth: 'none' }}
      role="group"
      aria-label="Idioma"
    >
      {LANGUAGES.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLang(opt.id)}
          title={`${opt.nativeName} (${opt.name})`}
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase transition-colors shrink-0 ${
            lang === opt.id ? 'bg-anil text-white shadow-xs' : 'text-ink-2 hover:text-ink'
          }`}
          aria-pressed={lang === opt.id}
        >
          {opt.short}
        </button>
      ))}
    </div>
  );
};

interface TopBarProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export const HelpButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { setIsMenuOpen } = useApp();
  const t = useT();
  return (
    <button type="button" onClick={() => setIsMenuOpen(true)} aria-label={t('Ayuda')} className={`icon-btn ${className}`}>
      <CircleHelp className="w-6 h-6" aria-hidden="true" />
    </button>
  );
};

export const TopBar: React.FC<TopBarProps> = ({ title, onBack, action }) => {
  const t = useT();
  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-line" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="page flex items-center h-14 pl-4 pr-1 gap-1">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t('Volver')} className="icon-btn -ml-3">
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
        <h1 className="flex-1 min-w-0 truncate text-title font-bold">{t(title)}</h1>
        <div className="flex items-center gap-1">
          <TopBarLanguageSelector />
          <AudioGuideButton screenTitle={t(title)} />
          {action ?? <HelpButton />}
        </div>
      </div>
    </header>
  );
};

/** The red frame of emergency mode: always says where you are and how to leave. */
export const EmergencyBar: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const t = useT();
  return (
    <header className="sticky top-0 z-20 bg-rojo text-white" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="page flex items-center h-14 pl-4 pr-2 gap-2">
        <h1 className="flex-1 min-w-0 truncate text-title font-bold">{t('Modo emergencia')}</h1>
        <TopBarLanguageSelector className="bg-rojo-press border-white/20 text-white" />
        <AudioGuideButton className="text-white hover:bg-white/10" screenTitle={t('Modo emergencia')} />
        <button
          type="button"
          onClick={onExit}
          className="min-h-12 px-4 rounded-lg font-bold text-secondary bg-white text-rojo"
        >
          {t('Salir')}
        </button>
      </div>
    </header>
  );
};
