/**
 * Reads a screen or message aloud for people who cannot read it well.
 * Supports Peruvian Spanish, Quechua Sureño, Quechua Central, Aimara, Asháninka and English.
 * On Android it uses the voice installed on Android (with fallback to Peruvian Spanish),
 * which works without internet.
 * On web it uses the browser's speechSynthesis.
 */
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { Lang } from '../i18n/LanguageContext';
import { getLang } from '../i18n/translate';

const VOICE_PREFERENCES: Record<Lang, string[]> = {
  es: ['es-PE', 'es-419', 'es-US', 'es-MX', 'es-ES'],
  qu: ['qu-PE', 'qu', 'es-PE', 'es-419'],
  'qu-cen': ['qu-PE', 'qu', 'es-PE', 'es-419'],
  ay: ['ay-PE', 'ay-BO', 'ay', 'es-PE', 'es-419'],
  cni: ['cni-PE', 'cni', 'es-PE', 'es-419'],
  en: ['en-US', 'en-GB', 'en']
};

export function canSpeak(): boolean {
  return Capacitor.isNativePlatform() || 'speechSynthesis' in window;
}

async function pickVoice(lang: Lang = getLang()): Promise<string> {
  const candidates = VOICE_PREFERENCES[lang] ?? VOICE_PREFERENCES.es;
  if (Capacitor.isNativePlatform()) {
    for (const c of candidates) {
      try {
        if ((await TextToSpeech.isLanguageSupported({ lang: c })).supported) return c;
      } catch {
        // try next
      }
    }
    return 'es-PE';
  }

  // In the browser
  if ('speechSynthesis' in window) {
    const voices = window.speechSynthesis.getVoices();
    for (const c of candidates) {
      const match = voices.find((v) => v.lang.toLowerCase().startsWith(c.toLowerCase()));
      if (match) return match.lang;
    }
  }
  return candidates[0] ?? 'es-PE';
}

/** Resolves when the reading ends. Rejects when speech fails. */
// Reads in the language on screen unless told otherwise.
export async function speak(text: string, lang: Lang = getLang()): Promise<void> {
  if (!text) return;
  const targetVoice = await pickVoice(lang);
  // Slightly calmer pace for indigenous languages so syllables and glottal/aspirated sounds are heard clearly
  const rate = lang === 'en' ? 0.95 : lang === 'es' ? 0.92 : 0.88;

  if (Capacitor.isNativePlatform()) {
    await TextToSpeech.speak({
      text,
      lang: targetVoice,
      rate,
      pitch: 1,
      volume: 1,
      category: 'playback'
    });
    return;
  }

  if (!('speechSynthesis' in window)) throw new Error('Sin síntesis de voz disponible');
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = targetVoice;
  utterance.rate = rate;

  await new Promise<void>((resolve, reject) => {
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error));
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking(): void {
  if (Capacitor.isNativePlatform()) {
    TextToSpeech.stop().catch(() => {});
  } else if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
