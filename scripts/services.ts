/**
 * Keeps AYLLU's two programs running on this computer and restarts them if they stop:
 *   - senamhi: brings SENAMHI's warnings (SENAMHI only answers from Peru, so it runs here)
 *   - llamadas: the free-call program connected to the exchange
 *
 *   npm run servicios            runs both now (stops with Ctrl+C)
 *   npm run servicios:instalar   starts them hidden every time this Windows user logs in
 *   npm run servicios:quitar     undoes that
 *
 * Output goes to logs/servicios-YYYY-MM-DD.log (ignored by git).
 */
import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const SERVICES = [
  { name: 'senamhi', script: 'scripts/senamhi-relay.ts' },
  { name: 'llamadas', script: 'scripts/call-center.ts' }
];
const LOCK = 'logs/servicios.pid';

mkdirSync('logs', { recursive: true });

const write = (line: string) => {
  const now = new Date();
  appendFileSync(`logs/servicios-${now.toISOString().slice(0, 10)}.log`, `${now.toISOString()} ${line}\n`);
};

// Two copies would place every call twice: only one may run.
function isAlreadyRunning(): boolean {
  if (!existsSync(LOCK)) return false;
  const pid = Number(readFileSync(LOCK, 'utf8'));
  try {
    process.kill(pid, 0);
    return pid !== process.pid;
  } catch {
    return false;
  }
}

if (isAlreadyRunning()) {
  console.log('Los servicios de AYLLU ya están corriendo en esta computadora.');
  process.exit(0);
}
writeFileSync(LOCK, String(process.pid));

function run(service: { name: string; script: string }, delayMs = 5_000): void {
  const child = spawn(process.execPath, [service.script], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
  const startedAt = Date.now();
  write(`[${service.name}] iniciado`);
  const forward = (data: Buffer) =>
    data.toString().split(/\r?\n/).filter((line) => line && !line.includes('ExperimentalWarning')).forEach((line) => write(`[${service.name}] ${line}`));
  child.stdout.on('data', forward);
  child.stderr.on('data', forward);
  child.on('exit', (code) => {
    // A program that ran a while restarts quickly; one that keeps failing waits longer each time.
    const nextDelay = Date.now() - startedAt > 60_000 ? 5_000 : Math.min(delayMs * 2, 300_000);
    write(`[${service.name}] se detuvo (código ${code}); se reinicia en ${Math.round(delayMs / 1000)} s`);
    setTimeout(() => run(service, nextDelay), delayMs);
  });
}

write('supervisor iniciado');
console.log('Servicios de AYLLU corriendo. Registro en la carpeta logs/. Ctrl+C para detenerlos.');
SERVICES.forEach((service) => run(service));

process.on('SIGINT', () => {
  write('supervisor detenido');
  process.exit(0);
});
