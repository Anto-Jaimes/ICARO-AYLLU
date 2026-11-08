-- Signing back into the same account with the verified phone number.
--
-- The app has no password: the account (user code, verified number, posts) lives on the phone. To close
-- the session and come back, or to move the account to another phone or to a new install, the neighbour
-- types their verified number; the call center calls it and reads a 4-digit code, the same way it
-- verifies numbers. Typing that code gets the same account back (the phone-login function).
--
-- Only a number already verified by its owner can be used, it costs a call like a verification (3 per
-- number and day), the code lasts 15 minutes, and 5 wrong tries lock it.

alter table public.phone_verifications
  add column purpose text not null default 'verify' check (purpose in ('verify', 'login')),
  add column login_user_id uuid references auth.users (id) on delete cascade;

-- Called by the app while signed out, with a short anonymous session.
create function public.start_phone_login(p_phone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid := (select auth.uid());
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_owner uuid;
begin
  if v_caller is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_phone ~ '^519[0-9]{8}$' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^9[0-9]{8}$' then
    return 'invalid';
  end if;
  if exists (select 1 from public.blocked_phones where phone = v_phone) then
    return 'blocked';
  end if;
  select user_id into v_owner from public.verified_phones where phone = v_phone;
  if v_owner is null then
    return 'not_found';
  end if;
  if (select count(*) from public.phone_verifications where phone = v_phone and created_at >= public.lima_day_start()) >= 3 then
    return 'too_many';
  end if;

  update public.phone_verifications set status = 'failed'
  where phone = v_phone and purpose = 'login' and status = 'pending';

  insert into public.phone_verifications (user_id, phone, code, purpose, login_user_id)
  values (
    v_caller,
    v_phone,
    lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 10000)::text, 4, '0'),
    'login',
    v_owner
  );
  return 'ok';
end;
$$;

revoke all on function public.start_phone_login(text) from public, anon;
grant execute on function public.start_phone_login(text) to authenticated;

-- Called only by the phone-login function (secret key). Returns the account to sign into.
create function public.consume_phone_login(p_phone text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_row public.phone_verifications;
begin
  if v_phone ~ '^519[0-9]{8}$' then
    v_phone := substr(v_phone, 3);
  end if;

  select * into v_row
  from public.phone_verifications
  where phone = v_phone and purpose = 'login' and status in ('pending', 'calling', 'called', 'no_answer')
  order by created_at desc
  limit 1
  for update;

  if v_row.id is null or v_row.expires_at < now() then
    return jsonb_build_object('status', 'wrong');
  end if;
  if v_row.attempts >= 5 then
    return jsonb_build_object('status', 'too_many');
  end if;
  if btrim(coalesce(p_code, '')) <> v_row.code then
    update public.phone_verifications set attempts = attempts + 1 where id = v_row.id;
    return jsonb_build_object('status', case when v_row.attempts + 1 >= 5 then 'too_many' else 'wrong' end);
  end if;
  -- The number must still belong to that account (it could have been verified elsewhere meanwhile).
  if not exists (select 1 from public.verified_phones where phone = v_phone and user_id = v_row.login_user_id) then
    return jsonb_build_object('status', 'wrong');
  end if;

  update public.phone_verifications set status = 'verified' where id = v_row.id;
  return jsonb_build_object('status', 'ok', 'user_id', v_row.login_user_id);
end;
$$;

revoke all on function public.consume_phone_login(text, text) from public, anon, authenticated;
grant execute on function public.consume_phone_login(text, text) to service_role;

-- Verifying a number must never use up a sign-in code, and the other way round.
create or replace function public.confirm_phone_verification(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.phone_verifications;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select * into v_row
  from public.phone_verifications
  where user_id = v_user_id and purpose = 'verify' and status in ('pending', 'calling', 'called')
  order by created_at desc
  limit 1
  for update;

  if v_row.id is null then
    return 'none';
  end if;
  if v_row.expires_at < now() then
    return 'expired';
  end if;
  if v_row.attempts >= 5 then
    return 'too_many_attempts';
  end if;

  if btrim(coalesce(p_code, '')) <> v_row.code then
    update public.phone_verifications set attempts = attempts + 1 where id = v_row.id;
    return 'wrong';
  end if;

  update public.phone_verifications set status = 'verified' where id = v_row.id;
  -- A phone belongs to one neighbour: verifying it again on a new install moves it there.
  delete from public.verified_phones where phone = v_row.phone and user_id <> v_user_id;
  insert into public.verified_phones (user_id, phone)
  values (v_user_id, v_row.phone)
  on conflict (user_id) do update set phone = excluded.phone, verified_at = now();
  return 'ok';
end;
$$;
