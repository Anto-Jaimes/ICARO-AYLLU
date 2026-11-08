import { COLORS } from '../theme/colors';
/**
 * Triage START (Simple Triage and Rapid Treatment) Storage & Tactical Dispatch
 * Standard international protocol for disaster victim classification.
 */

export type TriageTag = 'ROJO' | 'AMARILLO' | 'VERDE' | 'NEGRO';

export interface TriageVictim {
  id: string;
  tag: TriageTag;
  identifier: string; // Nombre o descripción física
  locationNote: string; // Dirección o referencia en los escombros
  injuries: string; // Descripción de heridas o síntomas
  canWalk: boolean;
  breathing: 'normal' | 'rapida' | 'nula';
  pulse: 'radial_presente' | 'radial_ausente';
  mentalState: 'obedece' | 'confuso_inconsciente';
  coords?: [number, number]; // [lat, lng]
  createdAt: string;
  status: 'esperando' | 'atendido' | 'evacuado';
}

const STORAGE_KEY = 'ayllu_triage_victims_v1';

export const TRIAGE_CONFIG: Record<
  TriageTag,
  {
    label: string;
    priority: string;
    color: string;
    bg: string;
    border: string;
    text: string;
    /** The label: colour plus words, dark text on yellow. */
    badge: string;
    dot: string;
    nativeColor: { qu: string; 'qu-cen': string; ay: string; cni: string; es: string };
  }
> = {
  ROJO: {
    label: 'Prioridad I - Inmediato',
    priority: 'Atención y evacuación urgente vital',
    color: COLORS.statusDanger,
    bg: 'bg-surface',
    border: 'border-2 border-status-danger',
    text: 'text-status-danger',
    badge: 'badge-danger',
    dot: 'bg-status-danger',
    nativeColor: { es: 'Rojo', qu: 'Puka', 'qu-cen': 'Puka', ay: 'Wila', cni: 'Katsinkari Puka' }
  },
  AMARILLO: {
    label: 'Prioridad II - Retardado',
    priority: 'Lesiones graves, no corre peligro inminente',
    color: COLORS.statusWarning,
    bg: 'bg-surface',
    border: 'border-2 border-status-warning',
    text: 'text-ink',
    badge: 'badge-warning',
    dot: 'bg-status-warning',
    nativeColor: { es: 'Amarillo', qu: "Q'ellu", 'qu-cen': "Q'ellu / Qarwa", ay: "Q'illu", cni: 'Kiteri' }
  },
  VERDE: {
    label: 'Prioridad III - Leve',
    priority: 'Camina por sus propios medios, lesiones leves',
    color: COLORS.statusSafe,
    bg: 'bg-surface',
    border: 'border-2 border-status-safe',
    text: 'text-status-safe',
    badge: 'badge-safe',
    dot: 'bg-status-safe',
    nativeColor: { es: 'Verde', qu: "Q'omer", 'qu-cen': "Q'omer / Tsiqya", ay: "Ch'uxña", cni: 'Chekatsirori' }
  },
  NEGRO: {
    label: 'Prioridad 0 - Fallecido / Agónico',
    priority: 'Sin respiración tras abrir vía aérea',
    color: COLORS.triageBlack,
    bg: 'bg-surface',
    border: 'border-2 border-triage-black',
    text: 'text-triage-black',
    badge: 'badge-triage-black',
    dot: 'bg-triage-black',
    nativeColor: { es: 'Negro', qu: 'Yana', 'qu-cen': 'Yana', ay: "Ch'iyara", cni: 'Kisaari' }
  }
};

export function getTriageVictims(): TriageVictim[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTriageVictim(victim: TriageVictim): void {
  const current = getTriageVictims();
  const updated = [victim, ...current.filter((v) => v.id !== victim.id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving triage victim', err);
  }
}

export function updateVictimStatus(id: string, status: TriageVictim['status']): void {
  const current = getTriageVictims();
  const updated = current.map((v) => (v.id === id ? { ...v, status } : v));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error updating triage victim status', err);
  }
}

export function deleteTriageVictim(id: string): void {
  const current = getTriageVictims();
  const updated = current.filter((v) => v.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error deleting triage victim', err);
  }
}

/** Algoritmo START oficial */
export function calculateStartTag(
  canWalk: boolean,
  breathing: 'normal' | 'rapida' | 'nula',
  pulse: 'radial_presente' | 'radial_ausente',
  mentalState: 'obedece' | 'confuso_inconsciente'
): TriageTag {
  // 1. ¿Camina?
  if (canWalk) {
    return 'VERDE';
  }
  // 2. Respiración
  if (breathing === 'nula') {
    return 'NEGRO';
  }
  if (breathing === 'rapida') {
    return 'ROJO';
  }
  // 3. Circulación (Pulso radial / Relleno capilar)
  if (pulse === 'radial_ausente') {
    return 'ROJO';
  }
  // 4. Estado mental
  if (mentalState === 'confuso_inconsciente') {
    return 'ROJO';
  }
  // Si no camina pero respira normal, pulso presente y obedece órdenes simples:
  return 'AMARILLO';
}

/** Payload ultra-compacto para código QR compatible con Bomberos 116 y SAMU */
export function buildTacticalQRPayload(victims: TriageVictim[]): string {
  const counts = { ROJO: 0, AMARILLO: 0, VERDE: 0, NEGRO: 0 };
  victims.forEach((v) => {
    counts[v.tag]++;
  });

  const summary = `AYLLU-START|T:${victims.length}|R:${counts.ROJO}|A:${counts.AMARILLO}|V:${counts.VERDE}|N:${counts.NEGRO}`;
  const victimLines = victims.slice(0, 15).map((v, i) => {
    const lat = v.coords ? v.coords[0].toFixed(5) : '0';
    const lng = v.coords ? v.coords[1].toFixed(5) : '0';
    return `${i + 1}:${v.tag[0]}|${v.identifier.slice(0, 15)}|${v.locationNote.slice(0, 20)}|${lat},${lng}|${v.status[0]}`;
  });

  return `${summary}\n${victimLines.join('\n')}`;
}

/** Exportación GeoJSON para brigadas de rescate con GPS o sistemas GIS */
export function generateTriageGeoJSON(victims: TriageVictim[]): string {
  const features = victims
    .filter((v) => v.coords)
    .map((v) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [v.coords![1], v.coords![0]]
      },
      properties: {
        id: v.id,
        tag: v.tag,
        identifier: v.identifier,
        locationNote: v.locationNote,
        injuries: v.injuries,
        status: v.status,
        createdAt: v.createdAt
      }
    }));

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      name: 'AYLLU_Triage_START_Export',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features
    },
    null,
    2
  );
}
