/**
 * Makes AYLLU's services start hidden every time this Windows user logs in, so nobody has to type
 * a command. It uses the user's own Startup folder: no administrator rights needed.
 *   npm run servicios:instalar   starts them now and at every login
 *   npm run servicios:quitar     stops them and removes the automatic start
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve('.');
const startupFolder = join(process.env.APPDATA ?? '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const launcher = join(startupFolder, 'AYLLU servicios.vbs');
const LOCK = join(root, 'logs', 'servicios.pid');

function stopRunning(): boolean {
  if (!existsSync(LOCK)) return false;
  const pid = readFileSync(LOCK, 'utf8').trim();
  try {
    // /T also stops the two programs the supervisor started.
    execFileSync('taskkill', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  } finally {
    rmSync(LOCK, { force: true });
  }
}

if (process.argv.includes('--quitar')) {
  rmSync(launcher, { force: true });
  const stopped = stopRunning();
  console.log(`Listo: los servicios ya no arrancarán solos${stopped ? ' y se detuvieron' : ''}.`);
  process.exit(0);
}

if (!existsSync(startupFolder)) {
  console.error(`No encontré la carpeta de Inicio de Windows: ${startupFolder}`);
  process.exit(1);
}

mkdirSync(join(root, 'logs'), { recursive: true });
rmSync(join(root, 'logs', 'servicios-inicio.vbs'), { force: true });

// A tiny launcher that starts Node without opening a window.
writeFileSync(launcher, [
  "' Starts AYLLU's services hidden at login. Made by npm run servicios:instalar; remove with npm run servicios:quitar.",
  'Set shell = CreateObject("WScript.Shell")',
  `shell.CurrentDirectory = "${root}"`,
  `shell.Run """${process.execPath}"" scripts\\services.ts", 0, False`,
  ''
].join('\r\n'));

spawn('wscript.exe', [launcher], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
console.log('Listo: los servicios de AYLLU ya están corriendo y arrancarán solos cada vez que inicies sesión.');
console.log('Su registro queda en la carpeta logs/. Para desactivarlos: npm run servicios:quitar');
