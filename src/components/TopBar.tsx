import React, { ReactNode } from 'react';
import { ArrowLeft, CircleHelp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioGuideButton } from './AudioGuideButton';
import { useT } from '../i18n/LanguageContext';

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
        <div className="flex items-center gap-0.5">
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
