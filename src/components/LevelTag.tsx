import React from 'react';
import { NoticeLevel } from '../services/hazardService';
import { useT } from '../i18n/LanguageContext';

const FILLED_BARS: Record<NoticeLevel, number> = { amarillo: 1, naranja: 2, rojo: 3 };

const TAG_STYLES: Record<NoticeLevel, string> = {
  amarillo: 'bg-status-warning text-ink',
  naranja: 'bg-status-severe text-ink',
  rojo: 'bg-status-danger text-white'
};

const LEVEL_LABELS: Record<NoticeLevel, string> = { amarillo: 'Amarillo', naranja: 'Naranja', rojo: 'Rojo' };

/** Three rising terraces, filled by severity, so the level also reads without colour. */
export const LevelGlyph: React.FC<{ level: NoticeLevel }> = ({ level }) => (
  <svg aria-hidden="true" viewBox="0 0 18 16" className="w-[18px] h-4 shrink-0" fill="currentColor">
    {[0, 1, 2].map((bar) => (
      <rect
        key={bar}
        x={bar * 6.5}
        y={10 - bar * 5}
        width="5"
        height={6 + bar * 5}
        fillOpacity={bar < FILLED_BARS[level] ? 1 : 0.28}
      />
    ))}
  </svg>
);

export const LevelTag: React.FC<{ level: NoticeLevel }> = ({ level }) => {
  const t = useT();
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 h-8 px-2 rounded border border-ink text-secondary font-bold ${TAG_STYLES[level]}`}
    >
      <LevelGlyph level={level} />
      {t(LEVEL_LABELS[level])}
    </span>
  );
};
