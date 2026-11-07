/**
 * The voice that speaks in AYLLU's calls, made on this computer with the Spanish voice of
 * Windows, at telephone quality. Works without any outside service.
 */
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readWavSamples } from './phone.ts';

// The text and the file arrive through the environment, never inside the command itself.
const SCRIPT = [
  'Add-Type -AssemblyName System.Speech',
  '$s = New-Object System.Speech.Synthesis.SpeechSynthesizer',
  "try { $s.SelectVoice('Microsoft Helena Desktop') } catch {}",
  '$s.Rate = [int]$env:AYLLU_TTS_RATE',
  '$f = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(8000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)',
  '$s.SetOutputToWaveFile($env:AYLLU_TTS_OUT, $f)',
  '$s.Speak($env:AYLLU_TTS_TEXT)',
  '$s.Dispose()'
].join('; ');

// The voice program gets the system's own settings, never the exchange password or the database key.
function voiceEnvironment(extra: Record<string, string>): NodeJS.ProcessEnv {
  const safe = Object.fromEntries(
    Object.entries(process.env).filter(([name]) => !/PASSWORD|SECRET|KEY|TOKEN|SUPABASE|YAUTALK|VERCEL/i.test(name))
  );
  return { ...safe, ...extra };
}

/** Rate goes from -10 (slowest) to 10. Slightly slow by default: phone audio loses clarity. */
export function speak(text: string, rate = -1): Promise<Int16Array> {
  const folder = mkdtempSync(join(tmpdir(), 'ayllu-voz-'));
  const output = join(folder, 'voz.wav');
  return new Promise((resolve, reject) => {
    execFile(
      'powershell.exe',
      ['-NoProfile', '-NonInteractive', '-Command', SCRIPT],
      { env: voiceEnvironment({ AYLLU_TTS_TEXT: text, AYLLU_TTS_OUT: output, AYLLU_TTS_RATE: String(rate) }), timeout: 20_000, windowsHide: true },
      (error) => {
        try {
          if (error) throw error;
          resolve(readWavSamples(readFileSync(output)));
        } catch (err) {
          reject(err);
        } finally {
          rmSync(folder, { recursive: true, force: true });
        }
      }
    );
  });
}

const LETTER_NAMES: Record<string, string> = {
  A: 'a', B: 'be', C: 'ce', D: 'de', E: 'e', F: 'efe', G: 'ge', H: 'hache', I: 'i', J: 'jota', K: 'ka',
  L: 'ele', M: 'eme', N: 'ene', O: 'o', P: 'pe', Q: 'cu', R: 'erre', S: 'ese', T: 'te', U: 'u', V: 'uve',
  W: 'uve doble', X: 'equis', Y: 'ye', Z: 'zeta'
};

/** "36YM7Q" is read as "3, 6, ye, eme, 7, cu", so it can be written down on the phone. */
export const spellCode = (code: string) => [...code].map((char) => LETTER_NAMES[char] ?? char).join(', ');

/** "912345678" is read in three groups, the way Peruvians say a mobile number. */
export const spellPhone = (phone: string) =>
  [phone.slice(0, 3), phone.slice(3, 6), phone.slice(6)].map((group) => group.split('').join(' ')).join(', ');

/** A full stop between digits makes the voice pause, so each one can be written down. */
export const spellDigits = (digits: string) => digits.split('').join('. ');
