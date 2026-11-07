/**
 * Web Speech Synthesis Audio Guide for universal accessibility.
 * Reads screen descriptions out loud for elderly, visually impaired,
 * and low-literacy users. Works 100% offline without internet.
 */

class AudioGuideService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public speak(text: string, onStateChange?: (speaking: boolean) => void): boolean {
    if (!this.synth) return false;

    // If already speaking, stop
    if (this.synth.speaking) {
      this.stop();
      return false;
    }

    this.synth.cancel(); // Clear any queued utterances

    this.onStateChangeCallback = onStateChange || null;
    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = 'es-PE'; // Spanish (Peru / Latin America)
    this.currentUtterance.rate = 0.92; // Slightly slower, calm and very clear pace
    this.currentUtterance.pitch = 1.0;

    this.currentUtterance.onstart = () => {
      if (this.onStateChangeCallback) this.onStateChangeCallback(true);
    };

    this.currentUtterance.onend = () => {
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      this.currentUtterance = null;
    };

    this.currentUtterance.onerror = (e) => {
      console.warn('SpeechSynthesis error:', e);
      if (this.onStateChangeCallback) this.onStateChangeCallback(false);
      this.currentUtterance = null;
    };

    this.synth.speak(this.currentUtterance);
    return true;
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel();
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return Boolean(this.synth?.speaking);
  }
}

export const audioGuide = new AudioGuideService();
