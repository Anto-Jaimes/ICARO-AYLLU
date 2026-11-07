/**
 * Help requests sent by sound. One phone plays a short run of tones; a phone nearby hears it with
 * its microphone and decodes it. No internet, no mobile network and no Bluetooth: only the speaker
 * and the microphone (frequency-shift keying, like the old modems).
 *
 * A message is: start tone, sync tone, the text as hexadecimal digits (one tone each), a checksum
 * and an end tone. Two equal digits in a row would sound like one long tone, so a repeated digit is
 * sent as a separate "repeat" tone. Every tone then differs from the one before, and the receiver
 * only has to notice changes: that keeps it working with the uneven timing of a phone's audio.
 * A message that arrives damaged fails the checksum and is dropped, never shown with wrong data.
 */

export type BeaconType = 'SOS_TRAPPED' | 'SOS_MEDICAL' | 'RESOURCE_WATER' | 'RESOURCE_FIRSTAID' | 'CHECKIN_SAFE';

export interface AcousticBeaconPayload {
  id: string;
  sender: string;
  type: BeaconType;
  details: string;
  lat?: number;
  lng?: number;
  timestamp: number;
  /** Loudness of the strongest tone heard, 0 to 100: a rough sense of how near the sender is. */
  rssi?: number;
}

export type AcousticMode = 'audible' | 'ultrasonic';

interface ToneSet {
  start: number;
  sync: number;
  end: number;
  base: number;
  step: number;
  /** Seconds per digit. Long enough for a phone to hear each tone at least twice. */
  symbol: number;
}

const TONES: Record<AcousticMode, ToneSet> = {
  audible: { start: 1400, sync: 3000, end: 1200, base: 1750, step: 65, symbol: 0.09 },
  ultrasonic: { start: 17500, sync: 20200, end: 17300, base: 18200, step: 85, symbol: 0.1 }
};

const REPEAT = 16;
const MARKER_SECONDS = 0.14;
const RAMP_SECONDS = 0.005;

const TYPE_CODES: Record<BeaconType, string> = {
  SOS_TRAPPED: '1',
  SOS_MEDICAL: '2',
  RESOURCE_WATER: '3',
  RESOURCE_FIRSTAID: '4',
  CHECKIN_SAFE: '5'
};

const CODE_TO_TYPE: Record<string, BeaconType> = Object.fromEntries(
  Object.entries(TYPE_CODES).map(([type, code]) => [code, type as BeaconType])
);

export const BEACON_LABELS: Record<BeaconType, { title: string; desc: string; isUrgent: boolean }> = {
  SOS_TRAPPED: { title: 'Persona atrapada', desc: 'Bajo escombros o sin salida', isUrgent: true },
  SOS_MEDICAL: { title: 'Emergencia médica', desc: 'Necesita atención urgente', isUrgent: true },
  RESOURCE_WATER: { title: 'Tengo agua para compartir', desc: 'Agua potable para vecinos', isUrgent: false },
  RESOURCE_FIRSTAID: { title: 'Tengo botiquín', desc: 'Gasas, alcohol y vendas', isUrgent: false },
  CHECKIN_SAFE: { title: 'Estoy a salvo', desc: 'Mi familia y yo estamos bien', isUrgent: false }
};

/** Only plain letters travel well: accents and "ñ" become their simple form. */
function plainText(value: string, max: number): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ñÑ]/g, (char) => (char === 'ñ' ? 'n' : 'N'))
    .replace(/[^\x20-\x7e]/g, '')
    .replace(/\|/g, '/')
    .trim()
    .slice(0, max);
}

function messageText(beacon: AcousticBeaconPayload): string {
  const coords = beacon.lat !== undefined && beacon.lng !== undefined ? `${beacon.lat.toFixed(4)},${beacon.lng.toFixed(4)}` : '';
  return `AY|${TYPE_CODES[beacon.type]}|${plainText(beacon.sender, 20) || 'Vecino'}|${plainText(beacon.details, 30)}|${coords}`;
}

const checksum = (bytes: number[]) => bytes.reduce((sum, byte) => (sum + byte) & 0xff, 0);

/** The tones that carry one message, in order. */
export function toneSequence(beacon: AcousticBeaconPayload, mode: AcousticMode): { freq: number; seconds: number }[] {
  const tones = TONES[mode];
  const bytes = [...messageText(beacon)].map((char) => char.charCodeAt(0));
  const digits = [...bytes, checksum(bytes)].flatMap((byte) => [byte >> 4, byte & 0x0f]);

  const sequence = [
    { freq: tones.start, seconds: MARKER_SECONDS },
    { freq: tones.sync, seconds: MARKER_SECONDS }
  ];
  let previous = -1;
  for (const digit of digits) {
    const symbol = digit === previous ? REPEAT : digit;
    sequence.push({ freq: tones.base + symbol * tones.step, seconds: tones.symbol });
    previous = symbol === REPEAT ? -1 : digit;
  }
  sequence.push({ freq: tones.end, seconds: MARKER_SECONDS });
  return sequence;
}

/** The sound of one message as samples, with soft edges so tones do not click. */
export function renderBeacon(beacon: AcousticBeaconPayload, mode: AcousticMode, sampleRate: number, volume = 0.6): Float32Array {
  const sequence = toneSequence(beacon, mode);
  const total = Math.ceil(sequence.reduce((sum, tone) => sum + tone.seconds, 0) * sampleRate);
  const samples = new Float32Array(total);
  const ramp = Math.round(RAMP_SECONDS * sampleRate);
  let offset = 0;
  let phase = 0;
  for (const tone of sequence) {
    const length = Math.round(tone.seconds * sampleRate);
    const advance = (2 * Math.PI * tone.freq) / sampleRate;
    for (let i = 0; i < length && offset + i < total; i++) {
      const edge = Math.min(1, i / ramp, (length - i) / ramp);
      samples[offset + i] = Math.sin(phase) * volume * edge;
      phase += advance;
    }
    offset += length;
  }
  return samples;
}

function readMessage(digits: number[]): AcousticBeaconPayload | null {
  if (digits.length < 12 || digits.length % 2 !== 0) return null;
  const bytes: number[] = [];
  for (let i = 0; i < digits.length; i += 2) bytes.push((digits[i] << 4) | digits[i + 1]);
  const received = bytes.pop()!;
  if (checksum(bytes) !== received) return null;

  const parts = String.fromCharCode(...bytes).split('|');
  if (parts.length !== 5 || parts[0] !== 'AY' || !CODE_TO_TYPE[parts[1]]) return null;
  const [lat, lng] = parts[4] ? parts[4].split(',').map(Number) : [NaN, NaN];
  const hasPlace = Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return {
    id: `sonido-${Date.now()}`,
    sender: parts[2],
    type: CODE_TO_TYPE[parts[1]],
    details: parts[3],
    lat: hasPlace ? lat : undefined,
    lng: hasPlace ? lng : undefined,
    timestamp: Date.now()
  };
}

type Heard = 'start' | 'sync' | 'end' | number;

class AcousticModem {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private source: AudioBufferSourceNode | null = null;
  private isTransmitting = false;
  private isListening = false;
  private loopTimer: number | null = null;
  private frameId: number | null = null;

  private context(): AudioContext {
    this.audioCtx ??= new AudioContext();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume().catch(() => {});
    return this.audioCtx;
  }

  /** Plays one message and resolves when it has finished sounding. */
  private playOnce(beacon: AcousticBeaconPayload, mode: AcousticMode): Promise<void> {
    const ctx = this.context();
    const samples = renderBeacon(beacon, mode, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, samples.length, ctx.sampleRate);
    buffer.copyToChannel(samples, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    this.source = source;
    return new Promise((resolve) => {
      source.onended = () => resolve();
      source.start();
    });
  }

  /** Repeats the message with a short pause, until stopped, so neighbours who arrive later also hear it. */
  startBeaconLoop(beacon: AcousticBeaconPayload, mode: AcousticMode, onCycle?: () => void): void {
    this.stopTransmission();
    this.isTransmitting = true;
    const run = async () => {
      if (!this.isTransmitting) return;
      onCycle?.();
      await this.playOnce(beacon, mode);
      if (this.isTransmitting) this.loopTimer = window.setTimeout(run, 3000);
    };
    run();
  }

  stopTransmission(): void {
    this.isTransmitting = false;
    if (this.loopTimer) window.clearTimeout(this.loopTimer);
    this.loopTimer = null;
    try {
      this.source?.stop();
    } catch {
      // already stopped
    }
    this.source = null;
  }

  async startListening(
    onBeacon: (beacon: AcousticBeaconPayload) => void,
    onSpectrum: ((levels: Uint8Array, heardFreq: number | null) => void) | undefined,
    mode: AcousticMode
  ): Promise<boolean> {
    this.stopListening();
    try {
      const ctx = this.context();
      // The phone's own clean-up of the voice would erase the tones.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      this.micStream = stream;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0;
      ctx.createMediaStreamSource(stream).connect(analyser);
      this.isListening = true;

      const tones = TONES[mode];
      const binHz = ctx.sampleRate / analyser.fftSize;
      const levels = new Uint8Array(analyser.frequencyBinCount);
      const lowBin = Math.floor((Math.min(tones.end, tones.start, tones.base) - 150) / binHz);
      const highBin = Math.ceil((Math.max(tones.sync, tones.base + REPEAT * tones.step) + 150) / binHz);
      const markerTolerance = tones.step;
      const digitTolerance = tones.step * 0.45;

      const classify = (freq: number): Heard | null => {
        if (Math.abs(freq - tones.start) < markerTolerance) return 'start';
        if (Math.abs(freq - tones.sync) < markerTolerance) return 'sync';
        if (Math.abs(freq - tones.end) < markerTolerance) return 'end';
        const symbol = Math.round((freq - tones.base) / tones.step);
        if (symbol < 0 || symbol > REPEAT) return null;
        return Math.abs(freq - (tones.base + symbol * tones.step)) < digitTolerance ? symbol : null;
      };

      let candidate: Heard | null = null;
      let repeats = 0;
      let lastAccepted: Heard | null = null;
      let lastAcceptedAt = 0;
      let state: 'idle' | 'waiting_sync' | 'data' = 'idle';
      let digits: number[] = [];
      let previousDigit: number | null = null;
      let loudest = 0;

      const accept = (heard: Heard) => {
        if (heard === 'start') {
          state = 'waiting_sync';
          return;
        }
        if (heard === 'sync') {
          if (state === 'waiting_sync') {
            state = 'data';
            digits = [];
            previousDigit = null;
            loudest = 0;
          }
          return;
        }
        if (state !== 'data') return;
        if (heard === 'end') {
          const beacon = readMessage(digits);
          if (beacon) onBeacon({ ...beacon, rssi: Math.round((loudest / 255) * 100) });
          state = 'idle';
          return;
        }
        if (heard === REPEAT) {
          if (previousDigit === null) {
            state = 'idle';
            return;
          }
          digits.push(previousDigit);
          previousDigit = null;
        } else {
          digits.push(heard);
          previousDigit = heard;
        }
      };

      const listen = () => {
        if (!this.isListening) return;
        analyser.getByteFrequencyData(levels);

        let peak = 0;
        let peakBin = lowBin;
        const band: number[] = [];
        for (let bin = lowBin; bin <= highBin; bin++) {
          band.push(levels[bin]);
          if (levels[bin] > peak) {
            peak = levels[bin];
            peakBin = bin;
          }
        }
        band.sort((a, b) => a - b);
        const floor = band[Math.floor(band.length / 2)] ?? 0;
        // A tone has to stand out from the room's noise, not just be loud.
        const isTone = peak > 90 && peak > floor + 35;

        // Refine the peak between bins for a more exact frequency.
        const left = levels[peakBin - 1] ?? 0;
        const right = levels[peakBin + 1] ?? 0;
        const shift = left + right - 2 * peak !== 0 ? (0.5 * (left - right)) / (left - 2 * peak + right) : 0;
        const freq = (peakBin + shift) * binHz;
        const heard = isTone ? classify(freq) : null;
        onSpectrum?.(levels.slice(lowBin, highBin + 1), heard === null ? null : freq);

        if (heard !== null && heard === candidate) {
          repeats++;
        } else {
          candidate = heard;
          repeats = 1;
        }
        // Two frames in a row of a new tone count as one symbol.
        if (candidate !== null && repeats === 2 && candidate !== lastAccepted) {
          lastAccepted = candidate;
          lastAcceptedAt = performance.now();
          if (state === 'data') loudest = Math.max(loudest, peak);
          accept(candidate);
        }
        if (state !== 'idle' && performance.now() - lastAcceptedAt > 1500) {
          state = 'idle';
          lastAccepted = null;
        }
        this.frameId = requestAnimationFrame(listen);
      };
      this.frameId = requestAnimationFrame(listen);
      return true;
    } catch (err) {
      console.warn('No se pudo usar el micrófono para el radar:', err);
      this.stopListening();
      return false;
    }
  }

  stopListening(): void {
    this.isListening = false;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.micStream = null;
  }
}

export const acousticModem = new AcousticModem();

const STORAGE_KEY = 'ayllu_acoustic_beacons_v1';
const SAME_MESSAGE_MS = 10 * 60_000;

/** The sender repeats the message every few seconds: keep one entry per message, updated. */
export function saveCapturedBeacon(beacon: AcousticBeaconPayload): AcousticBeaconPayload[] {
  const sameAs = (other: AcousticBeaconPayload) =>
    other.sender === beacon.sender && other.type === beacon.type && other.details === beacon.details &&
    beacon.timestamp - other.timestamp < SAME_MESSAGE_MS;
  const list = getCapturedBeacons();
  const existing = list.find(sameAs);
  const entry = existing ? { ...beacon, id: existing.id, rssi: Math.max(beacon.rssi ?? 0, existing.rssi ?? 0) } : beacon;
  const updated = [entry, ...list.filter((item) => item.id !== entry.id)].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // the list still shows; it just will not survive closing the app
  }
  return updated;
}

export function getCapturedBeacons(): AcousticBeaconPayload[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as AcousticBeaconPayload[];
    // Entries made by an earlier "test" button were never heard: they must not pass for real.
    return saved.filter((item) => !item.id.startsWith('demo_'));
  } catch {
    return [];
  }
}

export function clearCapturedBeacons(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clear
  }
}
