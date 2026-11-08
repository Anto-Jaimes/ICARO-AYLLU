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

export const TRIAGE_CONFIG: Record<TriageTag, { label: string; priority: string; color: string; bg: string; border: string; text: string }> = {
  ROJO: {
    label: 'Prioridad I - Inmediato',
    priority: 'Atención y evacuación urgente vital',
    color: '#dc2626',
    bg: 'bg-red-950/40',
    border: 'border-red-600',
    text: 'text-red-400'
  },
  AMARILLO: {
    label: 'Prioridad II - Retardado',
    priority: 'Lesiones graves, no corre peligro inminente',
    color: '#d97706',
    bg: 'bg-amber-950/40',
    border: 'border-amber-500',
    text: 'text-amber-400'
  },
  VERDE: {
    label: 'Prioridad III - Leve',
    priority: 'Camina por sus propios medios, lesiones leves',
    color: '#16a34a',
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-600',
    text: 'text-emerald-400'
  },
  NEGRO: {
    label: 'Prioridad 0 - Fallecido / Agónico',
    priority: 'Sin respiración tras abrir vía aérea',
    color: '#525252',
    bg: 'bg-neutral-900',
    border: 'border-neutral-600',
    text: 'text-neutral-400'
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

export function saveTriageVictim(victim: TriageVictim): TriageVictim[] {
  const current = getTriageVictims();
  const existingIdx = current.findIndex((v) => v.id === victim.id);
  let updated: TriageVictim[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = victim;
  } else {
    updated = [victim, ...current];
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save triage victim', e);
  }
  return updated;
}

export function updateVictimStatus(id: string, status: TriageVictim['status']): TriageVictim[] {
  const current = getTriageVictims();
  const updated = current.map((v) => (v.id === id ? { ...v, status } : v));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to update victim status', e);
  }
  return updated;
}

export function deleteTriageVictim(id: string): TriageVictim[] {
  const current = getTriageVictims();
  const updated = current.filter((v) => v.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete victim', e);
  }
  return updated;
}

/**
 * START Algorithm Rule:
 * 1. Can walk? -> VERDE
 * 2. Breathing? No -> Open airway -> Still no? -> NEGRO
 * 3. Breathing? > 30/min or rapid? -> ROJO
 * 4. Perfusion: Radial pulse absent? -> ROJO
 * 5. Mental Status: Doesn't obey simple commands? -> ROJO
 * 6. Otherwise -> AMARILLO
 */
export function calculateStartTag(answers: {
  canWalk: boolean;
  breathing: 'normal' | 'rapida' | 'nula';
  pulse: 'radial_presente' | 'radial_ausente';
  mentalState: 'obedece' | 'confuso_inconsciente';
}): TriageTag {
  if (answers.canWalk) return 'VERDE';
  if (answers.breathing === 'nula') return 'NEGRO';
  if (answers.breathing === 'rapida') return 'ROJO';
  if (answers.pulse === 'radial_ausente') return 'ROJO';
  if (answers.mentalState === 'confuso_inconsciente') return 'ROJO';
  return 'AMARILLO';
}

/**
 * Builds compact tactical JSON/string payload for QR code scanning by CGBVP Bomberos 116 / SAMU 106
 */
export function buildTacticalQRPayload(victims: TriageVictim[], centerCoords?: [number, number]): string {
  const counts = {
    R: victims.filter((v) => v.tag === 'ROJO' && v.status !== 'evacuado').length,
    A: victims.filter((v) => v.tag === 'AMARILLO' && v.status !== 'evacuado').length,
    V: victims.filter((v) => v.tag === 'VERDE' && v.status !== 'evacuado').length,
    N: victims.filter((v) => v.tag === 'NEGRO').length
  };

  // Compact payload to fit easily in standard QR versions:
  const compactVictims = victims.slice(0, 10).map((v) => ({
    t: v.tag[0], // R, A, V, N
    id: v.identifier.slice(0, 30),
    loc: v.locationNote.slice(0, 30),
    inj: v.injuries.slice(0, 40),
    c: v.coords ? [Number(v.coords[0].toFixed(5)), Number(v.coords[1].toFixed(5))] : undefined
  }));

  const payload = {
    src: 'ICARO-AYLLU-START',
    ts: new Date().toISOString().slice(0, 19),
    gps: centerCoords ? [Number(centerCoords[0].toFixed(5)), Number(centerCoords[1].toFixed(5))] : undefined,
    summary: counts,
    vics: compactVictims
  };

  return JSON.stringify(payload);
}

/**
 * Generates GeoJSON FeatureCollection ready for download and import into QGIS, Google Earth, ATAK
 */
export function generateTriageGeoJSON(victims: TriageVictim[]): string {
  const features = victims.map((v) => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: v.coords ? [v.coords[1], v.coords[0]] : [0, 0]
    },
    properties: {
      id: v.id,
      tag: v.tag,
      priority: TRIAGE_CONFIG[v.tag].label,
      identifier: v.identifier,
      location: v.locationNote,
      injuries: v.injuries,
      status: v.status,
      timestamp: v.createdAt
    }
  }));

  return JSON.stringify(
    {
      type: 'FeatureCollection',
      name: 'PADRON_TRIAGE_EMERGENCIA_AYLLU',
      features
    },
    null,
    2
  );
}
