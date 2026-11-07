/**
 * Checks the Yautalk exchange by hand, with the same pieces the free-call program uses.
 *   node scripts/call-spike.ts llamar 9XXXXXXXX              calls, speaks, records 8 s and reads keys
 *   node scripts/call-spike.ts puente 9XXXXXXXX 9XXXXXXXX    calls both and joins them for 25 s
 *   node scripts/call-spike.ts esperar 120                   shows who rings the extension, without answering
 *
 * Needs YAUTALK_* in .env.relay (never printed). Recordings go to CALL_TEST_OUT (default ./call-test-out).
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Registerer, RegistererState } from 'sip.js';
import { beep, dial, hangUp, loadExchangeConfig, log, readWavSamples, startAgent, stopAgent, wait, wavBuffer } from './calls/phone.ts';

process.loadEnvFile('.env.relay');
const exchange = loadExchangeConfig();
const OUT_DIR = process.env.CALL_TEST_OUT ?? 'call-test-out';

// A test must never hang on a line that costs money.
setTimeout(() => {
  log('tiempo maximo de la prueba alcanzado: se corta');
  process.exit(2);
}, Number(process.env.CALL_TEST_LIMIT_MS ?? 120_000)).unref();

function save(name: string, channels: number[][]): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}-${Date.now()}.wav`);
  writeFileSync(path, wavBuffer(channels));
  log('grabacion guardada en', path);
}

async function callAndListen(number: string): Promise<void> {
  const agent = startAgent(exchange);
  await agent.start();
  const leg = await dial(agent, exchange, number, 'prueba');
  if (leg) {
    await wait(600);
    await leg.audio.play(readWavSamples(join('scripts', 'call-prompts', 'prueba.wav')));
    await leg.audio.play(beep());
    const from = leg.audio.heard.length;
    await wait(8_000);
    const heard = leg.audio.heard.slice(from);
    log(`paquetes recibidos: ${leg.audio.packetsIn}; volumen maximo: ${heard.reduce((max, v) => Math.max(max, Math.abs(v)), 0)}; teclas: ${leg.audio.digits.join('') || 'ninguna'}`);
    save('prueba', [heard]);
    await hangUp(leg);
  }
  await stopAgent(agent);
}

async function bridge(first: string, second: string): Promise<void> {
  const agent = startAgent(exchange);
  await agent.start();
  const a = await dial(agent, exchange, first, 'llamada 1');
  if (a) {
    await wait(500);
    await a.audio.play(readWavSamples(join('scripts', 'call-prompts', 'puente.wav')));
    const stopHold = a.audio.holdWithSilence();
    const b = await dial(agent, exchange, second, 'llamada 2');
    stopHold();
    if (b) {
      log('dos llamadas a la vez: OK. Uniendolas por 25 s...');
      const fromA = a.audio.heard.length;
      const fromB = b.audio.heard.length;
      a.audio.onFrame = (frame) => b.audio.sendFrame(frame);
      b.audio.onFrame = (frame) => a.audio.sendFrame(frame);
      await Promise.race([a.ended, b.ended, wait(25_000)]);
      save('puente', [a.audio.heard.slice(fromA), b.audio.heard.slice(fromB)]);
    }
    await Promise.all([hangUp(a), hangUp(b)]);
  }
  await stopAgent(agent);
}

async function waitForRing(seconds: number): Promise<void> {
  const agent = startAgent(exchange, (invitation) => {
    const asserted = invitation.request.getHeader('P-Asserted-Identity') ?? '(sin cabecera)';
    log(`timbrazo recibido de: ${invitation.remoteIdentity.uri.user}; identidad: ${asserted}`);
    invitation.reject({ statusCode: 486 }).catch(() => {});
  });
  await agent.start();
  const registerer = new Registerer(agent, { expires: 300 });
  await registerer.register();
  await wait(3_000);
  log(registerer.state === RegistererState.Registered ? `registrada; esperando ${seconds} s` : 'la extension no quedó registrada');
  await wait(seconds * 1000);
  await registerer.unregister().catch(() => {});
  await stopAgent(agent);
}

const [mode, value, other] = process.argv.slice(2);
const isPhone = (number?: string) => /^9\d{8}$/.test(number ?? '');
const run = mode === 'llamar' && isPhone(value)
  ? callAndListen(value)
  : mode === 'puente' && isPhone(value) && isPhone(other)
    ? bridge(value, other)
    : mode === 'esperar'
      ? waitForRing(Number(value) || 120)
      : Promise.reject(new Error('Uso: node scripts/call-spike.ts llamar 9XXXXXXXX | puente 9XXXXXXXX 9XXXXXXXX | esperar 120'));

run.then(() => process.exit(0)).catch((err) => {
  console.error('ERROR', err.message);
  process.exit(1);
});
