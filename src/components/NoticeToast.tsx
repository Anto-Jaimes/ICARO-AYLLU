import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useT } from '../i18n/LanguageContext';

const VISIBLE_MS = 5000;

export const NoticeToast: React.FC = () => {
  const { notice, clearNotice } = useApp();
  const t = useT();

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(clearNotice, VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [notice, clearNotice]);

  // The live region stays mounted so screen readers announce each new message.
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed z-[60] inset-x-4 pointer-events-none lg:left-64 lg:right-auto lg:w-[560px]"
      style={{ bottom: 'calc(var(--content-bottom) + 16px)' }}
    >
      {notice && (
        <p className="flex items-center min-h-14 px-4 py-3 rounded-lg bg-ink text-white text-secondary shadow-[0_4px_16px_#12182647]">
          {/* Most notices arrive translated; t() also catches a Spanish one that did not. */}
          {t(notice)}
        </p>
      )}
    </div>
  );
};
