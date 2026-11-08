/**
 * Closing the session in the app, and coming back to the same account with the verified number.
 *
 * The app has no password: the account (user code, verified number, posts) lives on the phone. Signing
 * out leaves a mark so the app does not quietly make a new account; to come back, the call center calls
 * the verified number and reads a 4-digit code (supabase/functions/phone-login).
 */
import { supabase } from '../lib/supabase';

const SIGNED_OUT_KEY = 'ayllu_signed_out';

export function isSignedOut(): boolean {
  try {
    return localStorage.getItem(SIGNED_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

function setSignedOut(value: boolean): void {
  try {
    if (value) localStorage.setItem(SIGNED_OUT_KEY, '1');
    else localStorage.removeItem(SIGNED_OUT_KEY);
  } catch {
    // only affects whether the sign-in screen shows at the next start
  }
}

/** The account's verified number, to tell the neighbour where we will call them back. */
export async function myVerifiedPhone(): Promise<string | null> {
  const { data } = await supabase.from('verified_phones').select('phone').maybeSingle();
  return data?.phone ?? null;
}

/** Closes the session on this phone only; the account stays as it is, waiting for the number. */
export async function signOutOfApp(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
  setSignedOut(true);
  try {
    localStorage.removeItem('ayllu_user_code');
    localStorage.removeItem('ayllu_queued_call');
  } catch {
    // stale copies only
  }
}

/** Starting again with a new account (new code); the previous one stays reachable with its number. */
export function startNewAccount(): void {
  setSignedOut(false);
}

export async function isCallCenterOnline(): Promise<boolean> {
  const { data } = await supabase.from('call_center_status').select('last_seen').maybeSingle();
  return !!data?.last_seen && Date.now() - new Date(data.last_seen).getTime() < 60_000;
}

export type PhoneLoginStart = 'ok' | 'invalid' | 'blocked' | 'not_found' | 'too_many';

export const PHONE_LOGIN_START_PROBLEMS: Record<Exclude<PhoneLoginStart, 'ok'>, string> = {
  invalid: 'Escribe tu celular: 9 números que empiezan con 9.',
  blocked: 'Este número no puede usar AYLLU por una denuncia.',
  not_found: 'Ese número no está verificado en ninguna cuenta de AYLLU. Si nunca lo verificaste, empieza con una cuenta nueva.',
  too_many: 'Ya pedimos 3 llamadas hoy para ese número. Vuelve a intentar mañana.'
};

/** Asks the call center to call the verified number with a code (short anonymous session meanwhile). */
export async function startPhoneLogin(phone: string): Promise<PhoneLoginStart> {
  // Signed out, any session left is the short one from an earlier try: reuse it instead of making more.
  // Otherwise (a brand-new install) the account on the phone is never used for this: phone-login
  // deletes the short session afterwards.
  const { data: current } = await supabase.auth.getSession();
  if (!current.session || !isSignedOut()) {
    await supabase.auth.signOut({ scope: 'local' });
    const { error: anonymousError } = await supabase.auth.signInAnonymously();
    if (anonymousError) throw anonymousError;
  }
  const { data, error } = await supabase.rpc('start_phone_login', { p_phone: phone });
  if (error) throw error;
  return data as PhoneLoginStart;
}

export type PhoneLoginResult = 'ok' | 'wrong' | 'too_many' | 'error';

export const PHONE_LOGIN_PROBLEMS: Record<Exclude<PhoneLoginResult, 'ok'>, string> = {
  wrong: 'Ese código no coincide o ya venció. Revísalo, o pide otra llamada.',
  too_many: 'Demasiados intentos con ese código. Pide otra llamada.',
  error: 'No se pudo entrar. Revisa tu internet y vuelve a intentar.'
};

/** Enters the account that owns the number with the code the call center read. */
export async function finishPhoneLogin(phone: string, code: string): Promise<PhoneLoginResult> {
  // After a wrong try the function deletes the short session; a new one is made for the next try.
  const { data: current } = await supabase.auth.getSession();
  if (!current.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
  const { data, error } = await supabase.functions.invoke<{ status: PhoneLoginResult; token_hash?: string }>('phone-login', {
    body: { phone, code: code.replace(/\s/g, '') }
  });
  if (error || !data || data.status !== 'ok' || !data.token_hash) {
    await supabase.auth.signOut({ scope: 'local' });
    return data && data.status !== 'ok' ? data.status : 'error';
  }
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: data.token_hash });
  if (verifyError) {
    await supabase.auth.signOut({ scope: 'local' });
    return 'error';
  }
  setSignedOut(false);
  return 'ok';
}
