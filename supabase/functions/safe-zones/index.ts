/**
 * Open places to gather after an earthquake near a point: assembly points marked on the map, parks,
 * sports pitches and squares (© OpenStreetMap contributors, ODbL). Not an official INDECI list.
 *
 * The public Overpass servers refuse requests that come from browsers, so the app asks here. Each
 * neighbourhood (a 0.01 degree tile) is kept for 30 days in safe_zone_tiles: the next neighbour there
 * gets it at once. JWT verification stays on, like the other functions.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false }
});

// Public servers are often busy or limit how often they answer: all are asked at once, the first good answer wins.
const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];
const FRESH_DAYS = 30;
const RADIUS_M = 1500;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

type Kind = 'assembly' | 'park' | 'pitch' | 'square';
interface Zone { id: string; name: string | null; kind: Kind; lat: number; lng: number }
interface OsmElement { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }

function kindOf(tags: Record<string, string>): Kind | null {
  if (tags.emergency === 'assembly_point') return 'assembly';
  if (tags.leisure === 'park') return 'park';
  // Only open-air courts: a gym or a covered court is no place to gather after an earthquake.
  if (tags.leisure === 'pitch' && tags.indoor !== 'yes' && tags.covered !== 'yes') return 'pitch';
  if (tags.place === 'square') return 'square';
  return null;
}

async function askOne(url: string, query: string): Promise<Zone[]> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'AYLLU (hackathon UTP, alertas vecinales)' },
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(55_000)
  });
  if (!response.ok) throw new Error(`${url} ${response.status}`);
  const elements = ((await response.json()) as { elements?: OsmElement[] }).elements;
  if (!Array.isArray(elements)) throw new Error(`${url} sin datos`);
  const zones: Zone[] = [];
  for (const element of elements) {
    const tags = element.tags ?? {};
    const kind = kindOf(tags);
    const zoneLat = element.lat ?? element.center?.lat;
    const zoneLng = element.lon ?? element.center?.lon;
    if (kind && zoneLat !== undefined && zoneLng !== undefined) {
      zones.push({ id: `${element.type}/${element.id}`, name: tags.name ?? null, kind, lat: zoneLat, lng: zoneLng });
    }
  }
  return zones;
}

function askOverpass(lat: number, lng: number): Promise<Zone[]> {
  const around = `(around:${RADIUS_M},${lat},${lng})`;
  const query = `[out:json][timeout:50];(nwr["emergency"="assembly_point"]${around};nwr["leisure"~"^(park|pitch)$"]${around};nwr["place"="square"]${around};);out center 600;`;
  return Promise.any(SERVERS.map((url) => askOne(url, query))).catch(() => {
    throw new Error('Overpass no respondió');
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return reply({ error: 'method' }, 405);
  let body: { lat?: unknown; lng?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // checked below
  }
  const lat = Number(body.lat);
  const lng = Number(body.lng);
  // Peru and a margin around it: this is not a free map service for the world.
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -19 || lat > 0.5 || lng < -82 || lng > -68) {
    return reply({ error: 'place' }, 400);
  }

  const tileLat = Math.round(lat * 100) / 100;
  const tileLng = Math.round(lng * 100) / 100;
  const tile = `${tileLat.toFixed(2)},${tileLng.toFixed(2)}`;

  const { data: cached } = await admin.from('safe_zone_tiles').select('zones, fetched_at').eq('tile', tile).maybeSingle();
  if (cached && Date.now() - new Date(cached.fetched_at).getTime() < FRESH_DAYS * 86_400_000) {
    return reply({ zones: cached.zones, cached: true });
  }

  try {
    const zones = await askOverpass(tileLat, tileLng);
    await admin.from('safe_zone_tiles').upsert({ tile, zones, fetched_at: new Date().toISOString() });
    return reply({ zones, cached: false });
  } catch (error) {
    // An old copy is better than nothing when Overpass is busy.
    if (cached) return reply({ zones: cached.zones, cached: true, stale: true });
    return reply({ error: error instanceof Error ? error.message : 'error' }, 503);
  }
});
