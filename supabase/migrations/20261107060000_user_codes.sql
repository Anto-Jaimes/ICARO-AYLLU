-- Every neighbour gets a short code that tells them apart from everyone else. Free calls
-- announce it ("te llama el usuario K7P4QX") and complaints point to it. It can be changed,
-- but never to a code someone else has, and never to one that poses as an authority.

create table public.user_codes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  last_changed_at timestamptz,
  constraint user_codes_code_format check (code ~ '^[A-Z0-9]{4,10}$')
);

-- Codes are stored in capitals only, so this also makes "ab12" and "AB12" the same code.
create unique index user_codes_code_key on public.user_codes (code);

alter table public.user_codes enable row level security;

create policy user_codes_select_own on public.user_codes
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.user_codes to authenticated;

-- Returns the caller's code, creating one the first time. Letters and digits that cannot be
-- confused with each other on a small screen or when read aloud (no 0/O, 1/I).
create function public.my_user_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text;
  v_alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select code into v_code from public.user_codes where user_id = v_user_id;
  if v_code is not null then
    return v_code;
  end if;

  loop
    select string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1), '')
      into v_code
      from generate_series(1, 6);
    begin
      insert into public.user_codes (user_id, code) values (v_user_id, v_code);
      return v_code;
    exception when unique_violation then
      -- Either the code was taken (try another) or a parallel call already created this user's.
      select code into v_code from public.user_codes where user_id = v_user_id;
      if v_code is not null then
        return v_code;
      end if;
    end;
  end loop;
end;
$$;

revoke execute on function public.my_user_code() from public, anon, authenticated;
grant execute on function public.my_user_code() to authenticated;

-- Answers 'ok', 'invalid', 'reserved', 'taken' or 'too_soon'. The first change is free; after
-- that once a day, so nobody can hop between codes to dodge a complaint.
create function public.change_user_code(p_code text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_code text := upper(btrim(coalesce(p_code, '')));
  v_current public.user_codes;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_code !~ '^[A-Z0-9]{4,10}$' then
    return 'invalid';
  end if;

  -- The code is read aloud to whoever answers a call: it must not pose as the police,
  -- a prosecutor, a rescue service, a bank or the app itself.
  if v_code ~ '(POLIC|PNP|FISCA|SERENA|BOMBER|EJERC|MARINA|INDECI|SAMU|MINSA|ESSALUD|SUNAT|RENIEC|JUEZ|JUZGA|BANCO|BCP|BBVA|INTERBANK|YAPE|PLIN|AYLLU|ADMIN|MODERA|SOPORTE)' then
    return 'reserved';
  end if;

  perform public.my_user_code();
  select * into v_current from public.user_codes where user_id = v_user_id;

  if v_current.code = v_code then
    return 'ok';
  end if;

  if v_current.last_changed_at > now() - interval '1 day' then
    return 'too_soon';
  end if;

  begin
    update public.user_codes
    set code = v_code, last_changed_at = now()
    where user_id = v_user_id;
  exception when unique_violation then
    return 'taken';
  end;

  return 'ok';
end;
$$;

revoke execute on function public.change_user_code(text) from public, anon, authenticated;
grant execute on function public.change_user_code(text) to authenticated;
