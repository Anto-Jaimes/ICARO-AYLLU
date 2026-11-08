-- Signing in to the web with the user code from the app.
--
-- The code alone is not enough: the call center says it aloud to whoever receives a call, so that
-- person could pose as the caller. The app also shows a key of 6 digits that lasts 5 minutes and
-- works once; whoever types both is holding the phone. The web then becomes that same user (the
-- web-login function does that), so posts, calls and daily limits are shared with the app.

create table public.web_login_keys (
  user_id uuid primary key references auth.users (id) on delete cascade,
  key_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0
);

-- Every sign-in to the web, so the app can say when it last happened.
create table public.web_logins (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create index web_logins_user_idx on public.web_logins (user_id, created_at desc);

alter table public.web_login_keys enable row level security;
alter table public.web_logins enable row level security;

-- Keys are never readable: only the functions below touch them.
create policy "Each user sees their own web sign-ins" on public.web_logins
  for select to authenticated using (user_id = (select auth.uid()));

grant select on public.web_logins to authenticated;
grant all on public.web_login_keys, public.web_logins to service_role;

-- Called by the app. Only a user with a code (made by the app) can open the web.
create function public.create_web_login_key()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text;
begin
  if v_user is null or not exists (select 1 from public.user_codes where user_id = v_user) then
    return null;
  end if;
  v_key := lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 1000000)::text, 6, '0');
  insert into public.web_login_keys (user_id, key_hash, expires_at, attempts)
  values (v_user, extensions.crypt(v_key, extensions.gen_salt('bf')), now() + interval '5 minutes', 0)
  on conflict (user_id) do update
    set key_hash = excluded.key_hash, expires_at = excluded.expires_at, attempts = 0;
  return v_key;
end;
$$;

-- Called only by the web-login function (secret key). Says the same "wrong" for an unknown code,
-- a wrong key or an expired one, so nobody can learn which codes exist.
create function public.consume_web_login_key(p_code text, p_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_row public.web_login_keys;
begin
  select user_id into v_user from public.user_codes where code = upper(btrim(coalesce(p_code, '')));
  if v_user is null then
    return jsonb_build_object('status', 'wrong');
  end if;

  select * into v_row from public.web_login_keys where user_id = v_user for update;
  if not found or v_row.expires_at < now() then
    return jsonb_build_object('status', 'wrong');
  end if;
  if v_row.attempts >= 5 then
    return jsonb_build_object('status', 'too_many');
  end if;

  if v_row.key_hash <> extensions.crypt(btrim(coalesce(p_key, '')), v_row.key_hash) then
    update public.web_login_keys set attempts = attempts + 1 where user_id = v_user;
    return jsonb_build_object('status', case when v_row.attempts + 1 >= 5 then 'too_many' else 'wrong' end);
  end if;

  delete from public.web_login_keys where user_id = v_user;
  insert into public.web_logins (user_id) values (v_user);
  return jsonb_build_object('status', 'ok', 'user_id', v_user);
end;
$$;

revoke all on function public.create_web_login_key() from public, anon;
grant execute on function public.create_web_login_key() to authenticated;
revoke all on function public.consume_web_login_key(text, text) from public, anon, authenticated;
grant execute on function public.consume_web_login_key(text, text) to service_role;
