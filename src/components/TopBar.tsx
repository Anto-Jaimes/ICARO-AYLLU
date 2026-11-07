import React, { ReactNode } from 'react';
import { ArrowLeft, CircleHelp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AudioGuideButton } from './AudioGuideButton';

interface TopBarProps {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}

export const HelpButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { setIsMenuOpen } = useApp();
  return (
    <button type="button" onClick={() => setIsMenuOpen(true)} aria-label="Ayuda" className={`icon-btn ${className}`}>
      <CircleHelp className="w-6 h-6" aria-hidden="true" />
    </button>
  );
};

export const TopBar: React.FC<TopBarProps> = ({ title, onBack, action }) => (
  <header className="sticky top-0 z-20 bg-surface border-b border-line" style={{ paddingTop: 'var(--safe-top)' }}>
    <div className="page flex items-center h-14 pl-4 pr-1 gap-1">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Volver" className="icon-btn -ml-3">
          <ArrowLeft className="w-6 h-6" aria-hidden="true" />
        </button>
      )}
      <h1 className="flex-1 min-w-0 truncate text-title font-bold">{title}</h1>
      <div className="flex items-center gap-0.5">
        <AudioGuideButton screenTitle={title} />
        {action ?? <HelpButton />}
      </div>
    </div>
  </header>
);

/** The red frame of emergency mode: always says where you are and how to leave. */
export const EmergencyBar: React.FC<{ onExit: () => void }> = ({ onExit }) => (
  <header className="sticky top-0 z-20 bg-rojo text-white" style={{ paddingTop: 'var(--safe-top)' }}>
    <div className="page flex items-center h-14 pl-4 pr-2 gap-2">
      <h1 className="flex-1 min-w-0 truncate text-title font-bold">Modo emergencia</h1>
      <AudioGuideButton className="text-white hover:bg-white/10" screenTitle="Modo emergencia" />
      <button
        type="button"
        onClick={onExit}
        className="min-h-12 px-4 rounded-lg font-bold text-secondary bg-white text-rojo"
      >
        Salir
      </button>
    </div>
  </header>
);
