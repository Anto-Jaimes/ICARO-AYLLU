/**
 * Reads a screen aloud for people who cannot read it well. On the phone it uses the voice
 * installed on Android, which works without internet: the app's WebView has no voice of its own.
 * On the web it uses the browser's voices.
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const SPANISH = ['es-PE', 'es-US', 'es-419', 'es-MX', 'es-ES'];

export function canSpeak(): boolean {
  return Capacitor.isNativePlatform() || 'speechSynthesis' in window;
}

async function pickSpanish(): Promise<string | null> {
  for (const lang of SPANISH) {
    try {
      if ((await TextToSpeech.isLanguageSupported({ lang })).supported) return lang;
    } catch {
      // try the next one
    }
  }
  // Browsers list their voices late; they still find a Spanish one from the language alone.
  return Capacitor.isNativePlatform() ? null : 'es-ES';
}

/** Resolves when the reading ends. Rejects when the phone has no Spanish voice or it is stopped. */
export async function speak(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    const lang = await pickSpanish();
    if (!lang) throw new Error('Sin voz en español');
    await TextToSpeech.speak({ text, lang, rate: 0.92, pitch: 1, volume: 1, category: 'playback' });
    return;
  }

  // Web fallback with window.speechSynthesis
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE';
    utterance.rate = 0.92;
    window.speechSynthesis.speak(utterance);
    return;
  }
}

export function stopSpeaking(): void {
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {});
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
