/**
 * Copies SENAMHI data into the database. It runs from a computer in Peru because
 * SENAMHI does not answer from the cloud region where the Edge Functions live.
 *
 *   npm run relay            keeps running, refreshes every 30 minutes
 *   npm run relay -- --once  refreshes once and exits
 *
 * Needs .env.relay (ignored by git) with SUPABASE_SECRET_KEY. If this stops running the
 * app says so instead of showing old warnings as if they were current.
 */

import { createClient } from '@supabase/supabase-js';
import {
  departmentsForNotice,
  parseNoticeSummaries,
  parseNoticeTable,
  type DepartmentRef
} from '../supabase/functions/ingest-hazards/parsers.ts';

const SOURCE = 'senamhi';
const REFRESH_MS = 30 * 60_000;
const SENAMHI_URL = 'https://www.senamhi.gob.pe';
const GEOSERVER_URL = 'https://idesep.senamhi.gob.pe/geoserver';
const ZONE_BATCH_SIZE = 200;
const RAIN_BATCH_SIZE = 2; // few features, but each one is a huge polygon

process.loadEnvFile('.env.local');
process.loadEnvFile('.env.relay');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) {
  throw new Error('Falta VITE_SUPABASE_URL en .env.local o SUPABASE_SECRET_KEY en .env.relay');
}

const supabase = createClient(supabaseUrl, secretKey, { auth: { persistSession: false } });

async function download(url: string): Promise<Response> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'ICARO-AYLLU/1.0 (alertas vecinales)' },
    signal: AbortSignal.timeout(60_000)
  });
  if (!response.ok) throw new Error(`${url} respondió ${response.status}`);
  return response;
}

function wfsUrl(workspace: string, layer: string): string {
  return `${GEOSERVER_URL}/${workspace}/ows?service=WFS&version=1.0.0&request=GetFeature` +
    `&typeName=${workspace}:${layer}&outputFormat=application/json`;
}

async function ingestNotices(): Promise<number> {
  const { data, error: departmentsError } = await supabase
    .from('departments')
    .select('name, source_key, macro_regions');
  if (departmentsError) throw departmentsError;
  const departments: DepartmentRef[] = data;

  const notices = parseNoticeTable(await (await download(`${SENAMHI_URL}/?p=aviso-meteorologico`)).text());
  if (notices.length === 0) throw new Error('No se pudo leer la tabla de avisos de SENAMHI');

  // All active notices share one page, so any of their links brings every summary.
  const summaries = parseNoticeSummaries(await (await download(notices[0].url)).text());

  const rows = notices.map((notice) => {
    const summary = summaries.get(notice.number);
    return {
      source: 'SENAMHI',
      external_id: `${notice.year}-${notice.number}`,
      kind: 'aviso_meteorologico',
      title: notice.title,
      detail: summary ?? null,
      level: notice.level,
      departments: departmentsForNotice(notice.title, summary, departments),
      occurred_at: `${notice.issuedOn}T12:00:00-05:00`,
      starts_at: `${notice.startsOn}T00:00:00-05:00`,
      ends_at: `${notice.endsOn}T23:59:00-05:00`,
      url: notice.url
    };
  });

  const { error } = await supabase.from('hazard_events').upsert(rows, { onConflict: 'source,external_id' });
  if (error) throw error;
  return rows.length;
}

/** Replaces one kind of polygon, but only when SENAMHI has published a newer bulletin. */
async function ingestZones(kind: string, workspace: string, layer: string, batchSize: number): Promise<number> {
  const collection = await (await download(wfsUrl(workspace, layer))).json();
  const features: { properties: { fecha?: string } }[] = collection.features;
  if (features.length === 0) return 0;

  const issuedOn = features[0].properties.fecha?.slice(0, 10);
  const { data: current, error: currentError } = await supabase
    .from('hazard_zones')
    .select('issued_on')
    .eq('kind', kind)
    .order('issued_on', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (currentError) throw currentError;
  if (current?.issued_on === issuedOn) return 0;

  const batchId = crypto.randomUUID();
  let inserted = 0;
  for (let start = 0; start < features.length; start += batchSize) {
    const { data, error } = await supabase.rpc('insert_hazard_zones', {
      p_kind: kind,
      p_batch_id: batchId,
      p_features: features.slice(start, start + batchSize)
    });
    if (error) throw error;
    inserted += data;
  }

  // Only now that the new bulletin is complete: neighbours never see an empty map.
  const { error } = await supabase.from('hazard_zones').delete().eq('kind', kind).neq('batch_id', batchId);
  if (error) throw error;
  return inserted;
}

async function refresh(): Promise<void> {
  const attemptedAt = new Date().toISOString();
  try {
    const notices = await ingestNotices();
    const huaicos = await ingestZones('huaico', 'g_acti_quebrada', 'view_av_activ_qdra', ZONE_BATCH_SIZE);
    const rain = await ingestZones('lluvia_intensa', 'g_prono_pp_24h', 'view_aviso24h', RAIN_BATCH_SIZE);

    await supabase.from('ingest_status').upsert({
      source: SOURCE,
      last_attempt_at: attemptedAt,
      last_success_at: new Date().toISOString(),
      last_error: null,
      records: notices + huaicos + rain
    });
    console.log(`[${new Date().toLocaleTimeString('es-PE')}] ${notices} avisos, ${huaicos} zonas de huaico, ${rain} zonas de lluvia nuevas`);
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error(`[${new Date().toLocaleTimeString('es-PE')}] Falló:`, message);
    await supabase.from('ingest_status').upsert({ source: SOURCE, last_attempt_at: attemptedAt, last_error: message });
    if (process.argv.includes('--once')) process.exitCode = 1;
  }
}

await refresh();
if (!process.argv.includes('--once')) {
  console.log('Relevo activo: deja esta ventana abierta. Ctrl+C para detenerlo.');
  setInterval(refresh, REFRESH_MS);
}
