/**
 * Emergency Radio Service: Radio Nacional del Perú (103.9 FM - IRTP)
 * Provides official 1-touch low-bandwidth emergency broadcast audio streaming.
 * Operates during severe natural disasters (earthquakes, tsunamis, massive blackouts)
 * to broadcast official announcements from INDECI, COEN, and the Peruvian Government.
 * 
 * Implements resilient multi-server failover and audio buffer management.
 */

export type RadioStatus = 'stopped' | 'buffering' | 'playing' | 'error';

type StateListener = (status: RadioStatus) => void;

// Official Radio Nacional del Perú (IRTP) resilient audio stream endpoints
const RADIO_STREAMS = [
  'https://stream.zeno.fm/4w9u7f8s208uv',
  'https://server6.hostradioperu.com:8234/stream',
  'https://icecast.perustream.com/radionacional.mp3'
];

class EmergencyRadioService {
  private audio: HTMLAudioElement | null = null;
  private status: RadioStatus = 'stopped';
  private currentStreamIndex = 0;
  private listeners: Set<StateListener> = new Set();
  private retryTimeout: number | null = null;

  constructor() {
    // Singleton
  }

  public getStatus(): RadioStatus {
    return this.status;
  }

  public isPlaying(): boolean {
    return this.status === 'playing' || this.status === 'buffering';
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private notify(newStatus: RadioStatus) {
    this.status = newStatus;
    this.listeners.forEach((fn) => fn(newStatus));
  }

  public play() {
    this.stop();
    this.notify('buffering');

    const streamUrl = RADIO_STREAMS[this.currentStreamIndex];
    const audio = new Audio();
    audio.preload = 'none';
    audio.crossOrigin = 'anonymous';
    audio.src = streamUrl;

    audio.onplaying = () => {
      this.notify('playing');
    };

    audio.onwaiting = () => {
      if (this.status !== 'stopped') this.notify('buffering');
    };

    audio.onerror = () => {
      // Stream failed, attempt next spare stream
      console.warn(`Stream ${streamUrl} failed, trying spare emergency server...`);
      this.currentStreamIndex = (this.currentStreamIndex + 1) % RADIO_STREAMS.length;
      
      if (this.currentStreamIndex === 0) {
        // Cycled through all, brief delay before reconnecting
        this.notify('error');
        this.retryTimeout = window.setTimeout(() => {
          if (this.status !== 'stopped') this.play();
        }, 5000);
      } else {
        this.play();
      }
    };

    this.audio = audio;
    audio.play().catch(() => {
      this.notify('error');
    });
  }

  public stop() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    if (this.audio) {
      try {
        this.audio.pause();
        this.audio.src = '';
        this.audio.load();
      } catch {}
      this.audio = null;
    }
    this.notify('stopped');
  }

  public toggle(): RadioStatus {
    if (this.isPlaying()) {
      this.stop();
      return 'stopped';
    } else {
      this.play();
      return 'buffering';
    }
  }
}

export const emergencyRadio = new EmergencyRadioService();
