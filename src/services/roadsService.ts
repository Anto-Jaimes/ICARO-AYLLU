/**
 * National roads that are closed or have restricted passage, from the MTC's Centro de Operaciones de
 * Emergencia (the same data as its official map, saecoe.mtc.gob.pe/visor), read from its public map
 * service. Nothing here is written by hand: when the MTC cannot be reached, the last answer is shown
 * with the time it was saved.
 */
import { calculateDistanceMeters } from '../utils/geo';

const MTC_QUERY = 'https://serviciosgeo.mtc.gob.pe/geoservicio/rest/services/emergencia/emergencia2026/MapServer/0/query';
export const MTC_MAP_URL = 'https://saecoe.mtc.gob.pe/visor';
const CACHE_KEY = 'ayllu_roads_v1';

/** Within this distance a road problem counts as "near you". */
export const NEAR_KM = 150;

/** Verified numbers: Policía de Carreteras (110), SUTRAN's free line and its Fiscafono on WhatsApp. */
export const ROAD_CONTACTS = {
  police: '110',
  sutranFree: '080012345',
  sutranFreeLabel: '0800-1-2345',
  fiscafonoWhatsapp: '51999382606',
  fiscafonoLabel: '999 382 606'
};

// An earlier version kept made-up road statuses here; they must not come back from storage.
try {
  localStorage.removeItem('ayllu_sutran_alerts_v1');
} catch {
  // nothing to remove
}

export type RoadStatus = 'closed' | 'restricted';

export interface RoadEvent {
  id: string;
  route: string;
  status: RoadStatus;
  /** What happened, as the MTC names it ("Huaico", "Erosión de plataforma"). */
  cause: string;
  /** Section and kilometre, as the MTC writes them. */
  section: string;
  facts: string;
  latest: string;
  place: string;
  department: string;
  date: string;
  lat: number;
  lng: number;
}

export interface RoadEventNear extends RoadEvent {
  distanceKm: number | null;
}

/** Well-known names for the main national roads; others keep their code. */
const ROUTE_NAMES: Record<string, string> = {
  'PE-1N': 'Panamericana Norte',
  'PE-1S': 'Panamericana Sur',
  'PE-22': 'Carretera Central',
  'PE-3N': 'Longitudinal de la Sierra Norte',
  'PE-3S': 'Longitudinal de la Sierra Sur',
  'PE-5N': 'Longitudinal de la Selva Norte',
  'PE-5S': 'Longitudinal de la Selva Sur'
};

export const routeTitle = (route: string) => (ROUTE_NAMES[route] ? `${route} ${ROUTE_NAMES[route]}` : route);

const sentence = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim().toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

const titleCase = (text: string) =>
  text.toLowerCase().replace(/(^|[\s/-])(\S)/g, (_, space, letter) => space + letter.toUpperCase());

/** "Red Vial Nacional: PE-22, Tramo: X Sector: Y Km 84+200 - Km 86" reads "Tramo X, sector Y, km 84+200 - 86". */
function sectionOf(raw: string): string {
  return raw
    .replace(/^Red Vial Nacional:\s*[^,]+,\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*$/, '')
    .replace(/Km\s*-\s*$/i, '')
    .trim();
}

interface MtcAttributes {
  OBJECTID: number;
  strRuta?: string;
  strEstadoFinal?: string;
  strEstado?: string;
  strEvento?: string;
  strAfectacion?: string;
  strHechos?: string;
  strNovedades?: string;
  strDepartamento?: string;
  strProvincia?: string;
  strDistrito?: string;
  dtFechaEvento?: number;
}

function toEvent(attributes: MtcAttributes, geometry?: { x: number; y: number }): RoadEvent | null {
  const status = (attributes.strEstadoFinal ?? attributes.strEstado ?? '').toUpperCase();
  if (status !== 'INTERRUMPIDO' && status !== 'RESTRINGIDO') return null;
  if (!geometry || !Number.isFinite(geometry.x) || !Number.isFinite(geometry.y)) return null;
  const places = [attributes.strDistrito, attributes.strProvincia, attributes.strDepartamento].filter(Boolean).map((part) => titleCase(part!));
  return {
    id: String(attributes.OBJECTID),
    route: (attributes.strRuta ?? '').trim(),
    status: status === 'INTERRUMPIDO' ? 'closed' : 'restricted',
    cause: sentence(attributes.strEvento ?? ''),
    section: sectionOf(attributes.strAfectacion ?? ''),
    facts: (attributes.strHechos ?? '').replace(/\s+/g, ' ').trim(),
    latest: (attributes.strNovedades ?? '').replace(/\s+/g, ' ').trim(),
    place: [...new Set(places)].join(', '),
    department: titleCase(attributes.strDepartamento ?? ''),
    date: new Date(attributes.dtFechaEvento ?? Date.now()).toISOString(),
    lat: geometry.y,
    lng: geometry.x
  };
}

export interface SavedRoads {
  savedAt: string;
  events: RoadEvent[];
}

export function savedRoads(): SavedRoads | null {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null') as SavedRoads | null;
  } catch {
    return null;
  }
}

export async function fetchRoadEvents(): Promise<SavedRoads> {
  const params = new URLSearchParams({
    // "1=1" makes this server fail; any id above zero means "all of them".
    where: 'OBJECTID>0',
    outFields: 'OBJECTID,strRuta,strEstado,strEstadoFinal,strEvento,strAfectacion,strHechos,strNovedades,strDepartamento,strProvincia,strDistrito,dtFechaEvento',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'json'
  });
  const response = await fetch(`${MTC_QUERY}?${params}`, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`MTC ${response.status}`);
  const json = (await response.json()) as { features?: { attributes: MtcAttributes; geometry?: { x: number; y: number } }[]; error?: unknown };
  if (!Array.isArray(json.features)) throw new Error('MTC sin datos');
  const events = json.features.map((feature) => toEvent(feature.attributes, feature.geometry)).filter((event): event is RoadEvent => event !== null);
  const saved = { savedAt: new Date().toISOString(), events };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(saved));
  } catch {
    // shown anyway; only the copy for later is lost
  }
  return saved;
}

/** Closed roads first, then the nearest (or the most recent when the place is unknown). */
export function arrangeRoads(events: RoadEvent[], here: { lat: number; lng: number } | null, nearOnly: boolean): RoadEventNear[] {
  const withDistance = events.map((event) => ({
    ...event,
    distanceKm: here ? Math.round(calculateDistanceMeters(here.lat, here.lng, event.lat, event.lng) / 1000) : null
  }));
  const shown = nearOnly && here ? withDistance.filter((event) => (event.distanceKm ?? Infinity) <= NEAR_KM) : withDistance;
  return shown.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'closed' ? -1 : 1;
    if (here && a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
    return b.date.localeCompare(a.date);
  });
}
