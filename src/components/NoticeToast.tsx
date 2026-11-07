import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

const VISIBLE_MS = 5000;

export const NoticeToast: React.FC = () => {
  const { notice, clearNotice } = useApp();

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
      className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm pointer-events-none"
    >
      {notice && (
        <p className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-sm font-semibold text-center shadow-xl animate-fadeIn">
          {notice}
        </p>
      )}
    </div>
  );
};
