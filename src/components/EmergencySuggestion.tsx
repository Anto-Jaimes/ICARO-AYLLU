import React, { useEffect, useMemo, useState } from 'react';
import { Siren } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useHazards } from '../context/HazardContext';
import { useT } from '../i18n/LanguageContext';
import { tapFeedback } from '../lib/native';
import { emergencyReason } from '../utils/emergencyTrigger';
import { BottomSheet } from './BottomSheet';

const DISMISSED_KEY = 'ayllu_emergency_dismissed';

function loadDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) ?? '[]');
  } catch {
    return [];
  }
}

/**
 * Offers emergency mode when official data says it is needed. It asks instead of switching on its
 * own: a sudden change of screen would confuse, and the neighbour may already be safe.
 */
export const EmergencySuggestion: React.FC = () => {
  const { mode, setMode } = useApp();
  const { feed } = useHazards();
  const t = useT();
  const reason = useMemo(() => emergencyReason(feed), [feed]);
  const [dismissed, setDismissed] = useState<string[]>(loadDismissed);
  const isOpen = reason !== null && mode !== 'emergency' && !dismissed.includes(reason.id);

  useEffect(() => {
    if (isOpen) tapFeedback();
  }, [isOpen]);

  const remember = () => {
    if (!reason) return;
    const next = [...dismissed, reason.id].slice(-20);
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // it may ask again, which is safe
    }
  };

  const activate = () => {
    remember();
    setMode('emergency');
  };

  return (
    <BottomSheet open={isOpen} onClose={remember} title={t('¿Activar modo emergencia?')}>
      {reason && (
        <div className="px-4 space-y-3" style={{ paddingBottom: 'calc(16px + var(--safe-bottom))' }}>
          <div role="alert" className="p-3 rounded-lg border-2 border-rojo">
            <p className="flex items-center gap-2 text-row font-bold text-rojo">
              <Siren className="w-6 h-6 shrink-0" aria-hidden="true" />
              {reason.title}
            </p>
            <p className="pt-1 text-secondary">{reason.line}</p>
          </div>
          <p className="text-secondary text-ink-2">
            {t('El modo emergencia muestra a los vecinos que piden ayuda, los recursos cercanos y los grupos de apoyo. Puedes salir cuando quieras.')}
          </p>
          <button type="button" className="btn btn-danger" onClick={activate}>
            <Siren className="w-6 h-6" aria-hidden="true" />
            {t('Activar modo emergencia')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={remember}>{t('Ahora no')}</button>
        </div>
      )}
    </BottomSheet>
  );
};
