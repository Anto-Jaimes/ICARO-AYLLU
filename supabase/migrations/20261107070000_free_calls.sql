-- Free calls through the exchange. The neighbour asks from the app; the exchange calls them
-- back, then calls the number they want and joins both for one minute a day. A program on a
-- computer connected to the exchange (scripts/call-center.ts) places the calls with the secret
-- key; the app only reaches the functions below.

-- Midnight in Peru: "one minute a day" starts again then, wherever the server is.
create function public.lima_day_start()
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select (date_trunc('day', now() at time zone 'America/Lima')) at time zone 'America/Lima';
$$;

revoke execute on function public.lima_day_start() from public, anon, authenticated;

-- A neighbour proves a phone is theirs by typing the code the exchange reads to them. Without
-- it, anyone could give a stranger's number as their own and make AYLLU call two strangers.
create table public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null check (phone ~ '^9[0-9]{8}$'),
  -- Read aloud by the exchange. There is no policy: the app can never read it.
  code text not null check (code ~ '^[0-9]{4}$'),
  status text not null default 'pending'
    check (status in ('pending', 'calling', 'called', 'no_answer', 'failed', 'verified')),
  attempts integer not null default 0 check (attempts >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '15 minutes'
);

create index phone_verifications_user_idx on public.phone_verifications (user_id, created_at desc);
create index phone_verifications_phone_idx on public.phone_verifications (phone, created_at desc);
create index phone_verifications_pending_idx on public.phone_verifications (created_at) where status = 'pending';

alter table public.phone_verifications enable row level security;

create table public.verified_phones (
  user_id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique check (phone ~ '^9[0-9]{8}$'),
  verified_at timestamptz not null default now()
);

alter table public.verified_phones enable row level security;

create policy verified_phones_select_own on public.verified_phones
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.verified_phones to authenticated;

create table public.call_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  -- Copied when asked: a complaint must still point to the caller after they change their code.
  user_code text not null,
  caller_phone text not null check (caller_phone ~ '^9[0-9]{8}$'),
  destination text not null check (destination ~ '^9[0-9]{8}$'),
  caller_lat double precision check (caller_lat between -90 and 90),
  caller_lng double precision check (caller_lng between -180 and 180),
  caller_place text check (char_length(caller_place) <= 200),
  status text not null default 'pending'
    check (status in ('pending', 'calling_caller', 'calling_destination', 'connected', 'completed',
                      'caller_no_answer', 'destination_no_answer', 'failed')),
  talk_seconds integer check (talk_seconds between 0 and 90),
  recording_path text,
  -- A complaint keeps the recording beyond the 30 days.
  has_complaint boolean not null default false,
  error text check (char_length(error) <= 300),
  created_at timestamptz not null default now(),
  connected_at timestamptz,
  ended_at timestamptz
);

create index call_requests_user_idx on public.call_requests (user_id, created_at desc);
create index call_requests_phone_idx on public.call_requests (caller_phone, created_at desc);
create index call_requests_pending_idx on public.call_requests (created_at) where status = 'pending';
create index call_requests_retention_idx on public.call_requests (created_at)
  where recording_path is not null and not has_complaint;

alter table public.call_requests enable row level security;

create policy call_requests_select_own on public.call_requests
  for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.call_requests to authenticated;

-- The app follows its own call live: ringing you, ringing them, talking, done.
alter publication supabase_realtime add table public.call_requests;

-- Lets the app say "free calls are not available right now" when the program is off.
create table public.call_center_status (
  id integer primary key default 1 check (id = 1),
  last_seen timestamptz not null default now()
);

alter table public.call_center_status enable row level security;

create policy call_center_status_read on public.call_center_status
  for select to anon, authenticated
  using (true);

grant select on public.call_center_status to anon, authenticated;

-- Recordings: private, only the calling program (and later the moderators' panel) reach them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('call-recordings', 'call-recordings', false, 10485760, array['audio/wav']);

-- Answers 'ok', 'invalid' or 'too_many'. Each code call costs the exchange, so three a day.
create function public.start_phone_verification(p_phone text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_day_start timestamptz := public.lima_day_start();
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_phone ~ '^519[0-9]{8}$' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^9[0-9]{8}$' then
    return 'invalid';
  end if;

  if (select count(*) from public.phone_verifications where user_id = v_user_id and created_at >= v_day_start) >= 3
     or (select count(*) from public.phone_verifications where phone = v_phone and created_at >= v_day_start) >= 3 then
    return 'too_many';
  end if;

  update public.phone_verifications
  set status = 'failed'
  where user_id = v_user_id and status = 'pending';

  insert into public.phone_verifications (user_id, phone, code)
  values (
    v_user_id,
    v_phone,
    lpad(((('x' || encode(extensions.gen_random_bytes(4), 'hex'))::bit(32)::bigint & 2147483647) % 10000)::text, 4, '0')
  );
  return 'ok';
end;
$$;

revoke execute on function public.start_phone_verification(text) from public, anon, authenticated;
grant execute on function public.start_phone_verification(text) to authenticated;

-- Answers 'ok', 'wrong', 'expired', 'none' or 'too_many_attempts'. Five tries per code.
create function public.confirm_phone_verification(p_code text)
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
  where user_id = v_user_id and status in ('pending', 'calling', 'called')
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

revoke execute on function public.confirm_phone_verification(text) from public, anon, authenticated;
grant execute on function public.confirm_phone_verification(text) to authenticated;

-- Answers {status: 'ok', id} or a reason: 'invalid', 'no_phone', 'same_number', 'busy',
-- 'used_today' or 'too_many'. The minute counts per neighbour and per phone, so reinstalling
-- the app does not give a new one.
create function public.request_call(
  p_destination text,
  p_lat double precision default null,
  p_lng double precision default null,
  p_place text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_destination text := regexp_replace(coalesce(p_destination, ''), '[^0-9]', '', 'g');
  v_day_start timestamptz := public.lima_day_start();
  v_phone text;
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if v_destination ~ '^519[0-9]{8}$' then
    v_destination := substr(v_destination, 3);
  end if;
  if v_destination !~ '^9[0-9]{8}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  select phone into v_phone from public.verified_phones where user_id = v_user_id;
  if v_phone is null then
    return jsonb_build_object('status', 'no_phone');
  end if;
  if v_destination = v_phone then
    return jsonb_build_object('status', 'same_number');
  end if;

  if exists (
    select 1 from public.call_requests
    where (user_id = v_user_id or caller_phone = v_phone)
      and status in ('pending', 'calling_caller', 'calling_destination', 'connected')
  ) then
    return jsonb_build_object('status', 'busy');
  end if;

  if exists (
    select 1 from public.call_requests
    where (user_id = v_user_id or caller_phone = v_phone)
      and created_at >= v_day_start
      and status in ('connected', 'completed')
  ) then
    return jsonb_build_object('status', 'used_today');
  end if;

  if (
    select count(*) from public.call_requests
    where (user_id = v_user_id or caller_phone = v_phone) and created_at >= v_day_start
  ) >= 3 then
    return jsonb_build_object('status', 'too_many');
  end if;

  insert into public.call_requests (user_id, user_code, caller_phone, destination, caller_lat, caller_lng, caller_place)
  values (v_user_id, public.my_user_code(), v_phone, v_destination, p_lat, p_lng, left(p_place, 200))
  returning id into v_id;

  return jsonb_build_object('status', 'ok', 'id', v_id);
end;
$$;

revoke execute on function public.request_call(text, double precision, double precision, text) from public, anon, authenticated;
grant execute on function public.request_call(text, double precision, double precision, text) to authenticated;
