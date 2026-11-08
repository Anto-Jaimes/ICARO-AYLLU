-- A sign-in code belongs to the account it opens, not to the short anonymous session that asked for it.
-- Tied to that session, deleting it after a wrong try (phone-login does) deleted the code too: the
-- neighbour could not try again, and the daily limit of 3 calls per number stopped counting.
create or replace function public.start_phone_login(p_phone text)
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
    v_owner,
    v_phone,
    lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 10000)::text, 4, '0'),
    'login',
    v_owner
  );
  return 'ok';
end;
$$;
