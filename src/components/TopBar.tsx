import React, { ReactNode, useState } from 'react';
import { ArrowLeft, CircleHelp, Languages } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioGuideButton } from './AudioGuideButton';
import { LANGUAGES, useLanguage, useT } from '../i18n/LanguageContext';
import { BottomSheet } from './BottomSheet';
import { LanguagePicker } from './LanguagePicker';

/**
 * Quick access to the language from the top bar. Four tiny buttons did not fit a finger (25 x 19 px,
 * 11 px letters): one button of the usual size opens the picker with the four languages instead.
 */
export const TopBarLanguageSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const current = LANGUAGES.find((option) => option.id === lang)?.name ?? '';

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`icon-btn w-auto min-w-12 px-2 gap-1 text-meta font-bold uppercase shrink-0 ${className}`}
        aria-label={`${t('Idioma')}: ${current}`}
      >
        <Languages className="w-5 h-5" aria-hidden="true" />
        {lang}
      </button>
      <BottomSheet open={isOpen} onClose={() => setIsOpen(false)} title={t('Idioma')}>
        <div style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <LanguagePicker />
        </div>
      </BottomSheet>
    </>
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

/**
 * Quechua and Aymara titles are often one long word (Willakuykuna, Yanapt'asiña): a step smaller they fit
 * beside the buttons, two steps when a back arrow takes room too. Spanish keeps its size.
 */
const titleSize = (lang: string, text: string, { wraps = false, narrow = false } = {}) => {
  if (lang === 'es' || text.length <= 9) return 'truncate text-title';
  if (wraps) return 'text-row leading-tight line-clamp-2';
  return narrow && text.length > 10 ? 'truncate text-secondary' : 'truncate text-row';
};

export const TopBar: React.FC<TopBarProps> = ({ title, onBack, action }) => {
  const { lang, t } = useLanguage();
  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-line" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="page flex items-center h-14 pl-4 pr-1 gap-1">
        {onBack && (
          <button type="button" onClick={onBack} aria-label={t('Volver')} className="icon-btn -ml-3">
            <ArrowLeft className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
        <h1 className={`flex-1 min-w-0 font-bold ${titleSize(lang, t(title), { narrow: Boolean(onBack) })}`}>{t(title)}</h1>
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
  const { t } = useLanguage();
  return (
    <header className="sticky top-0 z-20 bg-rojo text-white" style={{ paddingTop: 'var(--safe-top)' }}>
      <div className="page flex items-center h-14 pl-4 pr-2 gap-2">
        {/* Beside three buttons on a small phone it does not fit in one line: two lines rather than cut. */}
        <h1 className="flex-1 min-w-0 font-bold text-row leading-tight line-clamp-2">{t('Modo emergencia')}</h1>
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
