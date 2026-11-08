/**
 * Sends the phone notifications through Firebase Cloud Messaging. pg_cron calls it every minute.
 *
 * The database decides who gets what (queue_hazard_pushes and the comment trigger fill push_queue);
 * this only writes the words in each phone's language and hands them to Firebase. A phone that no
 * longer exists (app removed) is deleted; a failure is retried up to 3 times.
 *
 * JWT verification stays on, like ingest-hazards. Anyone who calls it can only make it send what is
 * already waiting, and MIN_INTERVAL_MS keeps repeated calls from doing anything.
 *
 * Secret: FIREBASE_SERVICE_ACCOUNT_B64, the Firebase service account JSON in base64.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import { importPKCS8, SignJWT } from 'npm:jose@5.9.6';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false }
});

const SOURCE = 'push';
const MIN_INTERVAL_MS = 20_000;
const BATCH = 300;
const PARALLEL = 20;

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

interface QueuedPush {
  id: number;
  token: string;
  lang: Lang;
  kind: 'quake' | 'tsunami' | 'zone' | 'comment' | 'test';
  params: Record<string, unknown>;
}

type Lang = 'es' | 'en' | 'qu' | 'ay';

// ---------------------------------------------------------------------------
// Words. Quechua and Aymara are a careful draft for a native speaker to check, as in the app.
// ---------------------------------------------------------------------------

const LEVELS: Record<Lang, Record<number, string>> = {
  es: { 3: 'naranja', 4: 'rojo' },
  en: { 3: 'orange', 4: 'red' },
  qu: { 3: "puka q'illu", 4: 'puka' },
  ay: { 3: "wila q'illu", 4: 'wila' }
};

const TEXTS: Record<Lang, Record<string, [string, string]>> = {
  es: {
    quake: ['Sismo de magnitud {magnitude}', '{detail}. Revisa cómo están tu familia y tu casa.'],
    tsunami: ['Posible tsunami (estimado)', 'Sismo de magnitud {magnitude} en el mar. Si estás cerca de la playa, sube ahora a una zona alta. El aviso oficial lo da la DHN.'],
    huaico: ['Riesgo de huaico en tu zona: nivel {level}', 'Aviso de SENAMHI para {place}. Aléjate de quebradas y cauces de ríos.'],
    lluvia_intensa: ['Lluvias intensas en tu zona: nivel {level}', 'Aviso de SENAMHI para {place}. Ten lista tu mochila de emergencia y no cruces ríos.'],
    comment: ['{name} comentó tu noticia', '{body}'],
    test: ['Así te avisará AYLLU', 'Te llegarán avisos de sismos, lluvias y huaicos de tu zona aunque la app esté cerrada.'],
    here: ['tu zona', '']
  },
  en: {
    quake: ['Magnitude {magnitude} earthquake', '{detail}. Check on your family and your home.'],
    tsunami: ['Possible tsunami (estimate)', 'Magnitude {magnitude} earthquake at sea. If you are near the beach, go to high ground now. The official warning comes from the DHN.'],
    huaico: ['Mudslide risk in your area: {level} level', 'SENAMHI warning for {place}. Stay away from ravines and riverbeds.'],
    lluvia_intensa: ['Heavy rain in your area: {level} level', 'SENAMHI warning for {place}. Keep your emergency bag ready and do not cross rivers.'],
    comment: ['{name} commented on your news', '{body}'],
    test: ['This is how AYLLU will alert you', 'You will get alerts about earthquakes, rain and mudslides in your area, even with the app closed.'],
    here: ['your area', '']
  },
  qu: {
    quake: ['{magnitude} sinchiyuq pacha kuyuy', '{detail}. Ayllu masiykita, wasiykitapas qhawariy.'],
    tsunami: ['Tsunami kanmanmi (yuyaykusqa)', 'Qucha ukhupi {magnitude} sinchiyuq pacha kuyuy. Playa qayllapi kaspaqa, kunanpacha hanaq pataman wichay. Chiqap willakuytaqa DHN nisqam qun.'],
    huaico: ['Llaqtaykipi lluqlla manchay: {level} pata', 'SENAMHI willakuy {place}paq. Qaqakunamanta, mayu purinanmantapas karunchakuy.'],
    lluvia_intensa: ['Llaqtaykipi sinchi para: {level} pata', 'SENAMHI willakuy {place}paq. Emergencia q\'ipiykita listota hap\'iy, ama mayuta chimpaychu.'],
    comment: ['{name} willakuyniykipi rimarirqan', '{body}'],
    test: ['Kaynatam AYLLU willasunki', 'Llaqtaykipi pacha kuyuykunamanta, paramanta, lluqllamantapas willakuykuna chayamusunki, app wichq\'asqa kaptinpas.'],
    here: ['llaqtayki', '']
  },
  ay: {
    quake: ['{magnitude} ch\'amani uraqi khathati', '{detail}. Familiamaru, utamaru uñakipt\'am.'],
    tsunami: ['Tsunami utjaspawa (amuyt\'ata)', 'Qutan {magnitude} ch\'amani uraqi khathati. Playa jak\'ankasta ukhaxa, jichhpach alay chiqaru makhatam. Chiqpach yatiyawix DHN ukat juti.'],
    huaico: ['Markaman lloclla jan walt\'awi: {level} pata', 'SENAMHI yatiyawi {place} tuqitaki. Qhuqhanakat, jawir thakhinakat jithiqtam.'],
    lluvia_intensa: ['Markaman ch\'ama jallu: {level} pata', 'SENAMHI yatiyawi {place} tuqitaki. Emergencia q\'ipima wakicht\'ata katxarum, jan jawir makatamti.'],
    comment: ['{name} yatiyawimar arsuwayi', '{body}'],
    test: ['Ukhamaw AYLLUx yatiyätam', 'Markaman uraqi khathatinakata, jallunakata, llocllanakatsa yatiyawinakaw purini, app jist\'antatäkchisa.'],
    here: ['markama', '']
  }
};

const fill = (text: string, values: Record<string, unknown>) =>
  text.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));

/** SENAMHI writes districts in capitals: "EL CARMEN DE LA FRONTERA" reads "El Carmen de la Frontera". */
const placeName = (raw: string) =>
  raw.toLowerCase().replace(/(^|\s)(\S)/g, (_, space, letter) => space + letter.toUpperCase())
    .replace(/\s(De|La|Las|Los|Del|Y)(?=\s)/g, (word) => word.toLowerCase());

function render(push: QueuedPush): { title: string; body: string; channel: string; data: Record<string, string> } {
  const words = TEXTS[push.lang] ?? TEXTS.es;
  const p = push.params;
  if (push.kind === 'zone') {
    const hazard = p.hazard === 'huaico' ? 'huaico' : 'lluvia_intensa';
    const level = (LEVELS[push.lang] ?? LEVELS.es)[Number(p.level)] ?? '';
    const place = typeof p.district === 'string' && p.district ? placeName(p.district) : words.here[0];
    const [title, body] = words[hazard];
    return { title: fill(title, { level }), body: fill(body, { place }), channel: 'alertas', data: { kind: 'zone' } };
  }
  const [title, body] = words[push.kind];
  const values = { ...p, magnitude: Number(p.magnitude ?? 0).toFixed(1) };
  return {
    title: fill(title, values).slice(0, 120),
    body: fill(body, values).slice(0, 240),
    channel: push.kind === 'comment' ? 'vecinos' : 'alertas',
    data: push.kind === 'comment' ? { kind: 'comment', report_id: String(p.report_id ?? '') } : { kind: push.kind }
  };
}

// ---------------------------------------------------------------------------
// Firebase
// ---------------------------------------------------------------------------

let account: ServiceAccount | null = null;
let googleToken: { value: string; expires: number } | null = null;

function serviceAccount(): ServiceAccount {
  account ??= JSON.parse(atob(Deno.env.get('FIREBASE_SERVICE_ACCOUNT_B64') ?? ''));
  return account!;
}

async function accessToken(): Promise<string> {
  if (googleToken && googleToken.expires > Date.now() + 60_000) return googleToken.value;
  const { client_email, private_key } = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/firebase.messaging' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(client_email)
    .setSubject(client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(await importPKCS8(private_key, 'RS256'));
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
  });
  if (!response.ok) throw new Error(`Google no dio acceso (${response.status})`);
  const json = await response.json();
  googleToken = { value: json.access_token, expires: Date.now() + Number(json.expires_in) * 1000 };
  return googleToken.value;
}

async function send(push: QueuedPush, token: string): Promise<{ outcome: 'sent' | 'gone' | 'retry'; error?: string }> {
  const { title, body, channel, data } = render(push);
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount().project_id}/messages:send`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: {
        token: push.token,
        notification: { title, body },
        data,
        android: {
          priority: channel === 'alertas' ? 'HIGH' : 'NORMAL',
          notification: { channel_id: channel, default_sound: true, default_vibrate_timings: true }
        }
      }
    })
  });
  if (response.ok) return { outcome: 'sent' };
  const detail = await response.json().catch(() => null);
  const code: string =
    detail?.error?.details?.find((d: { errorCode?: string }) => d.errorCode)?.errorCode ?? detail?.error?.status ?? '';
  // The app was removed or the token is no longer valid: forget the phone.
  if (response.status === 404 || code === 'UNREGISTERED') return { outcome: 'gone' };
  if (response.status === 400 && code === 'INVALID_ARGUMENT' && /token/i.test(detail?.error?.message ?? '')) return { outcome: 'gone' };
  return { outcome: 'retry', error: `${response.status} ${code}`.trim() };
}

// ---------------------------------------------------------------------------

Deno.serve(async () => {
  const { data: status } = await admin.from('ingest_status').select('last_attempt_at').eq('source', SOURCE).maybeSingle();
  const elapsed = status?.last_attempt_at ? Date.now() - new Date(status.last_attempt_at).getTime() : Infinity;
  if (elapsed < MIN_INTERVAL_MS) return Response.json({ skipped: true });
  const attemptedAt = new Date().toISOString();
  await admin.from('ingest_status').upsert({ source: SOURCE, last_attempt_at: attemptedAt });

  try {
    const queued = await admin.rpc('queue_hazard_pushes');
    if (queued.error) throw queued.error;

    const { data: rows, error } = await admin.rpc('claim_push_queue', { p_limit: BATCH });
    if (error) throw error;
    const pushes = (rows ?? []) as QueuedPush[];
    let sent = 0;
    let gone = 0;
    let failed = 0;

    if (pushes.length > 0) {
      const token = await accessToken();
      for (let start = 0; start < pushes.length; start += PARALLEL) {
        const chunk = pushes.slice(start, start + PARALLEL);
        const results = await Promise.all(chunk.map((push) => send(push, token).catch((err) => ({ outcome: 'retry' as const, error: String(err) }))));
        const sentIds = chunk.filter((_, i) => results[i].outcome === 'sent').map((push) => push.id);
        const goneTokens = chunk.filter((_, i) => results[i].outcome === 'gone').map((push) => push.token);
        if (sentIds.length) await admin.from('push_queue').update({ sent_at: new Date().toISOString(), error: null }).in('id', sentIds);
        if (goneTokens.length) await admin.from('push_devices').delete().in('token', goneTokens);
        for (let i = 0; i < chunk.length; i++) {
          if (results[i].outcome === 'retry') {
            await admin.from('push_queue').update({ claimed_at: null, error: results[i].error ?? 'error' }).eq('id', chunk[i].id);
          }
        }
        sent += sentIds.length;
        gone += goneTokens.length;
        failed += results.filter((r) => r.outcome === 'retry').length;
      }
    }

    if (new Date().getUTCMinutes() === 0) await admin.rpc('prune_push_queue');
    await admin.from('ingest_status').upsert({
      source: SOURCE,
      last_attempt_at: attemptedAt,
      last_success_at: new Date().toISOString(),
      last_error: failed ? `${failed} por reintentar` : null,
      records: sent
    });
    return Response.json({ queued: queued.data, sent, gone, failed });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('El envío de avisos falló:', message);
    await admin.from('ingest_status').upsert({ source: SOURCE, last_attempt_at: attemptedAt, last_error: message });
    return Response.json({ error: message }, { status: 500 });
  }
});
