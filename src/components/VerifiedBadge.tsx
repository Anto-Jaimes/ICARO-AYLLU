import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { useT } from '../i18n/LanguageContext';

/**
 * "Celular verificado": a moderator checked this neighbour's phone (and the call center verified it).
 * It never says more than that: AYLLU does not check identity documents.
 */
export const VerifiedBadge: React.FC<{ explain?: boolean; className?: string }> = ({ explain = false, className = '' }) => {
  const t = useT();
  return (
    <span className={`block ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-secondary font-semibold text-verde">
        <BadgeCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
        {t('Celular verificado')}
      </span>
      {explain && <span className="block text-meta text-ink-2">{t('Un moderador de AYLLU comprobó su número de celular.')}</span>}
    </span>
  );
};
