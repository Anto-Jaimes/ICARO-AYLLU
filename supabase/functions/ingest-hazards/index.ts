/**
 * Copies IGP earthquakes into the database. pg_cron calls it every 5 minutes.
 *
 * SENAMHI is not here because it does not answer from this cloud region: its data
 * arrives through scripts/senamhi-relay.ts, which runs from a computer in Peru.
 *
 * JWT verification stays on, so only authenticated callers reach it. MIN_INTERVAL_MS
 * also makes repeated calls do nothing, which protects IGP from our traffic.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { departmentKeyFromReference, quakeTimestamp, type QuakeRow } from './parsers.ts';

const IGP_URL = 'https://ultimosismo.igp.gob.pe';
const SOURCE = 'igp';
const MIN_INTERVAL_MS = 60_000;
// How many of the newest quakes to refresh once the year's history is loaded.
const RECENT_QUAKES = 60;

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false }
});

async function ingestQuakes(): Promise<number> {
  const { data: departments, error: departmentsError } = await supabase
    .from('departments')
    .select('name, source_key');
  if (departmentsError) throw departmentsError;
  const nameByKey = new Map(departments.map((d) => [d.source_key, d.name]));

  const year = new Date().getUTCFullYear();
  const response = await fetch(`${IGP_URL}/api/ultimo-sismo/ajaxb/${year}`, {
    headers: { 'User-Agent': 'ICARO-AYLLU/1.0 (alertas vecinales)' },
    signal: AbortSignal.timeout(30_000)
  });
  if (!response.ok) throw new Error(`IGP respondió ${response.status}`);

  const quakes: QuakeRow[] = await response.json();
  if (!Array.isArray(quakes) || quakes.length === 0) throw new Error('IGP no devolvió sismos');

  const { count, error: countError } = await supabase
    .from('hazard_events')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'IGP');
  if (countError) throw countError;

  const rows = (count ? quakes.slice(-RECENT_QUAKES) : quakes).map((quake) => {
    const key = departmentKeyFromReference(quake.referencia);
    const department = key ? nameByKey.get(key) : undefined;

    return {
      source: 'IGP',
      external_id: quake.codigo,
      kind: 'sismo',
      title: `Sismo de magnitud ${quake.magnitud}`,
      detail: quake.referencia,
      magnitude: Number(quake.magnitud),
      depth_km: quake.profundidad,
      lat: Number(quake.latitud),
      lng: Number(quake.longitud),
      departments: department ? [department] : [],
      occurred_at: quakeTimestamp(quake),
      url: `${IGP_URL}/`
    };
  });

  const { error } = await supabase.from('hazard_events').upsert(rows, { onConflict: 'source,external_id' });
  if (error) throw error;
  return rows.length;
}

Deno.serve(async () => {
  const { data: status } = await supabase
    .from('ingest_status')
    .select('last_attempt_at')
    .eq('source', SOURCE)
    .maybeSingle();

  const elapsed = status?.last_attempt_at ? Date.now() - new Date(status.last_attempt_at).getTime() : Infinity;
  if (elapsed < MIN_INTERVAL_MS) return Response.json({ skipped: true });

  const attemptedAt = new Date().toISOString();
  await supabase.from('ingest_status').upsert({ source: SOURCE, last_attempt_at: attemptedAt });

  try {
    const records = await ingestQuakes();
    await supabase.from('ingest_status').upsert({
      source: SOURCE,
      last_attempt_at: attemptedAt,
      last_success_at: new Date().toISOString(),
      last_error: null,
      records
    });
    return Response.json({ records });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('La ingesta del IGP falló:', message);
    await supabase.from('ingest_status').upsert({ source: SOURCE, last_attempt_at: attemptedAt, last_error: message });
    return Response.json({ error: message }, { status: 500 });
  }
});
