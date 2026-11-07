/**
 * Loads Peru's police stations, fire stations and hospitals from OpenStreetMap into
 * public.emergency_places, so the app can show the nearest ones. Run it again to refresh:
 *
 *   node scripts/import-emergency-places.ts
 *
 * Needs .env (VITE_SUPABASE_URL) and .env.relay (SUPABASE_SECRET_KEY). Data © OpenStreetMap
 * contributors, under the ODbL: the app shows that credit next to it.
 *
 * The public servers refuse one query for the whole country, so Peru is read in squares of 1.5
 * degrees: only the 72 that touch Peru's official boundaries (worked out once with PostGIS from
 * public.departments). Each square is saved as soon as it arrives. Border squares bring places
 * from neighbouring countries; the database keeps only those inside Peru.
 */
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

for (const file of ['.env', '.env.local', '.env.relay']) if (existsSync(file)) process.loadEnvFile(file);
const db = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });

const MAIN_SERVER = 'https://overpass-api.de/api/interpreter';
const SPARE_SERVER = 'https://overpass.private.coffee/api/interpreter';
const SIZE = 1.5;
const AT_ONCE = 2;
const KINDS = ['police', 'fire_station', 'hospital'];

// [south, west] of each square that touches Peru.
const SQUARES: [number, number][] = [
  [-18.5, -72.5], [-18.5, -71.0], [-18.5, -69.5], [-17.0, -75.5], [-17.0, -74.0], [-17.0, -72.5], [-17.0, -71.0], [-17.0, -69.5],
  [-15.5, -77.0], [-15.5, -75.5], [-15.5, -74.0], [-15.5, -72.5], [-15.5, -71.0], [-15.5, -69.5], [-14.0, -77.0], [-14.0, -75.5],
  [-14.0, -74.0], [-14.0, -72.5], [-14.0, -71.0], [-14.0, -69.5], [-12.5, -78.5], [-12.5, -77.0], [-12.5, -75.5], [-12.5, -74.0],
  [-12.5, -72.5], [-12.5, -71.0], [-12.5, -69.5], [-11.0, -78.5], [-11.0, -77.0], [-11.0, -75.5], [-11.0, -74.0], [-11.0, -72.5],
  [-11.0, -71.0], [-9.5, -80.0], [-9.5, -78.5], [-9.5, -77.0], [-9.5, -75.5], [-9.5, -74.0], [-9.5, -72.5], [-9.5, -71.0],
  [-8.0, -81.5], [-8.0, -80.0], [-8.0, -78.5], [-8.0, -77.0], [-8.0, -75.5], [-8.0, -74.0], [-6.5, -81.5], [-6.5, -80.0],
  [-6.5, -78.5], [-6.5, -77.0], [-6.5, -75.5], [-6.5, -74.0], [-5.0, -81.5], [-5.0, -80.0], [-5.0, -78.5], [-5.0, -77.0],
  [-5.0, -75.5], [-5.0, -74.0], [-5.0, -72.5], [-5.0, -71.0], [-3.5, -81.5], [-3.5, -78.5], [-3.5, -77.0], [-3.5, -75.5],
  [-3.5, -74.0], [-3.5, -72.5], [-3.5, -71.0], [-2.0, -77.0], [-2.0, -75.5], [-2.0, -74.0], [-0.5, -77.0], [-0.5, -75.5]
];

interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** The first phone written, as it appears in OpenStreetMap. */
function firstPhone(tags: Record<string, string>): string | null {
  const raw = tags.phone ?? tags['contact:phone'] ?? tags['emergency:phone'] ?? null;
  const first = raw?.split(/[;,/]/)[0]?.trim();
  return first && first.replace(/\D/g, '').length >= 6 ? first.slice(0, 80) : null;
}

async function readSquare(south: number, west: number): Promise<OsmElement[]> {
  const box = `${south},${west},${south + SIZE},${west + SIZE}`;
  const query = `[out:json][timeout:110];nwr[amenity~"^(police|fire_station|hospital)$"](${box});out center tags;`;
  // The main server is slow but works; the spare is tried only after it fails several times.
  const servers = [MAIN_SERVER, MAIN_SERVER, MAIN_SERVER, SPARE_SERVER, MAIN_SERVER];
  for (const [attempt, url] of servers.entries()) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AYLLU (hackathon UTP)' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(120_000)
      });
      if (response.ok) return ((await response.json()) as { elements: OsmElement[] }).elements;
    } catch {
      // tried again below
    }
    await wait(5_000 * (attempt + 1));
  }
  throw new Error(`No se pudo leer el cuadro ${box}`);
}

function toRow(element: OsmElement, importedAt: string) {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (lat === undefined || lng === undefined || !KINDS.includes(tags.amenity)) return null;
  return {
    osm_id: `${element.type}/${element.id}`,
    kind: tags.amenity,
    name: (tags.name ?? tags.official_name ?? null)?.slice(0, 160) ?? null,
    phone: firstPhone(tags),
    lat,
    lng,
    updated_at: importedAt
  };
}

// Squares that failed can be read again alone: node scripts/import-emergency-places.ts -12.5,-75.5 -5,-75.5
const chosen = process.argv.slice(2).map((arg) => arg.split(',').map(Number) as [number, number]);
const isPartial = chosen.length > 0;

const startedAt = new Date().toISOString();
let done = 0;
let failed = 0;
const queue = isPartial ? chosen : [...SQUARES];
const total = queue.length;
console.log(`Leyendo ${total} cuadros del Perú desde OpenStreetMap, de ${AT_ONCE} en ${AT_ONCE}...`);

async function worker(): Promise<void> {
  for (let square = queue.shift(); square; square = queue.shift()) {
    try {
      const rows = (await readSquare(square[0], square[1])).map((element) => toRow(element, startedAt)).filter((row) => row !== null);
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await db.from('emergency_places').upsert(rows.slice(i, i + 500));
        if (error) throw new Error(error.message);
      }
      done++;
      console.log(`  ${done + failed} de ${total}: cuadro ${square.join(', ')} con ${rows.length} lugares`);
    } catch (err) {
      failed++;
      console.log(`  ${done + failed} de ${total}: cuadro ${square.join(', ')} falló (${(err as Error).message})`);
    }
    await wait(1_000);
  }
}

await Promise.all(Array.from({ length: AT_ONCE }, worker));

// Only a complete reading of all squares may remove what is no longer on the map; everything outside Peru goes always.
if (failed === 0 && !isPartial) {
  const { error } = await db.from('emergency_places').delete().lt('updated_at', startedAt);
  if (error) throw new Error(`No se pudo limpiar: ${error.message}`);
}
const { data: outside, error: pruneError } = await db.rpc('prune_emergency_places');
if (pruneError) throw new Error(`No se pudo quitar lo de fuera del Perú: ${pruneError.message}`);

// Counted in the database: reading the rows would stop at the API's limit of 1000.
async function count(kind: string, needPhone = false): Promise<number> {
  let query = db.from('emergency_places').select('osm_id', { count: 'exact', head: true }).eq('kind', kind);
  if (needPhone) query = query.not('phone', 'is', null);
  return (await query).count ?? 0;
}
console.log(`Fuera del Perú y descartados: ${outside}. Cuadros que fallaron: ${failed}.`);
console.log(`Listo: ${await count('police')} comisarías (${await count('police', true)} con teléfono), ${await count('fire_station')} bomberos (${await count('fire_station', true)}), ${await count('hospital')} hospitales (${await count('hospital', true)}).`);
