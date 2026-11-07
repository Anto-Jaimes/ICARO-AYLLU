/**
 * Web Audio API synthesizer for the Community Emergency Siren & Whistle.
 * Works 100% offline, requires zero external audio files.
 */

class NeighborhoodSiren {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying = false;

  public startSiren(): boolean {
    if (this.isPlaying) return true;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();

      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      // Master oscillator (alarm tone)
      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sawtooth';
      this.osc.frequency.setValueAtTime(750, this.ctx.currentTime);

      // LFO for pitch modulation (wailing siren effect between 600Hz and 1100Hz)
      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(1.8, this.ctx.currentTime); // 1.8 cycles per second

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(350, this.ctx.currentTime); // Depth of modulation

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc.frequency);

      // Master Volume Gain
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.osc.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc.start();
      this.lfo.start();
      this.isPlaying = true;
      return true;
    } catch (err) {
      console.warn('Web Audio not allowed or failed:', err);
      return false;
    }
  }

  public stopSiren(): void {
    if (!this.isPlaying) return;

    try {
      if (this.osc) {
        this.osc.stop();
        this.osc.disconnect();
      }
      if (this.lfo) {
        this.lfo.stop();
        this.lfo.disconnect();
      }
      if (this.ctx) {
        this.ctx.close();
      }
    } catch (err) {
      console.warn('Error stopping siren:', err);
    } finally {
      this.osc = null;
      this.lfo = null;
      this.lfoGain = null;
      this.gainNode = null;
      this.ctx = null;
      this.isPlaying = false;
    }
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }
}

export const communitySiren = new NeighborhoodSiren();
