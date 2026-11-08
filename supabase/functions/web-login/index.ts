/**
 * Signs the web in as the neighbour who holds the phone. The web sends the user code and the key of
 * 6 digits that the app shows; when they match, it gets a one-time sign-in for that same user, so
 * posts, calls and daily limits are shared with the app.
 *
 * JWT verification stays on: the browser opens a short anonymous session just to call this, and that
 * temporary user is deleted once the sign-in works.
 *
 * Supabase can only issue a one-time sign-in to a user with an address, so the user gets an internal
 * one the first time: <id>@usuarios.ayllu.invalid (".invalid" can never receive mail). No email is sent.
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
  // The short anonymous session that called this is not needed any more, whatever happened. Only a
  // just-made one: an older anonymous user may own posts.
  const isTemporary = caller.user.is_anonymous && Date.now() - new Date(caller.user.created_at).getTime() < 10 * 60_000;
  if (isTemporary && caller.user.id !== outcome.owner) await admin.auth.admin.deleteUser(caller.user.id);
  return reply(outcome.body, outcome.httpStatus);
});

async function signIn(request: Request): Promise<{ body: Record<string, unknown>; httpStatus?: number; owner?: string }> {
  let body: { code?: unknown; key?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    // checked below
  }
  const code = String(body.code ?? '').trim();
  const key = String(body.key ?? '').replace(/\s/g, '');
  if (!/^[A-Za-z0-9]{4,10}$/.test(code) || !/^\d{6}$/.test(key)) return { body: { status: 'wrong' } };

  const { data: result, error } = await admin.rpc('consume_web_login_key', { p_code: code, p_key: key });
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
