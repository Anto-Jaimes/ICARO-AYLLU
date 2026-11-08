/**
 * Notifications on the phone, even with the app closed (Firebase Cloud Messaging, only in the app).
 *
 * The phone tells the server its token and its zone rounded to about 1 km; the server decides who
 * gets each alert (strong quakes near, SENAMHI orange/red zones, possible tsunami on the coast, comments
 * on your news). See supabase/migrations/20261108070000_push_notifications.sql and send-pushes.
 */
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../lib/supabase';

const CHOICE_KEY = 'ayllu_push_choice';
const TOKEN_KEY = 'ayllu_push_token';

export const isPushAvailable = () => Capacitor.isNativePlatform();

export type PushChoice = 'on' | 'off' | null;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // only means asking again next time
  }
}

export const pushChoice = (): PushChoice => (read(CHOICE_KEY) as PushChoice) ?? null;
export const savedPushToken = (): string | null => read(TOKEN_KEY);

let channelsReady = false;

/** Alerts ring and show at the top; comments arrive quieter. */
async function ensureChannels(): Promise<void> {
  if (channelsReady || Capacitor.getPlatform() !== 'android') return;
  await PushNotifications.createChannel({
    id: 'alertas',
    name: 'Alertas de sismos, lluvias y huaicos',
    description: 'Avisos oficiales de tu zona',
    importance: 5,
    visibility: 1,
    vibration: true,
    lights: true
  });
  await PushNotifications.createChannel({
    id: 'vecinos',
    name: 'Comentarios de vecinos',
    description: 'Cuando comentan tus noticias',
    importance: 3,
    visibility: 1
  });
  channelsReady = true;
}

/** Waits for Firebase to give this phone its token (it comes as an event after register()). */
function registerForToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const handles: Promise<{ remove: () => Promise<void> }>[] = [];
    const done = () => handles.forEach((handle) => handle.then((h) => h.remove()));
    const timer = setTimeout(() => {
      done();
      reject(new Error('Firebase no respondió'));
    }, 20_000);
    handles.push(PushNotifications.addListener('registration', ({ value }) => {
      clearTimeout(timer);
      done();
      write(TOKEN_KEY, value);
      resolve(value);
    }));
    handles.push(PushNotifications.addListener('registrationError', ({ error }) => {
      clearTimeout(timer);
      done();
      reject(new Error(error));
    }));
    PushNotifications.register().catch((err) => {
      clearTimeout(timer);
      done();
      reject(err);
    });
  });
}

export type PushEnableResult = 'ok' | 'denied' | 'error';

/** Asks Android for permission, gets the token and remembers the choice. */
export async function enablePush(): Promise<PushEnableResult> {
  if (!isPushAvailable()) return 'error';
  let permission = await PushNotifications.checkPermissions();
  if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
    permission = await PushNotifications.requestPermissions();
  }
  if (permission.receive !== 'granted') {
    write(CHOICE_KEY, 'off');
    return 'denied';
  }
  try {
    await ensureChannels();
    await registerForToken();
    write(CHOICE_KEY, 'on');
    return 'ok';
  } catch {
    return 'error';
  }
}

/** At each start: when alerts are on and still allowed, refresh the token (Firebase may change it). */
export async function resumePush(): Promise<string | null> {
  if (!isPushAvailable() || pushChoice() !== 'on') return null;
  const permission = await PushNotifications.checkPermissions();
  if (permission.receive !== 'granted') return null;
  await ensureChannels();
  return registerForToken().catch(() => savedPushToken());
}

/** Tells the server this phone's zone (rounded there to ~1 km) and language. Needs a session. */
export async function syncPushDevice(place: { lat: number; lng: number } | null, lang: string): Promise<void> {
  const token = savedPushToken();
  if (!token || pushChoice() !== 'on') return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const { error } = await supabase.rpc('register_push_device', {
    p_token: token,
    p_lat: place?.lat ?? null,
    p_lng: place?.lng ?? null,
    p_lang: ['es', 'en', 'qu', 'ay'].includes(lang) ? lang : 'es'
  });
  if (error) throw error;
}

export async function disablePush(): Promise<void> {
  const token = savedPushToken();
  if (token) await supabase.rpc('remove_push_device', { p_token: token });
  await PushNotifications.unregister().catch(() => {});
  write(TOKEN_KEY, null);
  write(CHOICE_KEY, 'off');
}

/** "Ahora no" at the first offer: asked again only from Ayuda. */
export const declinePush = () => write(CHOICE_KEY, 'off');

export type TestPushResult = 'ok' | 'no_device' | 'too_many';

export async function requestTestPush(): Promise<TestPushResult> {
  const token = savedPushToken();
  if (!token) return 'no_device';
  const { data, error } = await supabase.rpc('request_test_push', { p_token: token });
  if (error) throw error;
  return data as TestPushResult;
}

/** Before "Cerrar sesión": the phone keeps zone alerts, not the account's comments. */
export async function forgetPushAccount(): Promise<void> {
  const token = savedPushToken();
  if (token) await supabase.rpc('forget_push_account', { p_token: token });
}

export interface OpenedPush {
  kind: string;
  reportId?: string;
}

/**
 * What to show when a notification arrives with the app open (Android does not draw it then), and
 * where to go when one is tapped. Returns a function that stops listening.
 */
export function listenToPushes(onArrive: (title: string, body: string) => void, onOpen: (push: OpenedPush) => void): () => void {
  if (!isPushAvailable()) return () => {};
  const handles = [
    PushNotifications.addListener('pushNotificationReceived', (push) => onArrive(push.title ?? '', push.body ?? '')),
    PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
      const data = (notification.data ?? {}) as Record<string, string>;
      onOpen({ kind: data.kind ?? '', reportId: data.report_id || undefined });
    })
  ];
  return () => handles.forEach((handle) => handle.then((h) => h.remove()));
}
