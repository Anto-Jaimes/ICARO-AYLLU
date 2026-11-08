/**
 * Signs a phone back into its own account with the verified number. The app sends the number and the
 * 4-digit code the call center read to it; when they match, it gets a one-time sign-in for the account
 * that owns that number (same user code, same posts, same number).
 *
 * JWT verification stays on: the app opens a short anonymous session just to ask for the call and to
 * call this, and that temporary user is deleted afterwards. Like web-login, the account gets an internal
 * address the first time (<id>@usuarios.ayllu.invalid) because Supabase only signs in users with one.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false }
});

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const reply = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (request.method !== 'POST') return reply({ status: 'error' }, 405);

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller.user) return reply({ status: 'error' }, 401);

  const outcome = await signIn(request);
  // The short anonymous session is not needed any more. Only a just-made one: an older user may own posts.
  const isTemporary = caller.user.is_anonymous && Date.now() - new Date(caller.user.created_at).getTime() < 30 * 60_000;
  if (isTemporary && caller.user.id !== outcome.owner) await admin.auth.admin.deleteUser(caller.user.id);
  return reply(outcome.body, outcome.httpStatus);
});

async function signIn(request: Request): Promise<{ body: Record<string, unknown>; httpStatus?: number; owner?: string }> {
  let body: { phone?: unknown; code?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // checked below
  }
  const phone = String(body.phone ?? '').replace(/\D/g, '');
  const code = String(body.code ?? '').replace(/\s/g, '');
  if (!/^(51)?9\d{8}$/.test(phone) || !/^\d{4}$/.test(code)) return { body: { status: 'wrong' } };

  const { data: result, error } = await admin.rpc('consume_phone_login', { p_phone: phone, p_code: code });
  if (error) return { body: { status: 'error' }, httpStatus: 500 };
  if (result.status !== 'ok') return { body: { status: result.status } };

  const owner = result.user_id as string;
  const { data: found, error: findError } = await admin.auth.admin.getUserById(owner);
  if (findError || !found.user) return { body: { status: 'error' }, httpStatus: 500, owner };

  let email = found.user.email;
  if (!email) {
    email = `${owner}@usuarios.ayllu.invalid`;
    const { error: updateError } = await admin.auth.admin.updateUserById(owner, { email, email_confirm: true });
    if (updateError) return { body: { status: 'error', detail: 'address' }, httpStatus: 500, owner };
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (linkError) return { body: { status: 'error', detail: 'link' }, httpStatus: 500, owner };

  return { body: { status: 'ok', token_hash: link.properties.hashed_token }, owner };
}
