/**
 * AYLLU's free calls. A neighbour asks from the app; this program has the exchange call them back,
 * then calls the number they want, announces who is calling, joins both for one minute and keeps
 * a recording for 30 days (longer only if there is a complaint).
 *
 *   npm run llamadas
 *
 * Runs on a computer with internet that stays on. Needs:
 *   .env              VITE_SUPABASE_URL (public, already in the repository)
 *   .env.relay        SUPABASE_SECRET_KEY and YAUTALK_SERVER / YAUTALK_EXTENSION / YAUTALK_PASSWORD
 * None of these are ever printed, and the console never shows whole phone numbers or codes.
 */
import { existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import {
  beep,
  dial,
  hangUp,
  loadExchangeConfig,
  log,
  maskPhone,
  startAgent,
  stopAgent,
  wait,
  wavBuffer,
  type Leg
} from './calls/phone.ts';
import { speak, spellCode, spellDigits, spellPhone } from './calls/speech.ts';

for (const file of ['.env', '.env.local', '.env.relay']) if (existsSync(file)) process.loadEnvFile(file);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl || !secretKey) {
  console.error('Falta VITE_SUPABASE_URL o SUPABASE_SECRET_KEY');
  process.exit(1);
}

const exchange = loadExchangeConfig();
const db = createClient(supabaseUrl, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });

const TALK_SECONDS = 60;
const WARNING_AT_SECONDS = 50;
const JOB_LIMIT_MS = 4 * 60_000;
const POLL_MS = 2_000;
const RECORDINGS = 'call-recordings';
const RETENTION_DAYS = 30;

interface Verification {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
}

interface CallRequest {
  id: string;
  user_code: string;
  caller_phone: string;
  destination: string;
}

// Prompts that never change are made once, when the program starts.
const fixed: Record<'warning' | 'goodbye' | 'noAnswer' | 'callerLeft', Int16Array> = {
  warning: beep(400),
  goodbye: new Int16Array(),
  noAnswer: new Int16Array(),
  callerLeft: new Int16Array()
};

async function prepareFixedPrompts(): Promise<void> {
  [fixed.goodbye, fixed.noAnswer, fixed.callerLeft] = await Promise.all([
    speak('Se acabó el minuto. Gracias por usar AYLLU.'),
    speak('El número no contestó. No se descontó tu minuto. Puedes intentarlo otra vez.'),
    speak('La persona que te llamaba colgó. Disculpa la molestia.')
  ]);
}

const now = () => new Date().toISOString();

async function update(table: 'call_requests' | 'phone_verifications', id: string, fields: Record<string, unknown>): Promise<void> {
  const { error } = await db.from(table).update(fields).eq('id', id);
  if (error) log(`no se pudo guardar el estado: ${error.message}`);
}

/** Takes the oldest waiting job, making sure no other program took it first. */
// A database that refuses must be visible: a first test failed in silence for minutes.
let lastProblem = '';
function reportProblem(where: string, message?: string): void {
  if (!message) return;
  const problem = `${where}: ${message}`;
  if (problem !== lastProblem) log(`problema con la base de datos (${problem})`);
  lastProblem = problem;
}

async function claim<T extends { id: string }>(table: 'call_requests' | 'phone_verifications', columns: string, nextStatus: string): Promise<T | null> {
  const { data, error } = await db.from(table).select(columns).eq('status', 'pending').order('created_at').limit(1);
  reportProblem(`leer ${table}`, error?.message);
  const row = data?.[0] as unknown as T | undefined;
  if (!row) return null;
  const { data: taken, error: takeError } = await db.from(table).update({ status: nextStatus }).eq('id', row.id).eq('status', 'pending').select('id');
  reportProblem(`tomar ${table}`, takeError?.message);
  return taken?.length ? row : null;
}

async function runVerification(job: Verification): Promise<void> {
  if (new Date(job.expires_at) < new Date()) {
    await update('phone_verifications', job.id, { status: 'failed' });
    return;
  }
  // Said slowly and twice: a test showed the last digit could be missed.
  const digits = spellDigits(job.code);
  const message = await speak(`Hola, te habla AYLLU. Tu código es: ${digits}. Repito: ${digits}. Escríbelo en la aplicación.`, -3);
  const agent = startAgent(exchange);
  await agent.start();
  try {
    const leg = await dial(agent, exchange, job.phone, 'código');
    if (!leg) {
      await update('phone_verifications', job.id, { status: 'no_answer' });
      return;
    }
    await wait(700);
    await leg.audio.play(message);
    // Hanging up right after the last word can cut it off on the phone's side.
    await wait(1_500);
    await hangUp(leg);
    await update('phone_verifications', job.id, { status: 'called' });
    log(`código dictado a ${maskPhone(job.phone)}`);
  } finally {
    await stopAgent(agent);
  }
}

async function runCall(job: CallRequest): Promise<void> {
  const [toCaller, toDestination] = await Promise.all([
    speak(`Hola, te habla AYLLU. Te estamos conectando con el ${spellPhone(job.destination)}. Tienes un minuto. La llamada se graba por seguridad.`),
    speak(`Hola. Esta es una llamada gratuita de AYLLU, de parte del usuario ${spellCode(job.user_code)}. La llamada se graba por seguridad.`)
  ]);

  const agent = startAgent(exchange);
  await agent.start();
  let caller: Leg | null = null;
  let destination: Leg | null = null;

  try {
    caller = await dial(agent, exchange, job.caller_phone, 'quien llama');
    if (!caller) {
      await update('call_requests', job.id, { status: 'caller_no_answer', ended_at: now() });
      return;
    }
    await wait(500);
    await caller.audio.play(toCaller);
    await update('call_requests', job.id, { status: 'calling_destination' });

    const stopHold = caller.audio.holdWithSilence();
    destination = await dial(agent, exchange, job.destination, 'destino');
    stopHold();

    if (!destination) {
      if (!caller.isEnded()) await caller.audio.play(fixed.noAnswer);
      await update('call_requests', job.id, { status: 'destination_no_answer', ended_at: now() });
      return;
    }

    // The person called hears who is calling and that it is recorded before anyone speaks.
    const holdCaller = caller.audio.holdWithSilence();
    await destination.audio.play(toDestination);
    holdCaller();

    if (caller.isEnded()) {
      await destination.audio.play(fixed.callerLeft);
      await update('call_requests', job.id, { status: 'failed', error: 'Quien llamaba colgó antes de conectar', ended_at: now() });
      return;
    }

    await update('call_requests', job.id, { status: 'connected', connected_at: now() });
    const callerStart = caller.audio.heard.length;
    const destinationStart = destination.audio.heard.length;
    let joined = true;
    const a = caller;
    const b = destination;
    a.audio.onFrame = (frame) => joined && b.audio.sendFrame(frame);
    b.audio.onFrame = (frame) => joined && a.audio.sendFrame(frame);
    const startedAt = Date.now();
    const someoneHungUp = Promise.race([a.ended, b.ended]).then(() => 'hung_up');

    let outcome = await Promise.race([someoneHungUp, wait(WARNING_AT_SECONDS * 1000).then(() => 'warning')]);
    if (outcome === 'warning') {
      // Ten seconds left: both hear a short tone.
      joined = false;
      await Promise.all([a.audio.play(fixed.warning), b.audio.play(fixed.warning)]);
      joined = true;
      const remaining = Math.max(0, startedAt + TALK_SECONDS * 1000 - Date.now());
      outcome = await Promise.race([someoneHungUp, wait(remaining).then(() => 'time_up')]);
    }

    joined = false;
    const talkSeconds = Math.min(TALK_SECONDS, Math.round((Date.now() - startedAt) / 1000));
    if (outcome === 'time_up') await Promise.all([a, b].map((leg) => (leg.isEnded() ? null : leg.audio.play(fixed.goodbye))));
    await Promise.all([hangUp(a), hangUp(b)]);

    // Left channel: who called. Right channel: who answered.
    const recording = wavBuffer([a.audio.heard.slice(callerStart), b.audio.heard.slice(destinationStart)]);
    const path = `${job.id}.wav`;
    const { error } = await db.storage.from(RECORDINGS).upload(path, recording, { contentType: 'audio/wav' });
    if (error) log(`no se pudo subir la grabación: ${error.message}`);

    await update('call_requests', job.id, {
      status: 'completed',
      talk_seconds: talkSeconds,
      recording_path: error ? null : path,
      ended_at: now()
    });
    log(`llamada terminada: ${talkSeconds} s de conversación`);
  } finally {
    await Promise.all([hangUp(caller), hangUp(destination)]);
    await stopAgent(agent);
  }
}

async function withLimit(work: Promise<void>, onTimeout: () => Promise<void>): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const limit = new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), JOB_LIMIT_MS); });
  const result = await Promise.race([work.then(() => 'done' as const), limit]);
  clearTimeout(timer);
  if (result === 'timeout') await onTimeout();
}

let isBusy = false;

async function tick(): Promise<void> {
  if (isBusy) return;
  isBusy = true;
  try {
    const verification = await claim<Verification>('phone_verifications', 'id, phone, code, expires_at', 'calling');
    if (verification) {
      await withLimit(runVerification(verification), () => update('phone_verifications', verification.id, { status: 'failed' }));
      return;
    }
    const call = await claim<CallRequest>('call_requests', 'id, user_code, caller_phone, destination', 'calling_caller');
    if (call) {
      log('nuevo pedido de llamada');
      await withLimit(
        runCall(call).catch(async (err) => {
          log(`la llamada falló: ${err.message}`);
          await update('call_requests', call.id, { status: 'failed', error: String(err.message).slice(0, 300), ended_at: now() });
        }),
        () => update('call_requests', call.id, { status: 'failed', error: 'Se pasó del tiempo máximo', ended_at: now() })
      );
    }
  } catch (err) {
    log(`error: ${(err as Error).message}`);
  } finally {
    isBusy = false;
  }
}

async function heartbeat(): Promise<void> {
  const { error } = await db.from('call_center_status').upsert({ id: 1, last_seen: now() });
  reportProblem('latido', error?.message);
}

/** Requests nobody served in 10 minutes are closed: calling someone an hour late would be worse. */
async function closeStale(atStart: boolean): Promise<void> {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString();
  await db.from('call_requests').update({ status: 'failed', error: 'La central no estaba disponible', ended_at: now() })
    .eq('status', 'pending').lt('created_at', tenMinutesAgo);
  if (atStart) {
    // Anything half-done belongs to a previous run that stopped.
    await db.from('call_requests').update({ status: 'failed', error: 'La central se reinició', ended_at: now() })
      .in('status', ['calling_caller', 'calling_destination', 'connected']);
    await db.from('phone_verifications').update({ status: 'failed' }).eq('status', 'calling');
  }
}

async function deleteOldRecordings(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
  const { data } = await db.from('call_requests').select('id, recording_path')
    .not('recording_path', 'is', null).eq('has_complaint', false).lt('created_at', cutoff).limit(100);
  if (!data?.length) return;
  await db.storage.from(RECORDINGS).remove(data.map((row) => row.recording_path as string));
  await db.from('call_requests').update({ recording_path: null }).in('id', data.map((row) => row.id));
  log(`grabaciones de más de ${RETENTION_DAYS} días borradas: ${data.length}`);
}

async function main(): Promise<void> {
  log('preparando la voz...');
  await prepareFixedPrompts();
  await closeStale(true);
  await deleteOldRecordings();
  await heartbeat();
  setInterval(() => void tick(), POLL_MS);
  setInterval(() => void heartbeat(), 20_000);
  setInterval(() => void closeStale(false), 60_000);
  setInterval(() => void deleteOldRecordings(), 3_600_000);
  log('central de llamadas de AYLLU lista. Ctrl+C para detenerla.');
}

process.on('SIGINT', () => {
  log('detenida');
  process.exit(0);
});

main().catch((err) => {
  console.error('ERROR', err.message);
  process.exit(1);
});
