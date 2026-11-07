/**
 * Reproductor de Alarma Sonora Vecinal.
 * Utiliza el archivo oficial descargado (/alarm.mp3) y cuenta con fallback
 * sintético mediante Web Audio API en caso de que el navegador restrinja la carga de archivos.
 */

class NeighborhoodSiren {
  private audioElement: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private isPlaying = false;

  public startSiren(): boolean {
    if (this.isPlaying) return true;

    try {
      // 1. Intentar reproducir el archivo de audio real descargado (/alarm.mp3)
      if (!this.audioElement) {
        this.audioElement = new Audio('/alarm.mp3');
        this.audioElement.loop = true;
      }
      
      const playPromise = this.audioElement.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          this.isPlaying = true;
        }).catch((err) => {
          console.warn('Fallback a sintetizador Web Audio por restricción:', err);
          this.startSyntheticSiren();
        });
      }
      this.isPlaying = true;
      return true;
    } catch {
      return this.startSyntheticSiren();
    }
  }

  private startSyntheticSiren(): boolean {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      this.osc = this.ctx.createOscillator();
      this.osc.type = 'sawtooth';
      this.osc.frequency.setValueAtTime(750, this.ctx.currentTime);

      this.lfo = this.ctx.createOscillator();
      this.lfo.frequency.setValueAtTime(1.8, this.ctx.currentTime);

      this.lfoGain = this.ctx.createGain();
      this.lfoGain.gain.setValueAtTime(350, this.ctx.currentTime);

      this.lfo.connect(this.lfoGain);
      this.lfoGain.connect(this.osc.frequency);

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.35, this.ctx.currentTime);

      this.osc.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);

      this.osc.start();
      this.lfo.start();
      this.isPlaying = true;
      return true;
    } catch {
      return false;
    }
  }

  public stopSiren(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }

    if (this.osc) {
      try {
        this.osc.stop();
        this.osc.disconnect();
      } catch {}
      this.osc = null;
    }
    if (this.lfo) {
      try {
        this.lfo.stop();
        this.lfo.disconnect();
      } catch {}
      this.lfo = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
    this.isPlaying = false;
  }

  public isSirenActive(): boolean {
    return this.isPlaying;
  }
}

export const communitySiren = new NeighborhoodSiren();
