/**
 * Rubble Rescue Engine for AYLLU
 * 1. Digital Geophone / Stethoscope: Detects human tapping/knocking through walls/rubble.
 * 2. Hands-Free Trapped Sentinel: Activates SOS when a trapped victim screams "¡AUXILIO!" or "¡YANAPAY!".
 * 
 * 100% OFFLINE: Uses native Web Audio API, Low-Pass Biquad filtering, and Accelerometer sensors.
 */

export interface KnockEvent {
  timestamp: number;
  energy: number;
}

export interface SurvivalPatternMatch {
  timestamp: number;
  tapCount: number;
  confidence: number;
  intervalMs: number;
}

class GeophoneDetector {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening = false;
  private animFrameId: number | null = null;

  // Pattern detection state (looking for 3 knocks in cadence)
  private recentKnocks: KnockEvent[] = [];
  private lastKnockTime = 0;
  private motionListener: ((e: DeviceMotionEvent) => void) | null = null;
  private motionEnergy = 0;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public async startListening(
    onVibrationTick: (level: number, isKnock: boolean) => void,
    onPatternDetected: (match: SurvivalPatternMatch) => void
  ): Promise<boolean> {
    try {
      this.stop();
      const ctx = this.getAudioContext();

      // 1. Microphone setup with mechanical acoustic filter (Low-pass 400Hz to catch impacts through walls)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });
      this.micStream = stream;

      const source = ctx.createMediaStreamSource(stream);
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(450, ctx.currentTime); // Conduction through concrete is low freq

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.15;

      source.connect(lowpass);
      lowpass.connect(analyser);
      this.analyser = analyser;
      this.isListening = true;

      // 2. Accelerometer setup to sense physical surface micro-tremors
      this.motionListener = (e: DeviceMotionEvent) => {
        const acc = e.accelerationIncludingGravity;
        if (acc) {
          const z = Math.abs(acc.z ?? 0);
          const x = Math.abs(acc.x ?? 0);
          const y = Math.abs(acc.y ?? 0);
          const delta = Math.sqrt(x * x + y * y + z * z);
          if (delta > 10.5 || delta < 9.2) {
            this.motionEnergy = Math.min(100, Math.round(Math.abs(delta - 9.8) * 20));
          } else {
            this.motionEnergy = Math.max(0, this.motionEnergy - 2);
          }
        }
      };
      window.addEventListener('devicemotion', this.motionListener, true);

      // 3. Audio analysis loop
      const buffer = new Uint8Array(analyser.frequencyBinCount);
      let baseline = 15;

      const loop = () => {
        if (!this.isListening) return;

        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const audioEnergy = sum / buffer.length;

        // Combined audio + accelerometer energy
        const combinedLevel = Math.min(100, Math.round((audioEnergy * 0.7) + (this.motionEnergy * 0.3)));
        const now = performance.now();

        // Threshold detection for an impact spike (knock)
        const threshold = Math.max(38, baseline * 1.8);
        const isKnock = combinedLevel > threshold && (now - this.lastKnockTime > 260);

        if (isKnock) {
          this.lastKnockTime = now;
          this.recentKnocks.push({ timestamp: now, energy: combinedLevel });

          // Keep only knocks within last 4 seconds
          this.recentKnocks = this.recentKnocks.filter((k) => now - k.timestamp < 3500);

          // Check if we have 3 consecutive knocks spaced between 300ms and 1500ms
          if (this.recentKnocks.length >= 3) {
            const count = this.recentKnocks.length;
            const k3 = this.recentKnocks[count - 1];
            const k2 = this.recentKnocks[count - 2];
            const k1 = this.recentKnocks[count - 3];

            const diff1 = k2.timestamp - k1.timestamp;
            const diff2 = k3.timestamp - k2.timestamp;

            // Cadence check: are intervals regular?
            if (diff1 >= 280 && diff1 <= 1600 && diff2 >= 280 && diff2 <= 1600) {
              const cadenceVariance = Math.abs(diff1 - diff2);
              if (cadenceVariance < 450) {
                // Human rhythmic knocking matched!
                onPatternDetected({
                  timestamp: Date.now(),
                  tapCount: 3,
                  confidence: Math.min(98, Math.round(100 - (cadenceVariance / 10))),
                  intervalMs: Math.round((diff1 + diff2) / 2)
                });
                this.recentKnocks = []; // Reset after match
              }
            }
          }
        }

        // Slowly update baseline
        baseline = baseline * 0.95 + audioEnergy * 0.05;

        onVibrationTick(combinedLevel, isKnock);
        this.animFrameId = requestAnimationFrame(loop);
      };

      this.animFrameId = requestAnimationFrame(loop);
      return true;
    } catch (err) {
      console.warn('Geophone audio/motion access error:', err);
      this.stop();
      return false;
    }
  }

  public stop(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.motionListener) {
      window.removeEventListener('devicemotion', this.motionListener, true);
      this.motionListener = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.analyser = null;
    this.recentKnocks = [];
  }

  public getStatus() {
    return { isListening: this.isListening };
  }
}

export const geophoneDetector = new GeophoneDetector();

/**
 * Hands-Free Sentinel for Trapped Victims
 * Awakens when it detects loud distress words: "AUXILIO", "AYUDA", "YANAPAY", or 3 loud shouts.
 */
class HandsFreeSentinel {
  private recognition: any = null;
  private isMonitoring = false;
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private animId: number | null = null;

  public startMonitoring(onTriggered: (phrase: string) => void): boolean {
    this.stop();
    this.isMonitoring = true;

    // 1. Try Speech Recognition (Offline native on Android/Chrome)
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'es-PE';

        rec.onresult = (e: any) => {
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const transcript = e.results[i][0].transcript.toLowerCase();
            if (
              transcript.includes('auxilio') ||
              transcript.includes('ayuda') ||
              transcript.includes('socorro') ||
              transcript.includes('yanapay') ||
              transcript.includes('por favor') ||
              transcript.includes('atrapado')
            ) {
              onTriggered(transcript.trim());
              return;
            }
          }
        };

        rec.onerror = () => {
          if (this.isMonitoring) {
            setTimeout(() => {
              try { rec.start(); } catch {}
            }, 1000);
          }
        };

        rec.onend = () => {
          if (this.isMonitoring) {
            try { rec.start(); } catch {}
          }
        };

        rec.start();
        this.recognition = rec;
      } catch {}
    }

    // 2. Audio Energy Burst Fallback (In case speech recognition is hindered by dust or offline)
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      if (!this.isMonitoring) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      this.micStream = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      this.audioCtx = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const buf = new Uint8Array(analyser.frequencyBinCount);
      let shoutCount = 0;
      let lastShoutTime = 0;

      const checkShout = () => {
        if (!this.isMonitoring) return;
        analyser.getByteFrequencyData(buf);
        let max = 0;
        for (let i = 0; i < buf.length; i++) if (buf[i] > max) max = buf[i];

        const now = performance.now();
        // Sustained loud scream or whistle threshold
        if (max > 220 && (now - lastShoutTime > 400)) {
          lastShoutTime = now;
          shoutCount++;
          if (shoutCount >= 2) {
            onTriggered('¡Grito de Auxilio Detectado!');
            shoutCount = 0;
          }
        }

        if (now - lastShoutTime > 3000) shoutCount = 0;

        this.animId = requestAnimationFrame(checkShout);
      };
      this.animId = requestAnimationFrame(checkShout);
    }).catch(() => {});

    return true;
  }

  public stop(): void {
    this.isMonitoring = false;
    if (this.recognition) {
      try { this.recognition.stop(); } catch {}
      this.recognition = null;
    }
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.audioCtx) {
      try { this.audioCtx.close(); } catch {}
      this.audioCtx = null;
    }
  }

  public getStatus() {
    return { isMonitoring: this.isMonitoring };
  }
}

export const handsFreeSentinel = new HandsFreeSentinel();
