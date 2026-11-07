/**
 * AYLLU's free calls. The app only asks: the exchange calls the neighbour back, then calls the
 * number they want and joins them for one minute a day. A program connected to the exchange does
 * the calling (scripts/call-center.ts); the database decides who may call.
 */
import { supabase } from '../lib/supabase';
import { ensureSession } from './postsService';

export type VerificationStart = 'ok' | 'invalid' | 'too_many' | 'blocked';
export type VerificationResult = 'ok' | 'wrong' | 'expired' | 'none' | 'too_many_attempts';
export type CallRequestResult = 'ok' | 'invalid' | 'no_phone' | 'same_number' | 'busy' | 'used_today' | 'too_many' | 'blocked';
export type CallStatus =
  | 'pending' | 'calling_caller' | 'calling_destination' | 'connected'
  | 'completed' | 'caller_no_answer' | 'destination_no_answer' | 'failed';

export const FINAL_STATUSES: CallStatus[] = ['completed', 'caller_no_answer', 'destination_no_answer', 'failed'];

// The program says it is alive every 20 seconds.
const CENTER_FRESH_MS = 60_000;
const QUEUE_KEY = 'ayllu_queued_call';
const QUEUE_VALID_MS = 30 * 60_000;

export interface CallOverview {
  phone: string | null;
  usedToday: boolean;
  isCenterOnline: boolean;
  activeCall: { id: string; status: CallStatus; destination: string } | null;
}

/** Midnight in Peru (UTC-5 all year), when the daily minute starts again. */
function limaDayStart(): Date {
  const lima = new Date(Date.now() - 5 * 3_600_000);
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate(), 5));
}

/** Keeps the nine digits of a Peruvian mobile from whatever was typed or pasted. */
export function cleanPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.startsWith('51') && digits.length === 11 ? digits.slice(2) : digits;
}

export const isMobile = (phone: string) => /^9\d{8}$/.test(phone);

/** "912345678" shown as "912 345 678". */
export const formatPhone = (phone: string) => phone.replace(/^(\d{3})(\d{3})(\d{0,3}).*$/, '$1 $2 $3').trim();

export async function loadCallOverview(): Promise<CallOverview> {
  await ensureSession();
  const [phone, calls, center] = await Promise.all([
    supabase.from('verified_phones').select('phone').maybeSingle(),
    supabase.from('call_requests').select('id, status, destination').gte('created_at', limaDayStart().toISOString()).order('created_at', { ascending: false }),
    supabase.from('call_center_status').select('last_seen').maybeSingle()
  ]);
  if (phone.error) throw phone.error;
  if (calls.error) throw calls.error;

  const today = (calls.data ?? []) as { id: string; status: CallStatus; destination: string }[];
  const lastSeen = center.data?.last_seen ? new Date(center.data.last_seen).getTime() : 0;
  return {
    phone: phone.data?.phone ?? null,
    usedToday: today.some((call) => call.status === 'connected' || call.status === 'completed'),
    isCenterOnline: Date.now() - lastSeen < CENTER_FRESH_MS,
    activeCall: today.find((call) => !FINAL_STATUSES.includes(call.status)) ?? null
  };
}

export async function startVerification(phone: string): Promise<VerificationStart> {
  await ensureSession();
  const { data, error } = await supabase.rpc('start_phone_verification', { p_phone: phone });
  if (error) throw error;
  return data as VerificationStart;
}

export async function confirmVerification(code: string): Promise<VerificationResult> {
  await ensureSession();
  const { data, error } = await supabase.rpc('confirm_phone_verification', { p_code: code });
  if (error) throw error;
  return data as VerificationResult;
}

export interface CallPlace {
  lat: number;
  lng: number;
  name: string;
}

export async function requestCall(destination: string, place: CallPlace | null): Promise<{ status: CallRequestResult; id?: string }> {
  await ensureSession();
  const { data, error } = await supabase.rpc('request_call', {
    p_destination: destination,
    p_lat: place?.lat ?? null,
    p_lng: place?.lng ?? null,
    p_place: place?.name ?? null
  });
  if (error) throw error;
  return data as { status: CallRequestResult; id?: string };
}

/** Follows one call until it ends. Returns a function that stops following it. */
export function watchCall(id: string, onStatus: (status: CallStatus) => void): () => void {
  let isActive = true;
  let last: CallStatus | null = null;
  const check = async () => {
    if (!isActive) return;
    const { data } = await supabase.from('call_requests').select('status').eq('id', id).maybeSingle();
    const status = data?.status as CallStatus | undefined;
    if (status && status !== last) {
      last = status;
      onStatus(status);
    }
    if (isActive && !(status && FINAL_STATUSES.includes(status))) setTimeout(check, 2_000);
  };
  check();
  return () => {
    isActive = false;
  };
}

// Without internet the request waits on the phone and leaves as soon as there is signal again.

export interface QueuedCall {
  destination: string;
  savedAt: number;
}

export function queueCall(destination: string): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify({ destination, savedAt: Date.now() }));
  } catch {
    // without storage the neighbour simply tries again
  }
}

export function queuedCall(): QueuedCall | null {
  try {
    const saved = JSON.parse(localStorage.getItem(QUEUE_KEY) ?? 'null') as QueuedCall | null;
    if (saved && Date.now() - saved.savedAt < QUEUE_VALID_MS) return saved;
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // ignore a damaged entry
  }
  return null;
}

export function clearQueuedCall(): void {
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {
    // nothing to clear
  }
}
