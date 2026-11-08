/**
 * Rubble rescue, without internet.
 *
 * 1. Wall listener: a rescuer rests the phone on a wall or a pipe and it counts the knocks of someone
 *    trapped behind it. A knock that travels through concrete arrives as a low thump; voices carry
 *    their strength in the middle tones and claps or falling objects in the high ones. So a knock is
 *    counted only when the low band jumps above the room's own noise while the others barely move.
 * 2. Hands-free: the trapped person shouts twice, in any language ("¡auxilio!", "¡yanapay!"), and the
 *    phone sounds its alarm so rescuers can find it. A shout is loud and held; a conversation is made of
 *    short syllables, so only sounds held for over half a second count.
 *
 * Tuned with recorded sounds played as the microphone: rhythmic and soft knocks, a single knock,
 * claps, a conversation, shouts and silence. The phone's noise suppression is switched off: it would
 * erase exactly the knocks and shouts this is listening for.
 */

export interface SurvivalPatternMatch {
  timestamp: number;
  tapCount: number;
  confidence: number;
  intervalMs: number;
}

interface Microphone {
  ctx: AudioContext;
  stream: MediaStream;
  analyser: AnalyserNode;
  spectrum: Float32Array<ArrayBuffer>;
  binHz: number;
}

const TICK_MS = 20;

async function openMicrophone(): Promise<Microphone> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
  });
  const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0;
  ctx.createMediaStreamSource(stream).connect(analyser);
  return { ctx, stream, analyser, spectrum: new Float32Array(analyser.frequencyBinCount), binHz: ctx.sampleRate / analyser.fftSize };
}

function closeMicrophone(mic: Microphone | null): void {
  mic?.stream.getTracks().forEach((track) => track.stop());
  mic?.ctx.close().catch(() => {});
}

/** Average power of a band of frequencies, in decibels. */
function bandDb(mic: Microphone, from: number, to: number): number {
  const first = Math.max(1, Math.floor(from / mic.binHz));
  const last = Math.min(mic.spectrum.length - 1, Math.ceil(to / mic.binHz));
  let power = 0;
  for (let i = first; i <= last; i++) power += 10 ** (mic.spectrum[i] / 10);
  return 10 * Math.log10(power / (last - first + 1) + 1e-20);
}

/**
 * The room's own noise in one band. It drops at once with the noise, rises slowly with it, and does
 * not learn from a knock or a shout while it lasts. Until the microphone really starts it hears pure
 * silence (-200 dB): learning from that made every later sound look like a knock that never ended.
 * So it waits for real sound and learns the room for half a second before judging anything.
 */
const LEARNING_TICKS = 25;

class NoiseFloor {
  private level: number | null = null;
  private learned = 0;

  rise(db: number): number {
    if (db < -150) return 0;
    if (this.level === null || this.learned < LEARNING_TICKS) {
      this.level = this.level === null ? db : this.level + (db - this.level) * 0.3;
      this.learned++;
      return 0;
    }
    const rise = db - this.level;
    if (rise < 0) this.level += rise * 0.3;
    else if (rise < 6) this.level += rise * 0.05;
    else this.level += rise * 0.002;
    return rise;
  }
}

const LOW: [number, number] = [40, 400];
const MID: [number, number] = [500, 2000];
const HIGH: [number, number] = [2000, 8000];
const KNOCK_RISE_DB = 12;
const OTHERS_BELOW_DB = 8;
const KNOCK_MAX_MS = 300;

class GeophoneDetector {
  private mic: Microphone | null = null;
  private timer: number | null = null;

  /** Resolves false when the microphone cannot be used. */
  public async startListening(
    onVibrationTick: (level: number, isKnock: boolean) => void,
    onPatternDetected: (match: SurvivalPatternMatch) => void
  ): Promise<boolean> {
    this.stop();
    try {
      this.mic = await openMicrophone();
    } catch {
      return false;
    }
    const mic = this.mic;
    const floors = { low: new NoiseFloor(), mid: new NoiseFloor(), high: new NoiseFloor() };
    let startedAt: number | null = null;
    let isCandidate = false;
    let knocks: number[] = [];

    this.timer = window.setInterval(() => {
      mic.analyser.getFloatFrequencyData(mic.spectrum);
      const low = floors.low.rise(bandDb(mic, ...LOW));
      const others = Math.max(floors.mid.rise(bandDb(mic, ...MID)), floors.high.rise(bandDb(mic, ...HIGH)));
      const now = performance.now();
      let isKnock = false;

      if (startedAt === null && low >= KNOCK_RISE_DB) {
        startedAt = now;
        isCandidate = others <= low - OTHERS_BELOW_DB;
      } else if (startedAt !== null) {
        // Anything bright or voiced during the sound means it was not a knock through a wall.
        if (others > low - OTHERS_BELOW_DB && low >= KNOCK_RISE_DB) isCandidate = false;
        if (low < 6) {
          // A knock is over quickly; a long sound is a voice or a machine.
          if (isCandidate && now - startedAt <= KNOCK_MAX_MS) {
            isKnock = true;
            knocks = [...knocks.filter((at) => now - at < 3500), startedAt];
            const match = rhythm(knocks);
            if (match) {
              knocks = [];
              onPatternDetected(match);
            }
          }
          startedAt = null;
        }
      }
      onVibrationTick(Math.max(0, Math.min(100, Math.round(low * 3))), isKnock);
    }, TICK_MS);
    return true;
  }

  public stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    closeMicrophone(this.mic);
    this.mic = null;
  }

  public getStatus() {
    return { isListening: this.timer !== null };
  }
}

/** Three knocks at a steady pace, like someone calling: not three random noises. */
function rhythm(knocks: number[]): SurvivalPatternMatch | null {
  if (knocks.length < 3) return null;
  const [first, second, third] = knocks.slice(-3);
  const gapA = second - first;
  const gapB = third - second;
  const isHumanPace = (gap: number) => gap >= 280 && gap <= 1600;
  const unevenness = Math.abs(gapA - gapB);
  if (!isHumanPace(gapA) || !isHumanPace(gapB) || unevenness >= 450) return null;
  return {
    timestamp: Date.now(),
    tapCount: 3,
    confidence: Math.max(50, Math.min(98, Math.round(100 - unevenness / 10))),
    intervalMs: Math.round((gapA + gapB) / 2)
  };
}

export const geophoneDetector = new GeophoneDetector();

const VOICE: [number, number] = [250, 3000];
const SHOUT_RISE_DB = 25;
const SHOUT_MIN_MS = 600;
const SHOUTS_NEEDED = 2;
const SHOUTS_WITHIN_MS = 8000;

class HandsFreeSentinel {
  private mic: Microphone | null = null;
  private timer: number | null = null;

  /** Resolves false when the microphone cannot be used. Calls onTriggered once, then stops listening. */
  public async startMonitoring(onTriggered: () => void): Promise<boolean> {
    this.stop();
    try {
      this.mic = await openMicrophone();
    } catch {
      return false;
    }
    const mic = this.mic;
    const floor = new NoiseFloor();
    let loudSince: number | null = null;
    let counted = false;
    let shouts: number[] = [];

    this.timer = window.setInterval(() => {
      mic.analyser.getFloatFrequencyData(mic.spectrum);
      const rise = floor.rise(bandDb(mic, ...VOICE));
      const now = performance.now();
      if (rise < SHOUT_RISE_DB) {
        loudSince = null;
        counted = false;
        return;
      }
      loudSince ??= now;
      if (counted || now - loudSince < SHOUT_MIN_MS) return;
      counted = true;
      shouts = [...shouts.filter((at) => now - at < SHOUTS_WITHIN_MS), now];
      if (shouts.length >= SHOUTS_NEEDED) {
        this.stop();
        onTriggered();
      }
    }, TICK_MS);
    return true;
  }

  public stop(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    closeMicrophone(this.mic);
    this.mic = null;
  }

  public getStatus() {
    return { isMonitoring: this.timer !== null };
  }
}

export const handsFreeSentinel = new HandsFreeSentinel();
