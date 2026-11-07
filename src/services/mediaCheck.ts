/**
 * Checks photos and videos on the phone before they are uploaded, so prohibited content
 * never leaves the device. The model loads on first use, not when the app opens.
 *
 * If the check cannot run, the result is "review": unchecked media is never published.
 */

export interface Prediction {
  className: string;
  probability: number;
}

export type MediaOutcome = 'clean' | 'review' | 'blocked';

const MAX_VIDEO_SECONDS = 60;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const VIDEO_FRAMES = 5;
const FRAME_TIMEOUT_MS = 8000;

const BLOCK_EXPLICIT = 0.7;
const REVIEW_EXPLICIT = 0.3;
const REVIEW_SUGGESTIVE = 0.6;

/** Explains a problem with the file, or returns null if it can be checked. */
export function validateFile(file: File): string | null {
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return 'Elige una foto o un video.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'El archivo pesa más de 50 MB. Graba un video más corto o de menor calidad.';
  }
  return null;
}

/** Skin alone is not enough to block: an injured person must reach a human, not vanish. */
export function judgePredictions(predictions: Prediction[]): MediaOutcome {
  const score = (name: string) => predictions.find((p) => p.className === name)?.probability ?? 0;
  const explicit = score('Porn') + score('Hentai');

  if (explicit >= BLOCK_EXPLICIT) return 'blocked';
  if (explicit >= REVIEW_EXPLICIT || score('Sexy') >= REVIEW_SUGGESTIVE) return 'review';
  return 'clean';
}

const WORST_FIRST: MediaOutcome[] = ['blocked', 'review', 'clean'];

export function worstOutcome(outcomes: MediaOutcome[]): MediaOutcome {
  return WORST_FIRST.find((outcome) => outcomes.includes(outcome)) ?? 'review';
}

type Classifier = (element: HTMLImageElement | HTMLVideoElement) => Promise<Prediction[]>;

let classifier: Promise<Classifier> | null = null;

function loadClassifier(): Promise<Classifier> {
  classifier ??= (async () => {
    const [{ load }, { MobileNetV2Model }] = await Promise.all([
      import('nsfwjs/core'),
      import('nsfwjs/models/mobilenet_v2')
    ]);
    const model = await load('MobileNetV2', { modelDefinitions: [MobileNetV2Model] });
    return (element: HTMLImageElement | HTMLVideoElement) => model.classify(element);
  })().catch((err) => {
    classifier = null; // let the next attempt try again
    throw err;
  });
  return classifier;
}

async function checkImage(file: File, classify: Classifier): Promise<MediaOutcome> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return judgePredictions(await classify(image));
  } finally {
    URL.revokeObjectURL(url);
  }
}

function waitFor(video: HTMLVideoElement, event: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Sin respuesta del video: ${event}`)), FRAME_TIMEOUT_MS);
    video.addEventListener(event, () => { clearTimeout(timer); resolve(); }, { once: true });
    video.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Video no legible')); }, { once: true });
  });
}

async function checkVideo(file: File, classify: Classifier): Promise<{ outcome: MediaOutcome; tooLong: boolean }> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = url;
    await waitFor(video, 'loadeddata');

    // Some recorders do not store the length; seeking far ahead makes the browser find it.
    if (!Number.isFinite(video.duration)) {
      video.currentTime = Number.MAX_SAFE_INTEGER;
      await waitFor(video, 'seeked');
    }
    if (!Number.isFinite(video.duration)) return { outcome: 'review', tooLong: false };

    if (video.duration > MAX_VIDEO_SECONDS) return { outcome: 'blocked', tooLong: true };

    const outcomes: MediaOutcome[] = [];
    for (let frame = 0; frame < VIDEO_FRAMES; frame++) {
      video.currentTime = ((frame + 0.5) / VIDEO_FRAMES) * video.duration;
      await waitFor(video, 'seeked');
      outcomes.push(judgePredictions(await classify(video)));
    }
    return { outcome: worstOutcome(outcomes), tooLong: false };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface MediaResult {
  outcome: MediaOutcome;
  /** Set when blocked, to tell the neighbour why. */
  message?: string;
}

export async function inspectMedia(file: File): Promise<MediaResult> {
  try {
    const classify = await loadClassifier();

    if (file.type.startsWith('video/')) {
      const { outcome, tooLong } = await checkVideo(file, classify);
      if (tooLong) return { outcome: 'blocked', message: 'El video dura más de 1 minuto. Graba uno más corto.' };
      return outcome === 'blocked'
        ? { outcome, message: 'Este video no se puede publicar: tiene contenido prohibido.' }
        : { outcome };
    }

    const outcome = await checkImage(file, classify);
    return outcome === 'blocked'
      ? { outcome, message: 'Esta foto no se puede publicar: tiene contenido prohibido.' }
      : { outcome };
  } catch (err) {
    console.warn('No se pudo revisar el archivo; quedará para revisión:', err);
    return { outcome: 'review' };
  }
}
