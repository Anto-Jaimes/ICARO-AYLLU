/**
 * Entering the web with the user code from the app.
 *
 * The app shows a key of 6 digits that lasts 5 minutes. On the web, code + key turn the browser into
 * that same user (supabase/functions/web-login), so posts, calls and daily limits are shared. The code
 * alone is not enough: the call center says it aloud to the people the user calls.
 */
import { supabase } from '../lib/supabase';
import { ensureSession } from './postsService';

export const WEB_KEY_MINUTES = 5;

/** In the app: a new key for the web. Null when this user has no code yet. */
export async function createWebLoginKey(): Promise<string | null> {
  await ensureSession();
  const { data, error } = await supabase.rpc('create_web_login_key');
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** In the app: when this user last entered the web, or null. */
export async function lastWebLogin(): Promise<string | null> {
  const { data, error } = await supabase.from('web_logins').select('created_at').order('created_at', { ascending: false }).limit(1);
  if (error) throw error;
  return data?.[0]?.created_at ?? null;
}

/** In the app: closes every session of this user except the app's own, so the web has to enter again. */
export async function closeWebSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' });
  if (error) throw error;
}

export type WebLoginResult = 'ok' | 'wrong' | 'too_many' | 'error';

export const WEB_LOGIN_PROBLEMS: Record<Exclude<WebLoginResult, 'ok'>, string> = {
  wrong: 'El código o la clave no coinciden, o la clave ya venció. Pide una clave nueva en la app.',
  too_many: 'Demasiados intentos con esa clave. Pide una clave nueva en la app.',
  error: 'No se pudo entrar. Revisa tu internet y vuelve a intentar.'
};

/** On the web: enters as the owner of the code. */
export async function signInToWeb(code: string, key: string): Promise<WebLoginResult> {
  // A fresh, short anonymous session only to call the function, which deletes it afterwards. Never an
  // older one: that user may have posts from before the web asked for a code.
  await supabase.auth.signOut({ scope: 'local' });
  const { error: anonymousError } = await supabase.auth.signInAnonymously();
  if (anonymousError) throw anonymousError;
  const { data, error } = await supabase.functions.invoke<{ status: WebLoginResult; token_hash?: string }>('web-login', {
    body: { code: code.trim().toUpperCase(), key: key.replace(/\s/g, '') }
  });
  if (error || !data) {
    await supabase.auth.signOut({ scope: 'local' });
    return 'error';
  }
  if (data.status !== 'ok' || !data.token_hash) {
    await supabase.auth.signOut({ scope: 'local' });
    return data.status === 'ok' ? 'error' : data.status;
  }
  const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: data.token_hash });
  if (verifyError) {
    await supabase.auth.signOut({ scope: 'local' });
    return 'error';
  }
  return 'ok';
}

/** On the web: leaves this browser only. "local", so the app on the phone stays signed in. */
export async function signOutOfWeb(): Promise<void> {
  await supabase.auth.signOut({ scope: 'local' });
}
