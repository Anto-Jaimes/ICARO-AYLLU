import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * In the Android app a video without a poster shows the WebView's big grey play icon instead of its
 * first frame (the browser shows the frame). Inside the app this returns that first frame as an image,
 * for the video's `poster`; until it is ready, a transparent pixel keeps the grey icon away.
 * On the web it returns nothing: the browser already shows the first frame.
 */
const IS_NATIVE = Capacitor.isNativePlatform();
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const MAX_WIDTH = 720;
const frames = new Map<string, string>();
let queue: Promise<unknown> = Promise.resolve();

function grabFrame(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const finish = (settle: () => void) => {
      clearTimeout(timer);
      video.removeAttribute('src');
      video.load();
      settle();
    };
    const timer = setTimeout(() => finish(() => reject(new Error('timeout'))), 20000);
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.addEventListener('loadedmetadata', () => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      video.currentTime = Math.min(0.1, duration / 2);
    }, { once: true });
    video.addEventListener('seeked', () => {
      try {
        const scale = Math.min(1, MAX_WIDTH / (video.videoWidth || MAX_WIDTH));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const image = canvas.toDataURL('image/jpeg', 0.8);
        finish(() => resolve(image));
      } catch (error) {
        finish(() => reject(error));
      }
    }, { once: true });
    video.addEventListener('error', () => finish(() => reject(new Error('video'))), { once: true });
    video.src = src;
  });
}

/** One video at a time, so a list of news does not download every video at once. */
function firstFrame(src: string): Promise<string> {
  const job = queue.then(() => grabFrame(src));
  queue = job.catch(() => undefined);
  return job;
}

export function useFirstFrame(src: string): string | undefined {
  const [poster, setPoster] = useState(() => frames.get(src));

  useEffect(() => {
    if (!IS_NATIVE) return;
    const known = frames.get(src);
    if (known) {
      setPoster(known);
      return;
    }
    setPoster(undefined);
    let isCurrent = true;
    firstFrame(src)
      .then((image) => {
        frames.set(src, image);
        if (isCurrent) setPoster(image);
      })
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [src]);

  return IS_NATIVE ? poster ?? BLANK : undefined;
}

/** In the app the poster covers the video until it plays, so it does not need to fetch anything before. */
export const VIDEO_PRELOAD: 'none' | 'metadata' = IS_NATIVE ? 'none' : 'metadata';
