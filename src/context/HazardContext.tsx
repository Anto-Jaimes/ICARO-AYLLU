import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from './AppContext';
import { HazardFeed, isSenamhiFresh, loadHazardFeed, NoticeLevel, subscribeToHazardEvents } from '../services/hazardService';
import { formatRelativeTime } from '../utils/time';

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

/** One verdict for the whole app: the first rule that applies wins. Never promises safety. */
export function computeVerdict(
  feed: HazardFeed | null,
  savedAt: string | null,
  hasLocation: boolean,
  isLocating: boolean,
  isOnline: boolean
): SafetyVerdict {
  if (!hasLocation) {
    return isLocating
      ? { tone: 'unknown', title: 'Buscando tu ubicación', line: 'Esto toma unos segundos', action: 'alerts', actionLabel: 'Ver alertas del Perú' }
      : { tone: 'unknown', title: 'No sabemos dónde estás', line: 'Activa tu ubicación para ver tu zona', action: 'locate', actionLabel: 'Activar ubicación' };
  }

  const zone = feed?.zones_here[0];
  if (zone) {
    const level = LEVEL_BY_NUMBER[zone.level];
    const what = zone.kind === 'huaico' ? 'Riesgo de huaico en tu zona' : 'Lluvia intensa en tu zona';
    return { tone: level, title: TITLE_BY_LEVEL[level], line: what, action: 'alerts', actionLabel: 'Mira qué hacer' };
  }

  if (!isOnline || savedAt) {
    const when = savedAt ? formatRelativeTime(savedAt).toLowerCase() : 'sin datos';
    return { tone: 'offline', title: 'Sin internet', line: `Último dato: ${when}`, action: 'alerts', actionLabel: 'Ver lo guardado' };
  }

  if (!feed) {
    return { tone: 'unknown', title: 'Revisando tu zona', line: 'Consultando fuentes oficiales', action: 'alerts', actionLabel: 'Ver alertas' };
  }

  if (!isSenamhiFresh(feed)) {
    const updated = feed.updated_at?.senamhi;
    const line = updated ? `Datos ${formatRelativeTime(updated).toLowerCase()}` : 'Aún no recibimos datos oficiales';
    return { tone: 'unknown', title: 'No sabemos si hay riesgo', line, action: 'alerts', actionLabel: 'Ver alertas' };
  }

  if (feed.notices.some((notice) => SERIOUS_NOTICES.includes(notice.level))) {
    return {
      tone: 'amarillo',
      title: 'Ten cuidado hoy',
      line: `Hay avisos en ${feed.department?.name ?? 'tu zona'}`,
      action: 'alerts',
      actionLabel: 'Ver avisos'
    };
  }

  const checked = feed.updated_at?.senamhi;
  return {
    tone: 'safe',
    title: 'Sin alertas en tu zona',
    line: checked ? `Revisado ${formatRelativeTime(checked).toLowerCase()}` : 'Revisado hoy',
    action: 'alerts',
    actionLabel: 'Ver alertas'
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
    [feed, savedAt, hasLocation, locationStatus, isOnline]
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
