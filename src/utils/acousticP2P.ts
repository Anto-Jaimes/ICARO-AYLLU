/**
 * Acoustic P2P Data-over-Sound Modem for AYLLU
 * Inspired by Alipay Sound Wave Pay (China) and Google Nearby / Chirp.io (USA)
 * 
 * Transmits and receives emergency beacons, medical IDs, and resource alerts
 * directly through device speaker and microphone using Frequency Shift Keying (FSK).
 * 100% OFFLINE: Requires ZERO internet, ZERO mobile network, and ZERO Bluetooth pairing.
 */

export type BeaconType = 
  | 'SOS_TRAPPED' 
  | 'SOS_MEDICAL' 
  | 'RESOURCE_WATER' 
  | 'RESOURCE_FIRSTAID' 
  | 'CHECKIN_SAFE';

export interface AcousticBeaconPayload {
  id: string;
  sender: string;
  type: BeaconType;
  details: string;
  lat?: number;
  lng?: number;
  timestamp: number;
  rssi?: number; // signal strength 0-100
}

export type AcousticMode = 'audible' | 'ultrasonic';

// Tone Configurations
const CONFIG = {
  audible: {
    preamble1: 1400,
    preamble2: 3000,
    baseFreq: 1750,
    stepFreq: 65, // 16 tones: 1750 Hz to 2725 Hz
    symbolDuration: 0.055, // 55ms per nibble (~18 symbols/sec = 9 bytes/sec)
  },
  ultrasonic: {
    preamble1: 17500,
    preamble2: 20200,
    baseFreq: 18200,
    stepFreq: 85, // 16 tones: 18200 Hz to 19475 Hz
    symbolDuration: 0.065, // 65ms per nibble
  }
};

const TYPE_CODES: Record<BeaconType, string> = {
  SOS_TRAPPED: '1',
  SOS_MEDICAL: '2',
  RESOURCE_WATER: '3',
  RESOURCE_FIRSTAID: '4',
  CHECKIN_SAFE: '5',
};

const CODE_TO_TYPE: Record<string, BeaconType> = {
  '1': 'SOS_TRAPPED',
  '2': 'SOS_MEDICAL',
  '3': 'RESOURCE_WATER',
  '4': 'RESOURCE_FIRSTAID',
  '5': 'CHECKIN_SAFE',
};

export const BEACON_LABELS: Record<BeaconType, { title: string; color: string; desc: string }> = {
  SOS_TRAPPED: { title: '¡Auxilio! Persona Atrapada', color: 'bg-red-600 text-white', desc: 'Vecino atrapado bajo escombros o sin salida' },
  SOS_MEDICAL: { title: 'Emergencia Médica Crítica', color: 'bg-rose-700 text-white', desc: 'Requiere paramédico, oxígeno o botiquín urgente' },
  RESOURCE_WATER: { title: 'Punto de Agua Potable', color: 'bg-blue-600 text-white', desc: 'Vecino con reserva de agua para compartir' },
  RESOURCE_FIRSTAID: { title: 'Botiquín / Curaciones', color: 'bg-emerald-600 text-white', desc: 'Disponibilidad de gasas, alcohol y vendajes' },
  CHECKIN_SAFE: { title: 'Reporte: Estoy a Salvo', color: 'bg-emerald-700 text-white', desc: 'Vecino confirma que su familia está ilesa' },
};

class AcousticModem {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private isTransmitting = false;
  private isListening = false;
  private loopTimer: number | null = null;
  private animFrameId: number | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Serialize payload into a short wire string:
   * "AY|T|SENDER|DETAILS|LAT,LNG"
   */
  private serialize(beacon: AcousticBeaconPayload): string {
    const code = TYPE_CODES[beacon.type] || '1';
    const cleanSender = (beacon.sender || 'Vecino').substring(0, 15).replace(/\|/g, '');
    const cleanDetails = (beacon.details || '').substring(0, 24).replace(/\|/g, '');
    const coords = beacon.lat && beacon.lng 
      ? `${beacon.lat.toFixed(3)},${beacon.lng.toFixed(3)}` 
      : '0,0';
    return `AY|${code}|${cleanSender}|${cleanDetails}|${coords}`;
  }

  private deserialize(wire: string): AcousticBeaconPayload | null {
    try {
      const parts = wire.split('|');
      if (parts.length < 5 || parts[0] !== 'AY') return null;
      const type = CODE_TO_TYPE[parts[1]] || 'SOS_TRAPPED';
      const sender = parts[2];
      const details = parts[3];
      const [latStr, lngStr] = parts[4].split(',');
      const lat = parseFloat(latStr) || undefined;
      const lng = parseFloat(lngStr) || undefined;

      return {
        id: `sound_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        sender,
        type,
        details,
        lat,
        lng,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  private stringToHex(str: string): string {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
  }

  private hexToString(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substr(i, 2), 16);
      if (!isNaN(code) && code >= 32 && code <= 126) {
        str += String.fromCharCode(code);
      }
    }
    return str;
  }

  /**
   * Play a clean sine wave tone with envelope ramp to prevent clicks
   */
  private playTone(ctx: AudioContext, freq: number, startTime: number, duration: number, volume = 0.6): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    // Smooth envelope attack and decay
    const ramp = Math.min(0.005, duration / 5);
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + ramp);
    gain.gain.setValueAtTime(volume, startTime + duration - ramp);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * Broadcast an acoustic beacon
   */
  public async transmitBeacon(
    beacon: AcousticBeaconPayload, 
    mode: AcousticMode = 'audible',
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const ctx = this.getAudioContext();
    this.isTransmitting = true;

    const wire = this.serialize(beacon);
    const hex = this.stringToHex(wire);
    const conf = CONFIG[mode];

    let t = ctx.currentTime + 0.1;

    // 1. Preamble sync beeps
    this.playTone(ctx, conf.preamble1, t, 0.12, 0.7);
    t += 0.14;
    this.playTone(ctx, conf.preamble2, t, 0.12, 0.7);
    t += 0.16;

    // 2. Play 16-FSK nibbles
    const totalNibbles = hex.length;
    for (let i = 0; i < totalNibbles; i++) {
      if (!this.isTransmitting) break;
      const nibbleVal = parseInt(hex[i], 16); // 0 to 15
      const freq = conf.baseFreq + (nibbleVal * conf.stepFreq);

      this.playTone(ctx, freq, t, conf.symbolDuration, 0.65);
      t += conf.symbolDuration;

      if (onProgress) {
        const pct = Math.round(((i + 1) / totalNibbles) * 100);
        setTimeout(() => onProgress(pct), (t - ctx.currentTime) * 1000);
      }
    }

    // 3. Postamble end tone
    this.playTone(ctx, conf.preamble1, t, 0.08, 0.5);
    t += 0.1;

    // Wait for playback completion
    const waitMs = Math.max(0, (t - ctx.currentTime) * 1000);
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isTransmitting = false;
        resolve();
      }, waitMs);
    });
  }

  /**
   * Start recurring beacon transmission (Loop every 7 seconds)
   */
  public startBeaconLoop(
    beacon: AcousticBeaconPayload,
    mode: AcousticMode = 'audible',
    onCycle?: () => void
  ): void {
    this.stopTransmission();
    this.isTransmitting = true;

    const run = async () => {
      if (!this.isTransmitting) return;
      if (onCycle) onCycle();
      await this.transmitBeacon(beacon, mode);
      if (this.isTransmitting) {
        this.loopTimer = window.setTimeout(run, 6500);
      }
    };

    run();
  }

  public stopTransmission(): void {
    this.isTransmitting = false;
    if (this.loopTimer) {
      clearTimeout(this.loopTimer);
      this.loopTimer = null;
    }
  }

  /**
   * Start listening for acoustic beacons via microphone
   */
  public async startListening(
    onBeaconReceived: (beacon: AcousticBeaconPayload) => void,
    onSpectrum?: (freqData: Uint8Array, activeFreq: number | null) => void,
    mode: AcousticMode = 'audible'
  ): Promise<boolean> {
    try {
      this.stopListening();
      const ctx = this.getAudioContext();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      this.micStream = stream;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      this.analyser = analyser;
      this.isListening = true;

      const conf = CONFIG[mode];
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const sampleRate = ctx.sampleRate;
      const binHz = sampleRate / analyser.fftSize;

      let state: 'IDLE' | 'PREAMBLE_1' | 'PREAMBLE_2' | 'DATA' = 'IDLE';
      let capturedNibbles: string[] = [];
      let lastSymbolTime = 0;

      const getBinIndex = (freq: number) => Math.round(freq / binHz);

      const findDominantInBand = (minFreq: number, maxFreq: number): { freq: number; amp: number } => {
        analyser.getByteFrequencyData(dataArray);
        const minBin = Math.max(0, getBinIndex(minFreq));
        const maxBin = Math.min(bufferLength - 1, getBinIndex(maxFreq));

        let maxAmp = 0;
        let bestBin = 0;
        for (let i = minBin; i <= maxBin; i++) {
          if (dataArray[i] > maxAmp) {
            maxAmp = dataArray[i];
            bestBin = i;
          }
        }
        return { freq: bestBin * binHz, amp: maxAmp };
      };

      const listenLoop = () => {
        if (!this.isListening) return;

        const bandMin = conf.preamble1 - 200;
        const bandMax = Math.max(conf.preamble2, conf.baseFreq + 16 * conf.stepFreq) + 200;
        const { freq, amp } = findDominantInBand(bandMin, bandMax);

        if (onSpectrum) {
          onSpectrum(dataArray.slice(0, 128), amp > 110 ? freq : null);
        }

        const now = performance.now();
        const threshold = 120; // amplitude threshold

        if (amp > threshold) {
          // Check Preamble 1
          if (state === 'IDLE' && Math.abs(freq - conf.preamble1) < 50) {
            state = 'PREAMBLE_1';
            lastSymbolTime = now;
          }
          // Check Preamble 2
          else if (state === 'PREAMBLE_1' && Math.abs(freq - conf.preamble2) < 60) {
            state = 'PREAMBLE_2';
            capturedNibbles = [];
            lastSymbolTime = now;
          }
          // Receiving Nibbles
          else if ((state === 'PREAMBLE_2' || state === 'DATA') && (now - lastSymbolTime) > (conf.symbolDuration * 650)) {
            // Find closest nibble
            let closestNibble = -1;
            let minDiff = 999;
            for (let n = 0; n < 16; n++) {
              const target = conf.baseFreq + (n * conf.stepFreq);
              const diff = Math.abs(freq - target);
              if (diff < minDiff && diff < (conf.stepFreq / 1.7)) {
                minDiff = diff;
                closestNibble = n;
              }
            }

            if (closestNibble >= 0) {
              state = 'DATA';
              capturedNibbles.push(closestNibble.toString(16));
              lastSymbolTime = now;

              // Check if we reached end or can decode
              if (capturedNibbles.length >= 8 && capturedNibbles.length % 2 === 0) {
                const candidateHex = capturedNibbles.join('');
                const candidateStr = this.hexToString(candidateHex);
                if (candidateStr.startsWith('AY|') && candidateStr.split('|').length >= 5) {
                  const beacon = this.deserialize(candidateStr);
                  if (beacon) {
                    beacon.rssi = Math.min(100, Math.round((amp / 255) * 100));
                    onBeaconReceived(beacon);
                    state = 'IDLE';
                    capturedNibbles = [];
                  }
                }
              }
            }
          }
        }

        // Timeout back to idle if no symbol received for 2 seconds
        if (state !== 'IDLE' && (now - lastSymbolTime) > 2200) {
          state = 'IDLE';
          capturedNibbles = [];
        }

        this.animFrameId = requestAnimationFrame(listenLoop);
      };

      this.animFrameId = requestAnimationFrame(listenLoop);
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or audio error:', err);
      this.stopListening();
      return false;
    }
  }

  public stopListening(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.analyser = null;
  }

  public getStatus() {
    return {
      isTransmitting: this.isTransmitting,
      isListening: this.isListening,
    };
  }
}

export const acousticModem = new AcousticModem();

/**
 * Helper to store/load captured beacons in local storage
 */
const STORAGE_KEY = 'ayllu_acoustic_beacons_v1';

export function saveCapturedBeacon(beacon: AcousticBeaconPayload): void {
  try {
    const list = getCapturedBeacons();
    const updated = [beacon, ...list.filter((b) => b.id !== beacon.id)].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function getCapturedBeacons(): AcousticBeaconPayload[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
