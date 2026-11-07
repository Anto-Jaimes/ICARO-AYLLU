/** The neighbour's own code: tells them apart from everyone else in calls and complaints. */

import { supabase } from '../lib/supabase';
import { ensureSession } from './postsService';

const CACHE_KEY = 'ayllu_user_code';

export type CodeChange = 'ok' | 'invalid' | 'reserved' | 'taken' | 'too_soon';

export const CODE_CHANGE_PROBLEMS: Record<Exclude<CodeChange, 'ok'>, string> = {
  invalid: 'Usa de 4 a 10 letras o números, sin espacios ni tildes.',
  reserved: 'Ese código no se puede usar: parece de una autoridad, un banco o de AYLLU.',
  taken: 'Ese código ya lo tiene otro vecino. Prueba con otro.',
  too_soon: 'Ya cambiaste tu código hoy. Podrás cambiarlo otra vez mañana.'
};

function remember(code: string): void {
  try {
    localStorage.setItem(CACHE_KEY, code);
  } catch {
    // the code still works, it just will not show without internet
  }
}

/** The last known code, so it can be shown without internet. */
export function cachedUserCode(): string | null {
  try {
    return localStorage.getItem(CACHE_KEY);
  } catch {
    return null;
  }
}

export async function fetchUserCode(): Promise<string> {
  await ensureSession();
  const { data, error } = await supabase.rpc('my_user_code');
  if (error) throw error;
  remember(data as string);
  return data as string;
}

export async function changeUserCode(code: string): Promise<CodeChange> {
  await ensureSession();
  const { data, error } = await supabase.rpc('change_user_code', { p_code: code });
  if (error) throw error;
  if (data === 'ok') remember(code.trim().toUpperCase());
  return data as CodeChange;
}
