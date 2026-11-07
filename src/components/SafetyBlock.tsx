import React from 'react';
import { CircleCheck, CircleHelp, CloudOff, MapPin, TriangleAlert, type LucideIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SafetyTone, useHazards } from '../context/HazardContext';
import { LevelGlyph } from './LevelTag';
import { HelpButton } from './TopBar';

interface ToneStyle {
  field: string;
  link: string;
  icon: LucideIcon;
}

// Every state pairs its colour with an icon and words: colour alone says nothing to some eyes.
export const TONE_STYLES: Record<SafetyTone, ToneStyle> = {
  safe: { field: 'bg-verde text-white', link: 'text-white', icon: CircleCheck },
  amarillo: { field: 'bg-amarillo text-ink', link: 'text-ink', icon: TriangleAlert },
  naranja: { field: 'bg-naranja text-ink', link: 'text-ink', icon: TriangleAlert },
  rojo: { field: 'bg-rojo text-white', link: 'text-white', icon: TriangleAlert },
  unknown: { field: 'bg-unknown text-white', link: 'text-white', icon: CircleHelp },
  offline: { field: 'bg-offline text-white', link: 'text-white', icon: CloudOff }
};

const LEVEL_NAMES: Partial<Record<SafetyTone, string>> = {
  amarillo: 'Nivel amarillo',
  naranja: 'Nivel naranja',
  rojo: 'Nivel rojo'
};

/** The hillside: a colour field that gives one verdict and ends on terraces. */
export const SafetyBlock: React.FC = () => {
  const { userLocation, hasLocation, requestCurrentGPS, setIsAlertsOpen } = useApp();
  const { verdict, feed } = useHazards();
  const tone = TONE_STYLES[verdict.tone];
  const Icon = tone.icon;
  const levelName = LEVEL_NAMES[verdict.tone];
  const place = hasLocation ? userLocation.name : feed?.department?.name ?? 'Perú';

  return (
    <section
      aria-labelledby="verdict-title"
      className={`relative ${tone.field}`}
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div className="flex items-center h-14 pl-2 pr-1">
        <button
          type="button"
          onClick={() => setIsAlertsOpen(true)}
          className="flex items-center gap-1.5 min-w-0 flex-1 min-h-12 px-2 rounded-lg text-left"
        >
          <MapPin className="w-5 h-5 shrink-0" aria-hidden="true" />
          <span className="truncate text-secondary font-medium">{place}</span>
        </button>
        <HelpButton />
      </div>

      <div
        className="px-4 pb-11"
        role={verdict.tone === 'rojo' ? 'alert' : 'status'}
      >
        {levelName ? (
          <p className="flex items-center gap-2 text-row font-bold">
            <LevelGlyph level={verdict.tone as 'amarillo' | 'naranja' | 'rojo'} />
            <span>{levelName}</span>
          </p>
        ) : (
          <Icon className="w-8 h-8" aria-hidden="true" />
        )}

        <h1 id="verdict-title" className="mt-1 text-sign font-bold">
          {verdict.title}
        </h1>
        <p className="mt-1 text-secondary">{verdict.line}</p>

        <button
          type="button"
          onClick={() => (verdict.action === 'locate' ? requestCurrentGPS() : setIsAlertsOpen(true))}
          className={`mt-1 min-h-12 text-secondary font-bold underline underline-offset-4 ${tone.link}`}
        >
          {verdict.actionLabel}
        </button>
      </div>

      <svg
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 w-full h-9 block"
        viewBox="0 0 100 36"
        preserveAspectRatio="none"
      >
        <path d="M0 36H52V24H68V12H84V0H100V36Z" fill="var(--color-surface)" />
      </svg>
    </section>
  );
};
