import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { HazardFeed, isSenamhiFresh, loadHazardFeed, NoticeLevel, subscribeToHazardEvents } from '../services/hazardService';
import { formatRelativeTime } from '../utils/time';
import { useLanguage } from '../i18n/LanguageContext';
import { tr } from '../i18n/translate';

const DEFAULT_DEPARTMENT_ID = '15'; // Lima, until the neighbour is located

export type SafetyTone = 'safe' | NoticeLevel | 'unknown' | 'offline';

export interface SafetyVerdict {
  tone: SafetyTone;
  title: string;
  line: string;
  action: 'alerts' | 'locate';
  actionLabel: string;
}

const LEVEL_BY_NUMBER: Record<number, NoticeLevel> = { 2: 'amarillo', 3: 'naranja', 4: 'rojo' };
const TITLE_BY_LEVEL: Record<NoticeLevel, string> = {
  amarillo: 'Ten cuidado hoy',
  naranja: 'Prepárate',
  rojo: 'Peligro en tu zona'
};
const SERIOUS_NOTICES: NoticeLevel[] = ['naranja', 'rojo'];

/**
 * One verdict for the whole app: the first rule that applies wins. Never promises safety.
 * Its words come out in the chosen language, so the provider computes it again when the language changes.
 */
export function computeVerdict(
  feed: HazardFeed | null,
  savedAt: string | null,
  hasLocation: boolean,
  isLocating: boolean,
  isOnline: boolean
): SafetyVerdict {
  if (!hasLocation) {
    return isLocating
      ? { tone: 'unknown', title: tr('Buscando tu ubicación'), line: tr('Esto toma unos segundos'), action: 'alerts', actionLabel: tr('Ver alertas del Perú') }
      : { tone: 'unknown', title: tr('No sabemos dónde estás'), line: tr('Activa tu ubicación para ver tu zona'), action: 'locate', actionLabel: tr('Activar ubicación') };
  }

  const zone = feed?.zones_here[0];
  if (zone) {
    const level = LEVEL_BY_NUMBER[zone.level];
    const what = zone.kind === 'huaico' ? tr('Riesgo de huaico en tu zona') : tr('Lluvia intensa en tu zona');
    return { tone: level, title: tr(TITLE_BY_LEVEL[level]), line: what, action: 'alerts', actionLabel: tr('Mira qué hacer') };
  }

  if (!isOnline || savedAt) {
    const line = savedAt ? tr('Último dato: {time}', { time: formatRelativeTime(savedAt).toLowerCase() }) : tr('Último dato: sin datos');
    return { tone: 'offline', title: tr('Sin internet'), line, action: 'alerts', actionLabel: tr('Ver lo guardado') };
  }

  if (!feed) {
    return { tone: 'unknown', title: tr('Revisando tu zona'), line: tr('Consultando fuentes oficiales'), action: 'alerts', actionLabel: tr('Ver alertas') };
  }

  if (!isSenamhiFresh(feed)) {
    const updated = feed.updated_at?.senamhi;
    const line = updated ? tr('Datos {time}', { time: formatRelativeTime(updated).toLowerCase() }) : tr('Aún no recibimos datos oficiales');
    return { tone: 'unknown', title: tr('No sabemos si hay riesgo'), line, action: 'alerts', actionLabel: tr('Ver alertas') };
  }

  if (feed.notices.some((notice) => SERIOUS_NOTICES.includes(notice.level))) {
    const place = feed.department?.name;
    return {
      tone: 'amarillo',
      title: tr('Ten cuidado hoy'),
      line: place ? tr('Hay avisos en {place}', { place }) : tr('Hay avisos en tu zona'),
      action: 'alerts',
      actionLabel: tr('Ver avisos')
    };
  }

  const checked = feed.updated_at?.senamhi;
  return {
    tone: 'safe',
    title: tr('Sin alertas en tu zona'),
    line: checked ? tr('Revisado {time}', { time: formatRelativeTime(checked).toLowerCase() }) : tr('Revisado hoy'),
    action: 'alerts',
    actionLabel: tr('Ver alertas')
  };
}

interface HazardContextType {
  feed: HazardFeed | null;
  savedAt: string | null;
  isLoading: boolean;
  verdict: SafetyVerdict;
  reload: () => void;
}

const HazardContext = createContext<HazardContextType | undefined>(undefined);

export const HazardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { userLocation, hasLocation, locationStatus, isOnline } = useApp();
  // This provider sits above the screens that start over on a new language; the verdict follows it here.
  const { lang } = useLanguage();
  const [feed, setFeed] = useState<HazardFeed | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const latestLoad = useRef(0);

  const reload = useCallback(async () => {
    const loadId = ++latestLoad.current;
    setIsLoading(true);
    const result = await loadHazardFeed(
      hasLocation ? userLocation.lat : null,
      hasLocation ? userLocation.lng : null,
      hasLocation ? null : DEFAULT_DEPARTMENT_ID
    );
    // A slower, older answer must not replace the area now on screen.
    if (loadId !== latestLoad.current) return;

    setFeed(result?.feed ?? null);
    setSavedAt(result?.savedAt ?? null);
    setIsLoading(false);
  }, [hasLocation, userLocation.lat, userLocation.lng]);

  useEffect(() => {
    reload();
    return subscribeToHazardEvents(reload);
  }, [reload]);

  // Coming back online must replace saved data right away.
  useEffect(() => {
    if (isOnline) reload();
  }, [isOnline, reload]);

  const verdict = useMemo(
    () => computeVerdict(feed, savedAt, hasLocation, locationStatus === 'locating', isOnline),
    // lang: the verdict's words are in the chosen language (tr reads it).
    [feed, savedAt, hasLocation, locationStatus, isOnline, lang]
  );

  return (
    <HazardContext.Provider value={{ feed, savedAt, isLoading, verdict, reload }}>
      {children}
    </HazardContext.Provider>
  );
};

export const useHazards = () => {
  const context = useContext(HazardContext);
  if (!context) throw new Error('useHazards must be used within a HazardProvider');
  return context;
};
