/**
 * Registers AYLLU's services to start hidden every time this Windows user logs in, so nobody has
 * to type a command. Only this user, without administrator rights.
 *   npm run servicios:instalar
 *   npm run servicios:quitar
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const TASK = 'AYLLU servicios';
const root = resolve('.');

if (process.argv.includes('--quitar')) {
  execFileSync('schtasks', ['/Delete', '/TN', TASK, '/F'], { stdio: 'inherit' });
  console.log('Listo: los servicios ya no arrancarán solos. Si están corriendo, se detienen al cerrar sesión.');
  process.exit(0);
}

// A tiny launcher that starts Node without opening a window.
mkdirSync(join(root, 'logs'), { recursive: true });
const launcher = join(root, 'logs', 'servicios-inicio.vbs');
writeFileSync(launcher, [
  "' Starts AYLLU's services hidden. Made by npm run servicios:instalar.",
  'Set shell = CreateObject("WScript.Shell")',
  `shell.CurrentDirectory = "${root}"`,
  `shell.Run """${process.execPath}"" scripts\\services.ts", 0, False`,
  ''
].join('\r\n'));

execFileSync('schtasks', ['/Create', '/TN', TASK, '/TR', `wscript.exe "${launcher}"`, '/SC', 'ONLOGON', '/RL', 'LIMITED', '/F'], { stdio: 'inherit' });
execFileSync('schtasks', ['/Run', '/TN', TASK], { stdio: 'inherit' });
console.log('Listo: los servicios de AYLLU ya están corriendo y arrancarán solos cada vez que inicies sesión.');
